import test from "node:test";
import assert from "node:assert/strict";
import { validateTask } from "./validation.js";

test("trims valid task fields and accepts a valid due date", () => {
  assert.deepEqual(validateTask({ title: "  Plan a trip  ", notes: " pack ", priority: "high", dueDate: "2026-12-31" }), {
    value: { title: "Plan a trip", notes: "pack", priority: "high", dueDate: "2026-12-31" },
  });
});

test("rejects blank titles, malformed dates, invalid priorities, and unknown fields", () => {
  assert.match(validateTask({ title: "  " }).error, /Title/);
  assert.match(validateTask({ title: "Trip", dueDate: "not-a-date" }).error, /Due date/);
  assert.match(validateTask({ title: "Trip", priority: "urgent" }).error, /Priority/);
  assert.match(validateTask({ title: "Trip", admin: true }).error, /Unknown/);
});

test("validates partial edits and rejects empty patches", () => {
  assert.deepEqual(validateTask({ completed: true }, true), { value: { completed: true } });
  assert.match(validateTask({}, true).error, /at least one/);
});
