import { h } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import type LogseqTasksPlugin from "../main";
import type { TaskIndexer } from "../core/indexer";
import { groupTasks } from "../core/query";
import { TaskList } from "./components/TaskList";
import type { TaskBlock } from "../core/parser";

export interface TaskPaneAppProps {
  plugin: LogseqTasksPlugin;
  indexer: TaskIndexer;
}

export function TaskPaneApp(props: TaskPaneAppProps) {
  const { plugin, indexer } = props;

  const [version, setVersion] = useState(0);

  useEffect(() => {
    const vault = plugin.app.vault;

    const bump = () => {
      setVersion((v) => v + 1);
    };

    const modifyRef = vault.on("modify", bump);
    const deleteRef = vault.on("delete", bump);
    const renameRef = vault.on("rename", bump);

    return () => {
      vault.off("modify", bump);
      vault.off("delete", bump);
      vault.off("rename", bump);
    };
  }, [plugin]);

  const allTasks = useMemo(() => indexer.getAllTasks(), [indexer, version]);
  const grouped = useMemo(
    () => groupTasks(allTasks, "page"),
    [allTasks]
  );

  const handleOpenTask = (task: TaskBlock) => {
    const file = plugin.app.vault.getAbstractFileByPath(task.page);
    if (file && file instanceof (plugin.app.vault as any).constructor.TFile) {
      // Fallback: use workspace to open the file at the line if possible
      plugin.app.workspace.openLinkText(task.page, "", "tab");
    } else {
      plugin.app.workspace.openLinkText(task.page, "", "tab");
    }
  };

  const handleToggleTaskState = async (task: TaskBlock) => {
    await plugin.toggleTaskState(task.id);
  };

  const handleCycleTaskPriority = async (task: TaskBlock) => {
    await plugin.cycleTaskPriority(task.id);
  };

  const handleEditTaskProperties = async (task: TaskBlock) => {
    const project = window.prompt(
      "project::",
      task.properties.project ?? ""
    );
    if (project !== null) {
      await plugin.setTaskProperty(task.id, "project", project.trim());
    }

    const context = window.prompt(
      "context::",
      task.properties.context ?? ""
    );
    if (context !== null) {
      await plugin.setTaskProperty(task.id, "context", context.trim());
    }
  };

  return (
    <div className="logseq-task-pane">
      <TaskList
        groups={grouped}
        onOpenTask={handleOpenTask}
        onToggleTaskState={handleToggleTaskState}
        onCycleTaskPriority={handleCycleTaskPriority}
        onEditTaskProperties={handleEditTaskProperties}
      />
    </div>
  );
}

