import express from "express";
import cors from "cors";
import { createTask, deleteTask, listTasks, updateTask } from "./storage.js";
import { validateTask } from "./validation.js";

export const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "32kb" }));

app.get("/api/health", (_request, response) => response.json({ status: "ok" }));

app.get("/api/tasks", async (_request, response, next) => {
  try { response.json(await listTasks()); } catch (error) { next(error); }
});

app.post("/api/tasks", async (request, response, next) => {
  const parsed = validateTask(request.body);
  if (parsed.error) return response.status(400).json({ error: parsed.error });
  try { response.status(201).json(await createTask({ notes: "", priority: "medium", dueDate: null, completed: false, ...parsed.value })); } catch (error) { next(error); }
});

app.patch("/api/tasks/:id", async (request, response, next) => {
  const parsed = validateTask(request.body, true);
  if (parsed.error) return response.status(400).json({ error: parsed.error });
  try {
    const task = await updateTask(request.params.id, parsed.value);
    if (!task) return response.status(404).json({ error: "Task not found." });
    response.json(task);
  } catch (error) { next(error); }
});

app.delete("/api/tasks/:id", async (request, response, next) => {
  try {
    if (!(await deleteTask(request.params.id))) return response.status(404).json({ error: "Task not found." });
    response.status(204).end();
  } catch (error) { next(error); }
});

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ error: "Something went wrong while saving your tasks. Please try again." });
});
