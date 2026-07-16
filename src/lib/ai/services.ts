import { callLLM, parseLLMJson } from "./llm-client.ts";
import { PROMPTS } from "./prompts.ts";

export interface GlossaryItem {
  term: string;
  definition: string;
}

export interface SummaryResult {
  summary: string;
  keyPoints: string[];
  glossary: GlossaryItem[];
}

export async function generateSummary(
  transcript: string,
  subject: string,
  grade: string,
  topic: string
): Promise<SummaryResult> {
  const response = await callLLM([
    {
      role: "system",
      content: "Kamu asisten pendidikan Indonesia yang ahli merangkum materi. Output HANYA JSON valid.",
    },
    { role: "user", content: PROMPTS.summarize(transcript, subject, grade, topic) },
  ]);
  return parseLLMJson<SummaryResult>(response.content);
}

export interface MindMapNode {
  label: string;
  detail?: string;
  children?: MindMapNode[];
}

export interface MindMapResult {
  topic: string;
  children: MindMapNode[];
}

export async function generateMindMap(
  transcript: string,
  subject: string,
  topic: string
): Promise<MindMapResult> {
  const response = await callLLM([
    {
      role: "system",
      content: "Kamu menghasilkan struktur mind map dalam format JSON. Output HANYA JSON valid.",
    },
    { role: "user", content: PROMPTS.mindmap(transcript, subject, topic) },
  ]);
  return parseLLMJson<MindMapResult>(response.content);
}

export type QuizDifficulty = "mudah" | "sedang" | "sulit";

export interface QuizQuestionResult {
  question: string;
  options: string[];
  correct: string;
  explanation: string;
  difficulty: QuizDifficulty;
}

export async function generateQuiz(
  transcript: string,
  subject: string,
  grade: string,
  count: number = 10
): Promise<QuizQuestionResult[]> {
  const response = await callLLM([
    {
      role: "system",
      content: "Kamu membuat soal quiz pendidikan. Output HANYA JSON array valid.",
    },
    { role: "user", content: PROMPTS.quiz(transcript, subject, grade, count) },
  ]);
  return parseLLMJson<QuizQuestionResult[]>(response.content);
}
