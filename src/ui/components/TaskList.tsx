import type { GroupedTasks } from "../../core/query";
import type { TaskBlock } from "../../core/parser";
import { TaskItem } from "./TaskItem";

export interface TaskListProps {
  groups: GroupedTasks;
  onOpenTask: (task: TaskBlock) => void;
  onToggleTaskState: (task: TaskBlock) => void;
  onCycleTaskPriority: (task: TaskBlock) => void;
  onEditTaskProperties: (task: TaskBlock) => void;
}

export function TaskList(props: TaskListProps) {
  const {
    groups,
    onOpenTask,
    onToggleTaskState,
    onCycleTaskPriority,
    onEditTaskProperties,
  } = props;
  const groupKeys = Object.keys(groups).sort();

  if (groupKeys.length === 0) {
    return <div className="logseq-task-empty">No tasks match this query.</div>;
  }

  return (
    <div className="logseq-task-list">
      {groupKeys.map((groupKey) => (
        <div className="logseq-task-group" key={groupKey}>
          <div className="logseq-task-group-header">{groupKey}</div>
          {groups[groupKey].map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onOpen={() => onOpenTask(task)}
              onToggleState={() => onToggleTaskState(task)}
              onCyclePriority={() => onCycleTaskPriority(task)}
              onEditProperties={() => onEditTaskProperties(task)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

