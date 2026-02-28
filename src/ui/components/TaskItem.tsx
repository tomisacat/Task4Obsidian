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
          <span
            className="logseq-task-props-icon"
            aria-hidden
            dangerouslySetInnerHTML={{
              __html: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>',
            }}
          />
        </button>
      </div>
      <span className="logseq-task-text">{task.text}</span>
    </div>
  );
}

