import { McpServer } from "@modelcontextprotocol/server";
import { createMcpHandler } from "agents/mcp/server";
import { z } from "zod";

const API_BASE = "https://omniwatchguard.com";

function authHeaderFrom(context: { requestInfo?: Request }): string | null {
  return context.requestInfo?.headers.get("Authorization") ?? null;
}

async function owgFetch(auth: string | null, path: string, init: RequestInit = {}): Promise<any> {
  if (!auth) {
    return { error: "Lipseste cheia API. Clientul MCP trebuie sa trimita header-ul Authorization: Bearer owg_live_..." };
  }
  const resp = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init.headers as Record<string, string> | undefined),
      Authorization: auth,
      "Content-Type": "application/json",
    },
  });
  const raw = await resp.text();
  let data: any;
  try { data = raw ? JSON.parse(raw) : {}; } catch { data = raw; }
  if (!resp.ok) {
    return { error: (data && data.error) || `Eroare API OmniWatchGuard (status ${resp.status}).` };
  }
  return data;
}

function textResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function createServer(context: { requestInfo?: Request }) {
  const auth = authHeaderFrom(context);

  const server = new McpServer({
    name: "omniwatchguard",
    version: "1.0.0",
  });

  server.registerTool(
    "list_monitors",
    {
      description: "Listeaza toate monitoarele OmniWatchGuard ale userului autentificat, cu numarul de schimbari din ultimele 7 zile si ultima schimbare detectata.",
      inputSchema: {},
    },
    async () => textResult(await owgFetch(auth, "/api/monitors"))
  );

  server.registerTool(
    "get_monitor",
    {
      description: "Returneaza detaliile complete ale unui monitor si ultimele 20 de rezultate de verificare.",
      inputSchema: { id: z.number().describe("ID-ul monitorului") },
    },
    async ({ id }) => textResult(await owgFetch(auth, `/api/monitors/${id}`))
  );

  server.registerTool(
    "create_monitor",
    {
      description: "Creeaza un monitor nou pentru o pagina web. Tipuri uzuale: text, price, stock, visual, css, api, seo. Numarul de monitoare si frecventele disponibile depind de planul userului.",
      inputSchema: {
        url: z.string().describe("URL-ul complet al paginii de monitorizat"),
        name: z.string().optional().describe("Nume afisat pentru monitor (implicit: domeniul din URL)"),
        type: z.string().optional().describe("Tipul de monitorizare: text, price, stock, visual, css, api sau seo. Implicit: text"),
        selector: z.string().optional().describe("Selector CSS optional pentru a limita zona monitorizata pe pagina"),
        frequency: z.number().optional().describe("Interval de verificare in minute (5, 15, 30 sau 60, in functie de plan)"),
        price_threshold_type: z.string().optional().describe("Pentru type=price: 'any', 'increase' sau 'decrease'"),
        price_threshold_value: z.number().optional().describe("Pragul de pret care declanseaza alerta"),
        stock_alert_type: z.string().optional().describe("Pentru type=stock: 'any', 'in_stock' sau 'out_of_stock'"),
        notify_telegram: z.string().optional().describe("Chat ID Telegram pentru alerte pe acest monitor"),
      },
    },
    async (input) =>
      textResult(
        await owgFetch(auth, "/api/monitors", {
          method: "POST",
          body: JSON.stringify(input),
        })
      )
  );

  server.registerTool(
    "update_monitor",
    {
      description: "Actualizeaza campuri ale unui monitor existent: nume, url, selector, frecventa sau praguri de pret/stoc.",
      inputSchema: {
        id: z.number().describe("ID-ul monitorului"),
        name: z.string().optional(),
        url: z.string().optional(),
        selector: z.string().optional(),
        frequency: z.number().optional(),
        price_threshold_type: z.string().optional(),
        price_threshold_value: z.number().optional(),
        stock_alert_type: z.string().optional(),
      },
    },
    async ({ id, ...fields }) =>
      textResult(
        await owgFetch(auth, `/api/monitors/${id}`, {
          method: "PATCH",
          body: JSON.stringify(fields),
        })
      )
  );

  server.registerTool(
    "set_monitor_status",
    {
      description: "Pune pe pauza sau reactiveaza un monitor existent.",
      inputSchema: {
        id: z.number().describe("ID-ul monitorului"),
        status: z.enum(["active", "paused"]).describe("Noul status al monitorului"),
      },
    },
    async ({ id, status }) =>
      textResult(
        await owgFetch(auth, `/api/monitors/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ status }),
        })
      )
  );

  server.registerTool(
    "delete_monitor",
    {
      description: "Sterge un monitor existent (soft-delete).",
      inputSchema: { id: z.number().describe("ID-ul monitorului") },
    },
    async ({ id }) => textResult(await owgFetch(auth, `/api/monitors/${id}`, { method: "DELETE" }))
  );

  server.registerTool(
    "list_alerts",
    {
      description: "Listeaza ultimele notificari trimise userului (email, webhook, slack, discord, telegram), cu detalii despre schimbarea care a declansat fiecare alerta.",
      inputSchema: {
        type: z
          .enum(["email", "webhook", "slack", "discord", "telegram"])
          .optional()
          .describe("Filtru optional dupa canalul de notificare"),
      },
    },
    async ({ type }) => {
      const qs = type ? `?type=${encodeURIComponent(type)}` : "";
      return textResult(await owgFetch(auth, `/api/notifications${qs}`));
    }
  );

  return server;
}

const handler = createMcpHandler(createServer, {
  allowedHostnames: ["mcp.omniwatchguard.com", "omniwatchguard-mcp.isoprest.workers.dev"],
});

export default {
  fetch(request: Request, env: unknown, ctx: ExecutionContext) {
    return handler(request, env, ctx);
  },
} satisfies ExportedHandler;
