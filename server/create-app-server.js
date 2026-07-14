// ─── Ariadne's Thread [AT-0537] ─────────────────────
// What: MCP App server — all Public API tools + interactive UI for get_task_status
// Why:  Inline progress card in Claude per MCP Apps spec (tool + ui resource linked by resourceUri)
// Date: 2026-07-14
// Related: https://claude.com/docs/connectors/building/mcp-apps/getting-started
// ─────────────────────────────────────────────────────
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { z } from "zod";
import { registerUpvoteClubTools } from "@upvote-club/mcp-core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, "..", "dist");
const TASK_STATUS_UI_URI = "ui://upvote-club/task-status/mcp-app.html";

export function createUpvoteClubAppServer(config = {}) {
  const logPrefix = config.logPrefix || "[upvote-mcp-apps]";
  console.error(`${logPrefix} createUpvoteClubAppServer starting`);

  const server = new McpServer({
    name: "upvote-club-apps",
    version: "1.0.0",
  });

  const { apiRequest, toolResult } = registerUpvoteClubTools(server, config, {
    skipTools: ["get_task_status"],
  });

  registerAppTool(
    server,
    "get_task_status",
    {
      title: "Get Task Status",
      description:
        "Get status and progress of Upvote.club tasks with an interactive progress card UI.",
      inputSchema: {
        task_ids: z.array(z.number().int().positive()).min(1).describe("Task IDs from create_task"),
      },
      _meta: { ui: { resourceUri: TASK_STATUS_UI_URI } },
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
      },
    },
    async (args) => {
      console.error(`${logPrefix} Tool call: get_task_status (app) task_ids=${args.task_ids.join(",")}`);
      const query = args.task_ids.join(",");
      const { ok, status, data } = await apiRequest("GET", `/api/public-api/task-status/?task_ids=${encodeURIComponent(query)}`);
      if (!ok) {
        return toolResult({ success: false, http_status: status, ...data }, true);
      }
      return toolResult(data);
    }
  );

  registerAppResource(
    server,
    TASK_STATUS_UI_URI,
    TASK_STATUS_UI_URI,
    {
      mimeType: RESOURCE_MIME_TYPE,
      _meta: {
        ui: {
          csp: {
            connectDomains: [],
            resourceDomains: [],
            baseUriDomains: [],
          },
        },
      },
    },
    async () => {
      const htmlPath = path.join(DIST_DIR, "mcp-app.html");
      console.error(`${logPrefix} Loading MCP App HTML from ${htmlPath}`);
      const html = await fs.readFile(htmlPath, "utf-8");
      return {
        contents: [{ uri: TASK_STATUS_UI_URI, mimeType: RESOURCE_MIME_TYPE, text: html }],
      };
    }
  );

  return server;
}
