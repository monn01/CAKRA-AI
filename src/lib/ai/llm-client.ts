export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMResponse {
  content: string;
  model: string;
  provider: string;
}

export class LLMError extends Error {
  provider: string;
  status?: number;

  constructor(message: string, provider: string, status?: number) {
    super(message);
    this.name = "LLMError";
    this.provider = provider;
    this.status = status;
  }
}

// ---- Rate limiting: batasi jumlah request LLM paralel supaya tidak membanjiri
// Ollama lokal / kena rate limit provider cloud. ----
class Semaphore {
  private available: number;
  private queue: (() => void)[] = [];

  constructor(max: number) {
    this.available = max;
  }

  async acquire() {
    if (this.available > 0) {
      this.available--;
      return;
    }
    await new Promise<void>((resolve) => {
      this.queue.push(() => {
        this.available--;
        resolve();
      });
    });
  }

  release() {
    this.available++;
    const next = this.queue.shift();
    if (next) next();
  }
}

const llmSemaphore = new Semaphore(2);

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  provider: string,
  retries = 2
): Promise<Response> {
  await llmSemaphore.acquire();
  try {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, init);

        if (!response.ok) {
          const body = await response.text();
          if (response.status >= 500 && attempt < retries) {
            await delay(500 * 2 ** attempt);
            continue;
          }
          throw new LLMError(
            `${provider} mengembalikan error ${response.status}: ${body}`,
            provider,
            response.status
          );
        }

        return response;
      } catch (err) {
        if (err instanceof LLMError) throw err;
        if (attempt < retries) {
          await delay(500 * 2 ** attempt);
          continue;
        }
        throw new LLMError(
          `Gagal menghubungi ${provider}: ${(err as Error).message}`,
          provider
        );
      }
    }
    throw new LLMError(`Gagal menghubungi ${provider} setelah beberapa percobaan`, provider);
  } finally {
    llmSemaphore.release();
  }
}

async function* streamLines(response: Response): AsyncGenerator<string> {
  if (!response.body) return;
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (line.trim()) yield line;
    }
  }
  if (buffer.trim()) yield buffer;
}

// ---- Ollama ----

function ollamaConfig() {
  return {
    baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
    model: process.env.OLLAMA_MODEL || "qwen2.5:7b",
  };
}

async function callOllama(messages: LLMMessage[]): Promise<LLMResponse> {
  const { baseUrl, model } = ollamaConfig();

  const response = await fetchWithRetry(
    `${baseUrl}/api/chat`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        options: { temperature: 0.7, num_predict: 4096 },
      }),
    },
    "ollama"
  );

  const data = await response.json();
  return { content: data.message.content, model, provider: "ollama" };
}

async function* streamOllama(messages: LLMMessage[]): AsyncGenerator<string> {
  const { baseUrl, model } = ollamaConfig();

  const response = await fetchWithRetry(
    `${baseUrl}/api/chat`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        options: { temperature: 0.7, num_predict: 4096 },
      }),
    },
    "ollama"
  );

  for await (const line of streamLines(response)) {
    try {
      const data = JSON.parse(line);
      if (data.message?.content) yield data.message.content as string;
      if (data.done) return;
    } catch {
      // baris tidak lengkap/rusak — lewati
    }
  }
}

// ---- OpenAI-compatible (Qwen, OpenRouter) ----

async function callOpenAICompatible(
  url: string,
  headers: Record<string, string>,
  model: string,
  messages: LLMMessage[],
  provider: string
): Promise<LLMResponse> {
  const response = await fetchWithRetry(
    url,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 4096 }),
    },
    provider
  );

  const data = await response.json();
  return { content: data.choices[0].message.content, model, provider };
}

async function* streamOpenAICompatible(
  url: string,
  headers: Record<string, string>,
  model: string,
  messages: LLMMessage[],
  provider: string
): AsyncGenerator<string> {
  const response = await fetchWithRetry(
    url,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 4096, stream: true }),
    },
    provider
  );

  for await (const line of streamLines(response)) {
    if (!line.startsWith("data:")) continue;
    const payload = line.slice(5).trim();
    if (payload === "[DONE]") return;

    try {
      const data = JSON.parse(payload);
      const delta = data.choices?.[0]?.delta?.content;
      if (delta) yield delta as string;
    } catch {
      // baris tidak lengkap/rusak — lewati
    }
  }
}

function qwenConfig() {
  const apiKey = process.env.QWEN_API_KEY;
  if (!apiKey) throw new LLMError("QWEN_API_KEY belum diatur", "qwen");
  return {
    apiKey,
    baseUrl: process.env.QWEN_BASE_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1",
    model: process.env.QWEN_MODEL || "qwen-plus",
  };
}

function openRouterConfig() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new LLMError("OPENROUTER_API_KEY belum diatur", "openrouter");
  return {
    apiKey,
    model: process.env.OPENROUTER_MODEL || "qwen/qwen-2.5-72b-instruct",
  };
}

// ---- Entry point — switch provider via env LLM_PROVIDER ----

export async function callLLM(messages: LLMMessage[]): Promise<LLMResponse> {
  const provider = process.env.LLM_PROVIDER || "ollama";

  switch (provider) {
    case "ollama":
      return callOllama(messages);

    case "qwen": {
      const { apiKey, baseUrl, model } = qwenConfig();
      return callOpenAICompatible(
        `${baseUrl}/chat/completions`,
        { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        model,
        messages,
        "qwen"
      );
    }

    case "openrouter": {
      const { apiKey, model } = openRouterConfig();
      return callOpenAICompatible(
        "https://openrouter.ai/api/v1/chat/completions",
        { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        model,
        messages,
        "openrouter"
      );
    }

    default:
      throw new LLMError(`Provider LLM tidak dikenal: ${provider}`, provider);
  }
}

export async function* streamLLM(messages: LLMMessage[]): AsyncGenerator<string> {
  const provider = process.env.LLM_PROVIDER || "ollama";

  switch (provider) {
    case "ollama":
      yield* streamOllama(messages);
      return;

    case "qwen": {
      const { apiKey, baseUrl, model } = qwenConfig();
      yield* streamOpenAICompatible(
        `${baseUrl}/chat/completions`,
        { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        model,
        messages,
        "qwen"
      );
      return;
    }

    case "openrouter": {
      const { apiKey, model } = openRouterConfig();
      yield* streamOpenAICompatible(
        "https://openrouter.ai/api/v1/chat/completions",
        { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        model,
        messages,
        "openrouter"
      );
      return;
    }

    default:
      throw new LLMError(`Provider LLM tidak dikenal: ${provider}`, provider);
  }
}

// LLM sering bungkus JSON dalam markdown fence — helper ini strip itu
export function parseLLMJson<T>(raw: string): T {
  const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new LLMError(
      "Gagal parse hasil LLM sebagai JSON. Model mungkin mengembalikan format yang tidak sesuai.",
      process.env.LLM_PROVIDER || "unknown"
    );
  }
}
