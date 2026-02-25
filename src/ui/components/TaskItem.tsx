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
      <button
        className="logseq-task-toggle"
        type="button"
        onClick={onToggleState}
        title={`State: ${task.state}`}
      >
        {task.state}
      </button>
      <button
        className="logseq-task-priority"
        type="button"
        onClick={onCyclePriority}
        title={task.priority ? `Priority ${task.priority}` : "No priority"}
      >
        {task.priority ? `[#${task.priority}]` : "-"}
      </button>
      <span
        className="logseq-task-text"
        onClick={onOpen}
        role="button"
        tabIndex={0}
      >
        {task.text}
      </span>
      <button
        className="logseq-task-props"
        type="button"
        onClick={onEditProperties}
        title="Edit properties"
      >
        …
      </button>
    </div>
  );
}

