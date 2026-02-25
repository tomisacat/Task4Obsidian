import { h } from "preact";
import type { TaskBlock } from "../../core/parser";

export interface TaskItemProps {
  task: TaskBlock;
  onOpen: () => void;
  onToggleState: () => void;
  onCyclePriority: () => void;
  onEditProperties: () => void;
}

export function TaskItem(props: TaskItemProps) {
  const { task, onOpen, onToggleState, onCyclePriority, onEditProperties } =
    props;

  return (
    <div className="logseq-task-item">
      <div className="logseq-task-actions">
        <button
          className="logseq-task-toggle"
          type="button"
          onClick={onToggleState}
          title={`State: ${task.state}`}
          data-state={task.state}
        >
          {task.state}
        </button>
        <button
          className="logseq-task-priority"
          type="button"
          onClick={onCyclePriority}
          title={task.priority ? `Priority ${task.priority}` : "No priority"}
          data-priority={task.priority ?? "none"}
        >
          {task.priority ? `#${task.priority}` : "—"}
        </button>
        <button
          className="logseq-task-props"
          type="button"
          onClick={onEditProperties}
          title="Edit properties"
          aria-label="Edit properties"
        >
          <span className="logseq-task-props-icon">⚙</span>
        </button>
      </div>
      <span
        className="logseq-task-text"
        onClick={onOpen}
        role="button"
        tabIndex={0}
      >
        {task.text}
      </span>
    </div>
  );
}

