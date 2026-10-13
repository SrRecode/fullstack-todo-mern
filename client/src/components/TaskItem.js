import React from "react";

function TaskItem({ task, onToggleComplete, onEdit, onDelete }) {
  const priorityClass = `priority-${task.priority}`;
  const isOverdue =
    task.dueDate && !task.completed && new Date(task.dueDate) < new Date();

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className={`task-item ${task.completed ? "completed" : ""}`}>
      <div className="task-content">
        <div className="task-header">
          <label className="checkbox-container">
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => onToggleComplete(task)}
            />
            <span className="checkmark"></span>
          </label>
          <h3 className="task-title">{task.title}</h3>
          <span className={`priority-badge ${priorityClass}`}>
            {task.priority}
          </span>
        </div>
        {task.description && (
          <p className="task-description">{task.description}</p>
        )}
        {task.dueDate && (
          <p className={`task-due-date ${isOverdue ? "overdue" : ""}`}>
            Due: {formatDate(task.dueDate)}
            {isOverdue && " (Overdue)"}
          </p>
        )}
      </div>
      <div className="task-actions">
        <button className="btn-icon btn-edit" onClick={() => onEdit(task)}>
          Edit
        </button>
        <button className="btn-icon btn-delete" onClick={() => onDelete(task._id)}>
          Delete
        </button>
      </div>
    </div>
  );
}

export default TaskItem;
