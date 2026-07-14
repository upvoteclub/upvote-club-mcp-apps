# Upvote.club — MCP Apps

Interactive [MCP App](https://claude.com/docs/connectors/building/mcp-apps/getting-started) with an inline **task progress card** for `get_task_status`.

All 7 Public API tools are available; `get_task_status` renders a progress bar UI in Claude.

## Build & run

```bash
cd upvote-club-mcp/apps
npm install
npm run build
UPVOTE_API_KEY=upv_... npm start
# → http://localhost:8788/mcp
```

Stdio (Claude Desktop dev config):

```bash
UPVOTE_API_KEY=upv_... npm run start:stdio
```

```json
{
  "mcpServers": {
    "upvote-club-apps": {
      "command": "node",
      "args": ["/ABS/PATH/upvote-club-mcp/apps/main.js", "--stdio"],
      "env": { "UPVOTE_API_KEY": "upv_..." }
    }
  }
}
```

## Test with tunnel

Expose `http://localhost:8788/mcp` via Cloudflare Tunnel and add as Claude.ai custom connector with `X-API-Key` header.

## UI design

Follows [MCP Apps design guidelines](https://claude.com/docs/connectors/building/mcp-apps/design-guidelines): inline card, Claude theme CSS variables, max 2 actions (Refresh).

## Privacy

Connects only to `https://api.upvote.club`. https://upvote.club/privacy-policy
