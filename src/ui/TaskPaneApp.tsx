import { h } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import { TFile } from "obsidian";
import type LogseqTasksPlugin from "../main";
import type { TaskIndexer } from "../core/indexer";
import { executeQuery, groupTasks } from "../core/query";
import type { QueryDefinition } from "../core/query";
import type { TaskState } from "../core/parser";
import { TaskList } from "./components/TaskList";
import { QueryBar, type PropertyFilterRow } from "./components/QueryBar";
import type { TaskBlock } from "../core/parser";
import { PropertyModal } from "./PropertyModal";

function parseTagInput(input: string): string[] {
  if (!input.trim()) return [];
  return input
    .split(/\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => (s.startsWith("#") ? s : `#${s}`));
}

export interface TaskPaneAppProps {
  plugin: LogseqTasksPlugin;
  indexer: TaskIndexer;
}

export function TaskPaneApp(props: TaskPaneAppProps) {
  const { plugin, indexer } = props;

  const [version, setVersion] = useState(0);
  const [stateFilter, setStateFilter] = useState("");
  const [tagsFilter, setTagsFilter] = useState("");
  const [propertyFilters, setPropertyFilters] = useState<PropertyFilterRow[]>([
    { key: "", value: "" },
  ]);

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

  const query = useMemo((): QueryDefinition => {
    const q: QueryDefinition = { id: "panel", name: "Panel" };
    if (stateFilter) q.states = [stateFilter as TaskState];
    const tags = parseTagInput(tagsFilter);
    if (tags.length > 0) q.tags = tags;
    const props: Record<string, string> = {};
    for (const { key, value } of propertyFilters) {
      if (key.trim() && value.trim()) props[key.trim()] = value.trim();
    }
    if (Object.keys(props).length > 0) q.properties = props;
    return q;
  }, [stateFilter, tagsFilter, propertyFilters]);

  const filteredTasks = useMemo(
    () => executeQuery(allTasks, query),
    [allTasks, query]
  );

  const grouped = useMemo(
    () => groupTasks(filteredTasks, "page"),
    [filteredTasks]
  );

  const propKeyOptions = useMemo(() => {
    const keys = new Set<string>();
    for (const task of allTasks) {
      for (const k of Object.keys(task.properties)) keys.add(k);
    }
    return Array.from(keys).sort();
  }, [allTasks]);

  const propValueOptionsByKey = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const task of allTasks) {
      for (const [k, v] of Object.entries(task.properties)) {
        if (v == null || v === "") continue;
        if (!map[k]) map[k] = [];
        if (!map[k].includes(v)) map[k].push(v);
      }
    }
    for (const k of Object.keys(map)) map[k].sort();
    return map;
  }, [allTasks]);

  const hasActiveFilters =
    !!stateFilter ||
    !!tagsFilter.trim() ||
    propertyFilters.some((f) => f.key.trim() && f.value.trim());

  const clearFilters = () => {
    setStateFilter("");
    setTagsFilter("");
    setPropertyFilters([{ key: "", value: "" }]);
  };

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
          {filteredTasks.length}
          {hasActiveFilters ? ` / ${allTasks.length}` : ""} task
          {filteredTasks.length === 1 ? "" : "s"}
        </div>
      </div>
      <QueryBar
        stateFilter={stateFilter}
        tagsFilter={tagsFilter}
        propertyFilters={propertyFilters}
        propKeyOptions={propKeyOptions}
        propValueOptionsByKey={propValueOptionsByKey}
        onStateChange={setStateFilter}
        onTagsChange={setTagsFilter}
        onPropertyFiltersChange={setPropertyFilters}
        onClear={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />
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

