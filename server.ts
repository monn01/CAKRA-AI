import { createServer } from "node:http";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

// Next.js CLI (`next dev`/`next start`) loads .env/.env.local automatically,
// but that only happens inside app.prepare() — too late for code imported
// eagerly at the top of this file (like the socket server, which reads
// process.env.DATABASE_URL at module-load time to build the Prisma adapter).
// Loading explicitly here, before any other import evaluates, fixes that.
loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

const next = (await import("next")).default;
const { initSocketServer } = await import("./src/lib/socket/server.ts");

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  initSocketServer(httpServer);

  httpServer.listen(port, () => {
    console.log(
      `> Server listening at http://localhost:${port} as ${dev ? "development" : process.env.NODE_ENV}`
    );
  });
});
