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

  const handleItemKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen();
    }
  };

  const handleButtonClick = (e: MouseEvent, fn: () => void) => {
    e.stopPropagation();
    fn();
  };

  return (
    <div
      className="logseq-task-item"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={handleItemKeyDown}
      title="Jump to task in note"
    >
      <div className="logseq-task-actions">
        <button
          className="logseq-task-toggle"
          type="button"
          onClick={(e) => handleButtonClick(e, onToggleState)}
          title={`State: ${task.state}`}
          data-state={task.state}
        >
          {task.state}
        </button>
        <button
          className="logseq-task-priority"
          type="button"
          onClick={(e) => handleButtonClick(e, onCyclePriority)}
          title={task.priority ? `Priority ${task.priority}` : "No priority"}
          data-priority={task.priority ?? "none"}
        >
          {task.priority ? `#${task.priority}` : "—"}
        </button>
        <button
          className="logseq-task-props"
          type="button"
          onClick={(e) => handleButtonClick(e, onEditProperties)}
          title="Edit properties"
          aria-label="Edit properties"
        >
          <span className="logseq-task-props-icon">⚙</span>
        </button>
      </div>
      <span className="logseq-task-text">{task.text}</span>
    </div>
  );
}

