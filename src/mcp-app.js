// ─── Ariadne's Thread [AT-0539] ─────────────────────
// What: MCP App View — renders Upvote.club task progress inline in Claude
// Date: 2026-07-14
// ─────────────────────────────────────────────────────
import { App } from "@modelcontextprotocol/ext-apps";

const contentEl = document.getElementById("content");
const refreshBtn = document.getElementById("refresh-btn");

let lastTaskIds = [];

function renderTasks(payload) {
  console.log("[upvote-mcp-app-ui] renderTasks", payload);

  if (!payload || payload.success === false) {
    contentEl.className = "error";
    contentEl.textContent = payload?.error || "Failed to load task status.";
    refreshBtn.hidden = false;
    return;
  }

  const tasks = payload.tasks || [];
  if (tasks.length === 0) {
    contentEl.className = "empty";
    contentEl.textContent = "No tasks returned.";
    refreshBtn.hidden = false;
    return;
  }

  contentEl.className = "";
  contentEl.innerHTML = tasks
    .map((task) => {
      const pct = task.progress_percentage ?? (Math.round((task.actions_completed / task.actions_required) * 100) || 0);
      const label = `#${task.id} · ${task.type || task.task_type || "TASK"} · ${task.status || "UNKNOWN"}`;
      const progress = `${task.actions_completed ?? 0} / ${task.actions_required ?? 0} actions`;
      return `
        <div class="task">
          <div class="meta"><strong>${escapeHtml(label)}</strong></div>
          <div class="meta">${escapeHtml(progress)}</div>
          <div class="bar-wrap"><div class="bar" style="width:${Math.min(100, pct)}%"></div></div>
          <div class="pct">${pct}% complete</div>
        </div>`;
    })
    .join("");

  refreshBtn.hidden = false;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function parseToolResult(result) {
  const text = result?.content?.find((c) => c.type === "text")?.text;
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (err) {
    console.error("[upvote-mcp-app-ui] JSON parse error:", err.message);
    return { success: false, error: "Invalid tool response" };
  }
}

const app = new App({ name: "Upvote.club Task Progress", version: "1.0.0" });

app.ontoolresult = (result) => {
  console.log("[upvote-mcp-app-ui] ontoolresult");
  renderTasks(parseToolResult(result));
};

refreshBtn.addEventListener("click", async () => {
  if (lastTaskIds.length === 0) return;
  console.log("[upvote-mcp-app-ui] refresh clicked", lastTaskIds);
  try {
    const result = await app.callServerTool({
      name: "get_task_status",
      arguments: { task_ids: lastTaskIds },
    });
    renderTasks(parseToolResult(result));
  } catch (err) {
    console.error("[upvote-mcp-app-ui] refresh error:", err.message);
    contentEl.className = "error";
    contentEl.textContent = err.message;
  }
});

app.oninitialized = () => {
  console.log("[upvote-mcp-app-ui] initialized");
};

app.connect().then(() => {
  console.log("[upvote-mcp-app-ui] connected to host");
});

// Capture task_ids from tool input if host exposes it via toolInput
app.ontoolinput = (input) => {
  console.log("[upvote-mcp-app-ui] ontoolinput", input);
  if (input?.task_ids?.length) {
    lastTaskIds = input.task_ids;
  }
};
