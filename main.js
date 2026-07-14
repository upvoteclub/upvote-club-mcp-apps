#!/usr/bin/env node
// ─── Ariadne's Thread [AT-0538] ─────────────────────
// What: MCP Apps entrypoint — stdio (local) or Streamable HTTP (remote/tunnel)
// Date: 2026-07-14
// ─────────────────────────────────────────────────────
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createUpvoteClubAppServer } from "./server/create-app-server.js";

const useStdio = process.argv.includes("--stdio");

async function startStdio() {
  console.error("[upvote-mcp-apps] Starting stdio transport");
  const server = createUpvoteClubAppServer({ logPrefix: "[upvote-mcp-apps]" });
  await server.connect(new StdioServerTransport());
  console.error("[upvote-mcp-apps] Connected on stdio");
}

async function startHttp() {
  const port = parseInt(process.env.PORT || "8788", 10);
  const app = createMcpExpressApp({ host: "0.0.0.0" });

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "upvote-club-mcp-apps", mcp_path: "/mcp" });
  });

  app.all("/mcp", async (req, res) => {
    const apiKey =
      req.headers["x-api-key"] ||
      process.env.UPVOTE_API_KEY ||
      "";
    const server = createUpvoteClubAppServer({ apiKey, logPrefix: "[upvote-mcp-apps]" });
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

    res.on("close", () => {
      transport.close().catch(() => {});
      server.close().catch(() => {});
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (err) {
      console.error(`[upvote-mcp-apps] MCP error: ${err.message}`);
      if (!res.headersSent) {
        res.status(500).json({ jsonrpc: "2.0", error: { code: -32603, message: "Internal server error" }, id: null });
      }
    }
  });

  app.listen(port, () => {
    console.error(`[upvote-mcp-apps] HTTP listening on http://localhost:${port}/mcp`);
  });
}

if (useStdio) {
  await startStdio();
} else {
  await startHttp();
}
