OmniWatchGuard MCP Server
![smithery badge](https://smithery.ai/badge/isoprest/omniwatchguard)
![omniwatchguard-mcp MCP server – quality and maintenance score on Glama](https://glama.ai/mcp/servers/Isoprest/omniwatchguard-mcp/badges/score.svg)
Model Context Protocol (MCP) server for OmniWatchGuard — AI-powered website change monitoring. Connect Claude, Cursor, or any MCP-compatible client directly to your OmniWatchGuard account to manage monitors and alerts in natural language.
Endpoint: `https://mcp.omniwatchguard.com/mcp` (Streamable HTTP)
What you can do
List and inspect your website monitors
Create new monitors (price, stock, text, visual, CSS, API, or SEO changes)
Update monitor settings (frequency, thresholds, selectors)
Pause, resume, or delete monitors
Review recent alerts across all notification channels (email, Slack, Discord, Telegram, webhook)
Tools
Tool	Description
`list_monitors`	List all monitors with recent change activity
`get_monitor`	Get full details and recent results for one monitor
`create_monitor`	Create a new monitor
`update_monitor`	Update an existing monitor's settings
`set_monitor_status`	Pause or resume a monitor
`delete_monitor`	Delete a monitor
`list_alerts`	List recent notifications sent to your account
Authentication
Requires an OmniWatchGuard API key (Pro plan or higher). Generate one from your dashboard, then pass it as a Bearer token:
```
Authorization: Bearer owg_live_...
```
Connect from Claude Desktop
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
About OmniWatchGuard
OmniWatchGuard monitors websites for price changes, stock availability, content updates, visual layout shifts, and more — with AI-powered severity filtering to cut alert noise. Learn more →
![omniwatchguard-mcp MCP server – quality and maintenance score on Glama](https://glama.ai/mcp/servers/Isoprest/omniwatchguard-mcp/badges/card.svg)
License
MIT — see LICENSE.
