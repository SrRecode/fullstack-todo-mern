const priorities = new Set(["low", "medium", "high"]);
const allowedKeys = new Set(["title", "notes", "priority", "dueDate", "completed"]);

export function validateTask(body, partial = false) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { error: "Request body must be a JSON object." };
  const unknown = Object.keys(body).find((key) => !allowedKeys.has(key));
  if (unknown) return { error: `Unknown task field: ${unknown}.` };
  if (!partial && typeof body.title !== "string") return { error: "Title is required." };
  const result = {};
  if ("title" in body) {
    if (typeof body.title !== "string" || !body.title.trim()) return { error: "Title is required." };
    if (body.title.trim().length > 120) return { error: "Title must be 120 characters or fewer." };
    result.title = body.title.trim();
  }
  if ("notes" in body) {
    if (typeof body.notes !== "string") return { error: "Notes must be text." };
    if (body.notes.length > 2000) return { error: "Notes must be 2,000 characters or fewer." };
    result.notes = body.notes.trim();
  }
  if ("priority" in body) {
    if (!priorities.has(body.priority)) return { error: "Priority must be low, medium, or high." };
    result.priority = body.priority;
  }
  if ("dueDate" in body) {
    const parsedDate = typeof body.dueDate === "string" ? new Date(`${body.dueDate}T00:00:00.000Z`) : null;
    if (body.dueDate !== null && (typeof body.dueDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.dueDate) || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== body.dueDate)) {
      return { error: "Due date must be a valid date in YYYY-MM-DD format or null." };
    }
    result.dueDate = body.dueDate;
  }
  if ("completed" in body) {
    if (typeof body.completed !== "boolean") return { error: "Completed must be true or false." };
    result.completed = body.completed;
  }
  if (partial && Object.keys(result).length === 0) return { error: "Provide at least one task field to update." };
  return { value: result };
}
