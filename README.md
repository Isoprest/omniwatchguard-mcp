# OmniWatchGuard MCP Server

[![smithery badge](https://smithery.ai/badge/isoprest/omniwatchguard)](https://smithery.ai/servers/isoprest/omniwatchguard)
[![Isoprest/omniwatchguard-mcp MCP server](https://glama.ai/mcp/servers/Isoprest/omniwatchguard-mcp/badges/score.svg)](https://glama.ai/mcp/servers/Isoprest/omniwatchguard-mcp)

Model Context Protocol (MCP) server for [OmniWatchGuard](https://omniwatchguard.com/en), a website change monitoring service. Connect Claude, Cursor or any MCP client to your OmniWatchGuard account and manage monitors and alerts in plain language.

- **Endpoint:** `https://mcp.omniwatchguard.com/mcp`
- **Transport:** Streamable HTTP (stateless)
- **Authentication:** OmniWatchGuard API key, sent as a Bearer token

## What you can do

- List and inspect your monitors
- Create monitors for text, price, stock, a CSS-selected element, JSON APIs, SEO fields or SSL certificates
- Change a monitor's URL, selector, check interval or price/stock thresholds
- Pause, resume or delete monitors
- Read recent alerts sent by email, webhook, Slack, Discord or Telegram

Each detected change is summarised by an AI model and rated minor, major or critical. Alerts are sent for major and critical changes; minor ones are kept in the history.

## Tools

| Tool | Description |
| --- | --- |
| `list_monitors` | List all monitors with recent change activity |
| `get_monitor` | Get full details and the last 20 results for one monitor |
| `create_monitor` | Create a new monitor |
| `update_monitor` | Update an existing monitor's settings |
| `set_monitor_status` | Pause or resume a monitor |
| `delete_monitor` | Delete a monitor |
| `list_alerts` | List recent alerts sent to your account |

## Authentication

Tools need an OmniWatchGuard API key, available on the Pro and Agency plans. Create one in the dashboard and send it as a header:

```
Authorization: Bearer owg_live_...
```

Listing the tools (`initialize`, `tools/list`) works without a key; calling a tool without a key returns an error message.

## Connect from Claude Desktop

```json
{
  "mcpServers": {
    "omniwatchguard": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://mcp.omniwatchguard.com/mcp",
        "--header",
        "Authorization: Bearer owg_live_YOUR_KEY_HERE"
      ]
    }
  }
}
```

## Run locally (stdio)

The same tools are available as a local stdio server, for clients that run MCP servers as a process:

```
npm ci
npm run build
OWG_API_KEY=owg_live_YOUR_KEY_HERE node dist/stdio.mjs
```

Without `OWG_API_KEY` the server starts and lists its tools; tool calls return an error message.

## Limits

- Check intervals: 60 minutes on Starter; 15, 30 or 60 on Pro; 5, 15, 30 or 60 on Agency.
- The crawler respects robots.txt and does not bypass anti-bot protection. Monitoring works on sites that allow automated access.

## Self-hosting

The hosted version is a Cloudflare Worker (`src/index.ts`) that forwards calls to the OmniWatchGuard API. Both versions share the tools in `src/server.ts`.

```
npm ci
npm run deploy
```

## License

MIT, see [LICENSE](LICENSE).
