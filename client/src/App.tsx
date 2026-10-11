import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowDownUp, ArrowRight, CalendarDays, Check, CheckCheck, Circle, Clock3, ListTodo, LoaderCircle, Plus, Search, Sparkles, Target, Trash2, X } from "lucide-react";

type Task = {
  id: string;
  title: string;
  notes: string;
  priority: "low" | "medium" | "high";
  dueDate: string | null;
  completed: boolean;
  createdAt: string;
};
type TaskInput = Pick<Task, "title" | "notes" | "priority" | "dueDate">;
type Filter = "all" | "open" | "completed";

const today = new Date();
const dateLabel = new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(today);
const todayDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
const shortcutLabel = /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘ K" : "Ctrl K";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...options, headers: { "Content-Type": "application/json", ...options?.headers } });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "Couldn't complete that action. Please try again.");
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function formatDueDate(date: string) {
  const value = new Date(`${date}T00:00:00`);
  const current = new Date();
  const isToday = value.toDateString() === current.toDateString();
  const tomorrow = new Date(current);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (isToday) return "Today";
  if (value.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(value);
}

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortDue, setSortDue] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<"new" | Task | null>(null);
  const searchInput = useRef<HTMLInputElement>(null);

  async function loadTasks() {
    setLoading(true);
    setLoadFailed(false);
    setError("");
    try {
      setTasks(await request<Task[]>("/api/tasks"));
    } catch (err) {
      setLoadFailed(true);
      setError(err instanceof Error ? err.message : "Couldn't load your tasks.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadTasks(); }, []);

  const openTasks = tasks.filter((task) => !task.completed);
  const doneTasks = tasks.filter((task) => task.completed);
  const dueToday = openTasks.filter((task) => task.dueDate === todayDate).length;
  const visibleTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    const result = tasks.filter((task) => {
      const matchesStatus = filter === "all" || (filter === "open" ? !task.completed : task.completed);
      const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
      const matchesSearch = !query || `${task.title} ${task.notes}`.toLowerCase().includes(query);
      return matchesStatus && matchesPriority && matchesSearch;
    });
    return result.sort((a, b) => {
      if (sortDue) return (a.dueDate || "9999-12-31").localeCompare(b.dueDate || "9999-12-31");
      return Number(a.completed) - Number(b.completed) || b.createdAt.localeCompare(a.createdAt);
    });
  }, [tasks, filter, priorityFilter, search, sortDue]);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInput.current?.focus();
      }
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  async function saveTask(values: TaskInput, existing?: Task): Promise<string | null> {
    setSaving(true);
    try {
      const task = await request<Task>(existing ? `/api/tasks/${existing.id}` : "/api/tasks", {
        method: existing ? "PATCH" : "POST",
        body: JSON.stringify(values),
      });
      setTasks((current) => existing ? current.map((item) => item.id === task.id ? task : item) : [task, ...current]);
      setError("");
      setModal(null);
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : "Couldn't save your task.";
    } finally {
      setSaving(false);
    }
  }

  async function toggleTask(task: Task) {
    try {
      const updated = await request<Task>(`/api/tasks/${task.id}`, { method: "PATCH", body: JSON.stringify({ completed: !task.completed }) });
      setTasks((current) => current.map((item) => item.id === task.id ? updated : item));
      setError("");
    } catch (err) { setError(err instanceof Error ? err.message : "Couldn't update task."); }
  }

  async function removeTask(task: Task) {
    if (!window.confirm(`Delete “${task.title}”? This can’t be undone.`)) return;
    try {
      await request<void>(`/api/tasks/${task.id}`, { method: "DELETE" });
      setTasks((current) => current.filter((item) => item.id !== task.id));
      setError("");
    } catch (err) { setError(err instanceof Error ? err.message : "Couldn't delete task."); }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Daymark home"><span className="brand-mark"><Check size={19} strokeWidth={3} /></span><span>daymark<span className="brand-period">.</span></span></a>
        <div className="topbar-right"><span className="today-label"><span className="live-dot" /> YOUR DAY, YOUR WAY</span></div>
      </header>

      <main className="dashboard">
        <section className="welcome">
          <div className="welcome-copy">
            <h1>Make room for<br /><span>what matters.</span></h1>
            <p className="welcome-date"><CalendarDays size={16} /> {dateLabel}</p>
          </div>
        </section>

        <section className="stats" aria-label="Task summary">
          <div className="stat-card"><ListTodo size={16} /><span>Open</span><strong>{openTasks.length}</strong></div>
          <div className="stat-card"><Target size={16} /><span>Due today</span><strong>{dueToday}</strong></div>
          <div className="stat-card"><CheckCheck size={16} /><span>Completed</span><strong>{doneTasks.length}</strong></div>
        </section>

        <section className="tasks-panel" aria-labelledby="tasks-heading">
          <div className="panel-heading">
            <div><h2 id="tasks-heading">Your tasks <span className="task-count">{openTasks.length} open</span></h2></div>
            <button className="add-button" onClick={() => setModal("new")}><Plus size={17} strokeWidth={2.5} /><span>New task</span></button>
          </div>
          <div className="toolbar">
            <div className="filters" role="group" aria-label="Filter tasks">
              {(["all", "open", "completed"] as const).map((item) => <button key={item} className={`filter-chip ${filter === item ? "selected" : ""}`} aria-pressed={filter === item} onClick={() => setFilter(item)}>{item === "all" ? "Everything" : item === "open" ? "To do" : "Done"}{item === "completed" && doneTasks.length > 0 && <span className="filter-count">{doneTasks.length}</span>}</button>)}
            </div>
            <div className="toolbar-tools">
              <label className="search-box"><Search size={15} /><input ref={searchInput} aria-label="Search tasks" placeholder="Find a task..." value={search} onChange={(event) => setSearch(event.target.value)} /><kbd>{shortcutLabel}</kbd></label>
              <select className="priority-select" aria-label="Filter by priority" value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}><option value="all">All priorities</option><option value="high">High priority</option><option value="medium">Medium priority</option><option value="low">Low priority</option></select>
              <button className={`sort-button ${sortDue ? "active" : ""}`} title={sortDue ? "Sort by creation date" : "Sort by due date"} aria-label={sortDue ? "Sort by creation date" : "Sort by due date"} aria-pressed={sortDue} onClick={() => setSortDue((value) => !value)}><ArrowDownUp size={16} /></button>
            </div>
          </div>

          {error && !loadFailed && <div className="error-banner" role="alert"><span>{error}</span><button aria-label="Dismiss error" onClick={() => setError("")}><X size={15} /></button></div>}
          <div className="task-list">
            {loading ? <div className="state-message"><LoaderCircle className="spin" size={22} /><span>Getting things ready…</span></div>
              : loadFailed ? <div className="empty-state" role="alert"><div className="empty-icon"><ListTodo size={22} /></div><h3>Your tasks couldn’t load.</h3><p>{error || "Check your connection or make sure the task server is running, then try again."}</p><button className="text-action" onClick={() => void loadTasks()}>Try again <ArrowRight size={15} /></button></div>
              : visibleTasks.length === 0 ? <div className="empty-state"><div className="empty-icon">{search || filter !== "all" || priorityFilter !== "all" ? <Search size={22} /> : <Sparkles size={22} />}</div><h3>{tasks.length === 0 ? "A fresh page." : "Nothing to see here."}</h3><p>{tasks.length === 0 ? "Add your first task and start with whatever’s on your mind." : "Try another filter, or enjoy a little breathing room."}</p>{tasks.length === 0 && <button className="text-action" onClick={() => setModal("new")}>Add your first task <ArrowRight size={15} /></button>}</div>
                : visibleTasks.map((task) => <TaskRow key={task.id} task={task} onToggle={() => void toggleTask(task)} onEdit={() => setModal(task)} onDelete={() => void removeTask(task)} />)}
          </div>
          {!loading && !loadFailed && <p className="sr-only" role="status" aria-live="polite">{visibleTasks.length} {visibleTasks.length === 1 ? "task" : "tasks"} shown</p>}
          {!loading && tasks.length > 0 && <div className="list-footer"><span><span className="footer-dot" /> YOUR TASKS, JUST FOR YOU</span><span>{doneTasks.length} of {tasks.length} complete</span></div>}
        </section>

        <footer className="footer-note"><span>Small steps still move you forward.</span></footer>
      </main>
      {modal && <TaskModal task={modal === "new" ? undefined : modal} saving={saving} onClose={() => setModal(null)} onSave={(values) => saveTask(values, modal === "new" ? undefined : modal)} />}
    </div>
  );
}

