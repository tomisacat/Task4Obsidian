import { useEffect, useMemo, useState } from "preact/hooks";
import { TFile } from "obsidian";
import type TasksPlugin from "../main";
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
  plugin: TasksPlugin;
  indexer: TaskIndexer;
}

export function TaskPaneApp(props: TaskPaneAppProps) {
  const { plugin, indexer } = props;

  const [version, setVersion] = useState(0);
  const [stateFilter, setStateFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [tagsFilter, setTagsFilter] = useState("");
  const [propertyFilters, setPropertyFilters] = useState<PropertyFilterRow[]>([
    { key: "", value: "" },
  ]);
  const [queryExpanded, setQueryExpanded] = useState(false);

  useEffect(() => {
    const vault = plugin.app.vault;

    const bump = () => {
      setVersion((v) => v + 1);
    };

    vault.on("modify", bump);
    vault.on("delete", bump);
    vault.on("rename", bump);

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
    if (priorityFilter)
      q.priority = priorityFilter === "none" ? "none" : (priorityFilter as "A" | "B" | "C");
    const tags = parseTagInput(tagsFilter);
    if (tags.length > 0) q.tags = tags;
    const props: Record<string, string> = {};
    for (const { key, value } of propertyFilters) {
      if (key.trim() && value.trim()) props[key.trim()] = value.trim();
    }
    if (Object.keys(props).length > 0) q.properties = props;
    return q;
  }, [stateFilter, priorityFilter, tagsFilter, propertyFilters]);

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
    !!priorityFilter ||
    !!tagsFilter.trim() ||
    propertyFilters.some((f) => f.key.trim() && f.value.trim());

  const clearFilters = () => {
    setStateFilter("");
    setPriorityFilter("");
    setTagsFilter("");
    setPropertyFilters([{ key: "", value: "" }]);
  };

  const openTask = async (task: TaskBlock) => {
    const { vault, workspace } = plugin.app;
    const abstractFile = vault.getAbstractFileByPath(task.page);
    const file = abstractFile instanceof TFile ? abstractFile : null;
    if (!file) {
      void workspace.openLinkText(task.page, "", "tab");
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

  const handleOpenTask = (task: TaskBlock) => {
    void openTask(task);
  };

  const handleToggleTaskState = (task: TaskBlock) => {
    void plugin.toggleTaskState(task.id);
  };

  const handleCycleTaskPriority = (task: TaskBlock) => {
    void plugin.cycleTaskPriority(task.id);
  };

  const handleEditTaskProperties = (task: TaskBlock) => {
    const modal = new PropertyModal(plugin.app, plugin, task);
    modal.open();
  };

  return (
    <div className="logseq-task-pane">
      <div className="logseq-task-header">
        <div className="logseq-task-title">Tasks</div>
        <div className="logseq-task-header-right">
          <div className="logseq-task-count">
            {filteredTasks.length}
            {hasActiveFilters ? ` / ${allTasks.length}` : ""} task
            {filteredTasks.length === 1 ? "" : "s"}
          </div>
          <button
            type="button"
            className="logseq-query-toggle"
            onClick={() => setQueryExpanded((e) => !e)}
            title={queryExpanded ? "Hide filters" : "Show filters"}
            aria-expanded={queryExpanded}
          >
            <span
              className="logseq-query-toggle-icon"
              aria-hidden
              dangerouslySetInnerHTML={{
                __html: queryExpanded
                  ? '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>'
                  : '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>',
              }}
            />
          </button>
        </div>
      </div>
      {queryExpanded && (
      <QueryBar
        stateFilter={stateFilter}
        priorityFilter={priorityFilter}
        tagsFilter={tagsFilter}
        propertyFilters={propertyFilters}
        propKeyOptions={propKeyOptions}
        propValueOptionsByKey={propValueOptionsByKey}
        onStateChange={setStateFilter}
        onPriorityChange={setPriorityFilter}
        onTagsChange={setTagsFilter}
        onPropertyFiltersChange={setPropertyFilters}
        onClear={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />
      )}
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

