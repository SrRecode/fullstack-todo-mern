import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { once } from "node:events";

const testDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "daymark-api-"));
process.env.TASKS_FILE = path.join(testDirectory, "tasks.json");
const [{ app }, { connectStorage }] = await Promise.all([
  import("./app.js"),
  import("./storage.js"),
]);
await connectStorage("file");
const server = app.listen(0);
await once(server, "listening");
const baseUrl = `http://127.0.0.1:${server.address().port}/api/tasks`;

test("task API supports validated create, list, update, and delete", async (t) => {
  t.after(async () => {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await fs.rm(testDirectory, { recursive: true });
  });

  let response = await fetch(baseUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: "Plan a weekend", priority: "high" }) });
  assert.equal(response.status, 201);
  const created = await response.json();
  assert.equal(created.title, "Plan a weekend");
  assert.equal(created.priority, "high");
  assert.equal(created.completed, false);

  response = await fetch(`${baseUrl}/${created.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ completed: true }) });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).completed, true);

  response = await fetch(baseUrl);
  assert.equal((await response.json()).length, 1);

  const simultaneousCreates = await Promise.all(Array.from({ length: 8 }, (_, index) => fetch(baseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: `Parallel task ${index}` }),
  })));
  assert.ok(simultaneousCreates.every((result) => result.status === 201));
  response = await fetch(baseUrl);
  assert.equal((await response.json()).length, 9);
  await connectStorage("file");
  response = await fetch(baseUrl);
  assert.equal((await response.json()).length, 9);

  response = await fetch(baseUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: "  " }) });
  assert.equal(response.status, 400);

  response = await fetch(`${baseUrl}/${created.id}`, { method: "DELETE" });
  assert.equal(response.status, 204);
  response = await fetch(`${baseUrl}/${created.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ completed: false }) });
  assert.equal(response.status, 404);
});