function TaskRow({ task, onToggle, onEdit, onDelete }: { task: Task; onToggle: () => void; onEdit: () => void; onDelete: () => void }) {
  const overdue = task.dueDate && !task.completed && new Date(`${task.dueDate}T00:00:00`) < new Date(new Date().toDateString());
  return <article className={`task-row ${task.completed ? "is-complete" : ""}`}>
    <button className={`check-button ${task.completed ? "checked" : ""}`} onClick={onToggle} aria-label={task.completed ? `Mark ${task.title} as to do` : `Complete ${task.title}`}>{task.completed ? <Check size={14} strokeWidth={3} /> : <Circle size={19} strokeWidth={1.7} />}</button>
    <button className="task-copy" onClick={onEdit} aria-label={`Edit ${task.title}`}><span className="task-title">{task.title}</span>{task.notes && <span className="task-notes">{task.notes}</span>}</button>
    {task.dueDate && <time className={`due-badge ${overdue ? "overdue" : ""}`} dateTime={task.dueDate} aria-label={`Due ${new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(new Date(`${task.dueDate}T00:00:00`))}`}><Clock3 size={13} />{formatDueDate(task.dueDate)}</time>}
    <span className={`priority-badge priority-${task.priority}`} aria-label={`${task.priority} priority`}><span />{task.priority}</span>
    <div className="row-actions"><button aria-label={`Edit ${task.title}`} title="Edit task" onClick={onEdit}><ArrowRight size={15} /></button><button aria-label={`Delete ${task.title}`} title="Delete task" onClick={onDelete}><Trash2 size={15} /></button></div>
  </article>;
}

