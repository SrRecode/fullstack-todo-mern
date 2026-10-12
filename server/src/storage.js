import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import mongoose from "mongoose";

const root = path.dirname(fileURLToPath(import.meta.url));
const dataPath = process.env.TASKS_FILE || path.resolve(root, "../data/tasks.json");
const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  notes: { type: String, trim: true, maxlength: 2000, default: "" },
  priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
  dueDate: { type: String, default: null },
  completed: { type: Boolean, default: false },
}, { timestamps: true, versionKey: false });

const Task = mongoose.models.Task || mongoose.model("Task", taskSchema);
let tasks = [];
let writeQueue = Promise.resolve();

function sortNewestFirst(items) {
  return [...items].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function connectStorage(mode, uri) {
  if (mode === "mongodb") {
    if (!uri) throw new Error("MONGODB_URI is required when STORAGE_MODE=mongodb.");
    await mongoose.connect(uri);
    return;
  }
  if (mode !== "file") throw new Error('STORAGE_MODE must be either "file" or "mongodb".');
  try {
    tasks = JSON.parse(await fs.readFile(dataPath, "utf8"));
    if (!Array.isArray(tasks)) throw new Error("Expected a JSON array of tasks.");
  } catch (error) {
    if (error.code !== "ENOENT") throw new Error(`Could not read local task data: ${error.message}`);
    tasks = [];
  }
}

async function persist(nextTasks) {
  await fs.mkdir(path.dirname(dataPath), { recursive: true });
  const temporaryPath = `${dataPath}.tmp`;
  await fs.writeFile(temporaryPath, JSON.stringify(nextTasks, null, 2), "utf8");
  await fs.rename(temporaryPath, dataPath);
  tasks = nextTasks;
}

function serializeWrite(operation) {
  const result = writeQueue.catch(() => {}).then(operation);
  writeQueue = result.then(() => undefined, () => undefined);
  return result;
}

export async function listTasks() {
  if (mongoose.connection.readyState === 1) {
    return (await Task.find().sort({ createdAt: -1 }).lean()).map((task) => ({ ...task, id: String(task._id), _id: undefined }));
  }
  return sortNewestFirst(tasks);
}

export async function createTask(input) {
  const now = new Date().toISOString();
  if (mongoose.connection.readyState === 1) {
    const task = await Task.create(input);
    return { id: String(task._id), title: task.title, notes: task.notes, priority: task.priority, dueDate: task.dueDate, completed: task.completed, createdAt: task.createdAt.toISOString(), updatedAt: task.updatedAt.toISOString() };
  }
  const task = { ...input, id: randomUUID(), createdAt: now, updatedAt: now };
  return serializeWrite(async () => {
    await persist([...tasks, task]);
    return task;
  });
}

export async function updateTask(id, input) {
  if (mongoose.connection.readyState === 1) {
    if (!mongoose.isValidObjectId(id)) return null;
    const task = await Task.findByIdAndUpdate(id, input, { new: true, runValidators: true }).lean();
    if (!task) return null;
    return { ...task, id: String(task._id), _id: undefined };
  }
  return serializeWrite(async () => {
    const index = tasks.findIndex((task) => task.id === id);
    if (index < 0) return null;
    const updatedTask = { ...tasks[index], ...input, updatedAt: new Date().toISOString() };
    const nextTasks = [...tasks];
    nextTasks[index] = updatedTask;
    await persist(nextTasks);
    return updatedTask;
  });
}

export async function deleteTask(id) {
  if (mongoose.connection.readyState === 1) {
    if (!mongoose.isValidObjectId(id)) return false;
    return (await Task.findByIdAndDelete(id)) !== null;
  }
  return serializeWrite(async () => {
    const nextTasks = tasks.filter((task) => task.id !== id);
    if (nextTasks.length === tasks.length) return false;
    await persist(nextTasks);
    return true;
  });
}
