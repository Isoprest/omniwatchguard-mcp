import { createMcpHandler } from "agents/mcp/server";
import { createServer } from "./server";

// Varianta gazduita: Cloudflare Worker la https://mcp.omniwatchguard.com/mcp.
// Cheia API vine din header-ul Authorization al fiecarei cereri.
const handler = createMcpHandler(
  (context: { requestInfo?: Request }) => createServer(context.requestInfo?.headers.get("Authorization") ?? null),
  { allowedHostnames: ["mcp.omniwatchguard.com", "omniwatchguard-mcp.isoprest.workers.dev"] },
);

export default {
  fetch(request: Request, env: unknown, ctx: ExecutionContext) {
    return handler(request, env, ctx);
  },
} satisfies ExportedHandler;
