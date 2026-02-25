import { h } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import { TFile } from "obsidian";
import type LogseqTasksPlugin from "../main";
import type { TaskIndexer } from "../core/indexer";
import { groupTasks } from "../core/query";
import { TaskList } from "./components/TaskList";
import type { TaskBlock } from "../core/parser";
import { PropertyModal } from "./PropertyModal";

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

  const handleOpenTask = async (task: TaskBlock) => {
    const { vault, workspace } = plugin.app;
    const abstractFile = vault.getAbstractFileByPath(task.page);
    const file = abstractFile instanceof TFile ? abstractFile : null;
    if (!file) {
      workspace.openLinkText(task.page, "", "tab");
      return;
    }
    const leaf = workspace.getLeaf(false);
    await leaf.openFile(file);
    const view = leaf.view;
    const editor = view && "editor" in view ? (view as { editor: { setCursor: (pos: { line: number; ch: number }) => void; scrollIntoView: (range: unknown, mode?: string) => void; focus: () => void } }).editor : null;
    if (editor) {
      const line = Math.max(0, task.line - 1);
      editor.setCursor({ line, ch: 0 });
      editor.scrollIntoView({ from: { line, ch: 0 }, to: { line, ch: 0 } }, "center");
      editor.focus();
    }
  };

  const handleToggleTaskState = async (task: TaskBlock) => {
    await plugin.toggleTaskState(task.id);
  };

  const handleCycleTaskPriority = async (task: TaskBlock) => {
    await plugin.cycleTaskPriority(task.id);
  };

  const handleEditTaskProperties = async (task: TaskBlock) => {
    const modal = new PropertyModal(plugin.app, plugin, task);
    modal.open();
  };

  return (
    <div className="logseq-task-pane">
      <div className="logseq-task-header">
        <div className="logseq-task-title">Tasks</div>
        <div className="logseq-task-count">
          {allTasks.length} task{allTasks.length === 1 ? "" : "s"}
        </div>
      </div>
      <div className="logseq-task-list-wrapper">
        <TaskList
          groups={grouped}
          onOpenTask={handleOpenTask}
          onToggleTaskState={handleToggleTaskState}
          onCycleTaskPriority={handleCycleTaskPriority}
          onEditTaskProperties={handleEditTaskProperties}
        />
      </div>
    </div>
  );
}