function TaskModal({ task, saving, onClose, onSave }: { task?: Task; saving: boolean; onClose: () => void; onSave: (values: TaskInput) => Promise<string | null> }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [title, setTitle] = useState(task?.title || "");
  const [notes, setNotes] = useState(task?.notes || "");
  const [priority, setPriority] = useState<TaskInput["priority"]>(task?.priority || "medium");
  const [dueDate, setDueDate] = useState(task?.dueDate || "");
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    dialog.querySelector<HTMLInputElement>("#task-title")?.focus();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) { setValidationError("Give your task a name to get started."); return; }
    void onSave({ title: title.trim(), notes: notes.trim(), priority, dueDate: dueDate || null }).then((message) => {
      if (message) setValidationError(message);
    });
  }

  return <dialog ref={dialogRef} className="task-modal" aria-labelledby="modal-title" aria-busy={saving} onCancel={(event) => { event.preventDefault(); if (!saving) onClose(); }}>
      <div className="modal-heading"><h2 id="modal-title">{task ? "Edit your task" : "What’s on your mind?"}</h2><button className="close-button" onClick={onClose} disabled={saving} aria-label="Close dialog"><X size={19} /></button></div>
      <form onSubmit={submit}>
        <label className="form-label" htmlFor="task-title">Task name <span>required</span></label>
        <input id="task-title" className="form-input title-input" autoFocus disabled={saving} maxLength={120} placeholder="e.g. Take a proper lunch break" value={title} onChange={(event) => { setTitle(event.target.value); setValidationError(""); }} />
        <label className="form-label" htmlFor="task-notes">A few details <span>optional</span></label>
        <textarea id="task-notes" className="form-input notes-input" disabled={saving} maxLength={2000} placeholder="Add a note, a link, or a little context…" value={notes} onChange={(event) => { setNotes(event.target.value); setValidationError(""); }} />
        <div className="form-row"><div className="form-field"><label className="form-label" htmlFor="task-priority">Priority</label><select id="task-priority" className="form-input" disabled={saving} value={priority} onChange={(event) => { setPriority(event.target.value as TaskInput["priority"]); setValidationError(""); }}><option value="low">Low — whenever</option><option value="medium">Medium — steady pace</option><option value="high">High — a focus today</option></select></div><div className="form-field"><label className="form-label" htmlFor="task-date">Due date <span>optional</span></label><input id="task-date" className="form-input" disabled={saving} type="date" value={dueDate || ""} onChange={(event) => { setDueDate(event.target.value); setValidationError(""); }} /></div></div>
        {validationError && <p className="form-error" role="alert">{validationError}</p>}
        <div className="modal-actions"><button type="button" className="cancel-button" onClick={onClose} disabled={saving}>Cancel</button><button type="submit" className="save-button" disabled={saving}>{saving ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />}{task ? "Save changes" : "Add to my list"}</button></div>
      </form>
  </dialog>;
}

export default App;
