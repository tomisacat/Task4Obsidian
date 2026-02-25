import type { TaskBlock, TaskState, TaskPriority } from "./parser";

export interface QueryDefinition {
  id: string;
  name: string;
  states?: TaskState[];
  priority?: TaskPriority | "none";
  page?: string;
  tags?: string[];
  properties?: Record<string, string>;
}

export type GroupBy = "page" | "state" | "project";

export type GroupedTasks = Record<string, TaskBlock[]>;

export function executeQuery(
  tasks: TaskBlock[],
  query: QueryDefinition
): TaskBlock[] {
  return tasks.filter((task) => matchesQuery(task, query));
}

export function groupTasks(
  tasks: TaskBlock[],
  groupBy: GroupBy,
  projectKey = "project"
): GroupedTasks {
  const groups: GroupedTasks = {};

  for (const task of tasks) {
    let key: string;
    if (groupBy === "page") {
      key = task.page;
    } else if (groupBy === "state") {
      key = task.state;
    } else {
      key = task.properties[projectKey] ?? "(no project)";
    }

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(task);
  }

  return groups;
}

function matchesQuery(task: TaskBlock, query: QueryDefinition): boolean {
  if (query.states && query.states.length > 0) {
    if (!query.states.includes(task.state)) return false;
  }

  if (query.priority !== undefined && query.priority !== "") {
    if (query.priority === "none") {
      if (task.priority !== null) return false;
    } else if (task.priority !== query.priority) {
      return false;
    }
  }

  if (query.page) {
    if (!pageMatches(task.page, query.page)) return false;
  }

  if (query.tags && query.tags.length > 0) {
    const taskTagsLower = task.tags.map((t) => t.toLowerCase());
    for (const tag of query.tags) {
      const q = tag.toLowerCase();
      if (!taskTagsLower.some((t) => t.includes(q))) return false;
    }
  }

  if (query.properties) {
    for (const [key, value] of Object.entries(query.properties)) {
      const propVal = (task.properties[key] ?? "").toLowerCase();
      if (!propVal.includes(value.toLowerCase())) return false;
    }
  }

  return true;
}

function pageMatches(page: string, pattern: string): boolean {
  if (!pattern.includes("*")) {
    return page === pattern;
  }

  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp("^" + escaped.replace(/\*/g, ".*") + "$");
  return regex.test(page);
}

