import { McpServer } from "@modelcontextprotocol/server";
import { createMcpHandler } from "agents/mcp/server";
import { z } from "zod";

const API_BASE = "https://omniwatchguard.com";

function authHeaderFrom(context: { requestInfo?: Request }): string | null {
  return context.requestInfo?.headers.get("Authorization") ?? null;
}

async function owgFetch(auth: string | null, path: string, init: RequestInit = {}): Promise<any> {
  if (!auth) {
    return { error: "Missing API key. The MCP client must send the header Authorization: Bearer owg_live_... (API keys are available on the Pro and Agency plans)." };
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
    return { error: (data && data.error) || `OmniWatchGuard API error (status ${resp.status}).` };
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
      description: "List all OmniWatchGuard monitors of the authenticated user, with the number of changes in the last 7 days and the last detected change.",
      inputSchema: {},
    },
    async () => textResult(await owgFetch(auth, "/api/monitors"))
  );

  server.registerTool(
    "get_monitor",
    {
      description: "Get the full details of one monitor and its last 20 check results.",
      inputSchema: { id: z.number().describe("Monitor ID") },
    },
    async ({ id }) => textResult(await owgFetch(auth, `/api/monitors/${id}`))
  );

  server.registerTool(
    "create_monitor",
    {
      description: "Create a new monitor for a web page. Types: text, price, stock, css, api, seo, ssl (tech_stack and whois need the matching add-on). The number of monitors and the available check intervals depend on the user's plan.",
      inputSchema: {
        url: z.string().describe("Full URL of the page to monitor"),
        name: z.string().optional().describe("Display name for the monitor (default: the domain of the URL)"),
        type: z.string().optional().describe("Monitor type: text, price, stock, css, api, seo or ssl. Default: text"),
        selector: z.string().optional().describe("Optional CSS selector that limits monitoring to one element of the page (used with type css)"),
        frequency: z.number().optional().describe("Check interval in minutes: 60 on Starter; 15, 30 or 60 on Pro; 5, 15, 30 or 60 on Agency"),
        price_threshold_type: z.string().optional().describe("For type=price: 'any', 'increase' or 'decrease'"),
        price_threshold_value: z.number().optional().describe("Price threshold that triggers an alert"),
        stock_alert_type: z.string().optional().describe("For type=stock: 'any', 'in_stock' or 'out_of_stock'"),
        notify_telegram: z.string().optional().describe("Telegram chat ID for this monitor's alerts (Agency plan)"),
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
      description: "Update fields of an existing monitor: name, URL, selector, check interval or price/stock thresholds.",
      inputSchema: {
        id: z.number().describe("Monitor ID"),
        name: z.string().optional().describe("New display name"),
        url: z.string().optional().describe("New page URL"),
        selector: z.string().optional().describe("New CSS selector"),
        frequency: z.number().optional().describe("New check interval in minutes (allowed values depend on the plan)"),
        price_threshold_type: z.string().optional().describe("For price monitors: 'any', 'increase' or 'decrease'"),
        price_threshold_value: z.number().optional().describe("For price monitors: threshold that triggers an alert"),
        stock_alert_type: z.string().optional().describe("For stock monitors: 'any', 'in_stock' or 'out_of_stock'"),
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
      description: "Pause or resume an existing monitor.",
      inputSchema: {
        id: z.number().describe("Monitor ID"),
        status: z.enum(["active", "paused"]).describe("New status of the monitor"),
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
      description: "Delete an existing monitor.",
      inputSchema: { id: z.number().describe("Monitor ID") },
    },
    async ({ id }) => textResult(await owgFetch(auth, `/api/monitors/${id}`, { method: "DELETE" }))
  );

  server.registerTool(
    "list_alerts",
    {
      description: "List the latest alerts sent to the user (email, webhook, Slack, Discord, Telegram), with details of the change that triggered each one.",
      inputSchema: {
        type: z
          .enum(["email", "webhook", "slack", "discord", "telegram"])
          .optional()
          .describe("Optional filter by alert channel"),
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
