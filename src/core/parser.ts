export type TaskState = "TODO" | "DOING" | "DONE" | "CANCELED" | "WAITING";

export type TaskPriority = "A" | "B" | "C" | null;

export interface TaskProperties {
  [key: string]: string;
}

export interface TaskBlock {
  id: string;
  page: string;
  line: number;
  state: TaskState;
  priority: TaskPriority;
  text: string;
  tags: string[];
  properties: TaskProperties;
}

// Matches optional indent, optional list bullet (- or *), then state keyword
const TASK_LINE_RE =
  /^(?<indent>\s*)(?:[-*]\s+)?(?<state>TODO|DOING|DONE|CANCELED|WAITING)\s*(?<priority>\[#([A-C])\])?\s*(?<rest>.*)$/;

export function parseTasksFromMarkdown(
  filePath: string,
  content: string
): TaskBlock[] {
  const lines = content.split(/\r?\n/);
  const tasks: TaskBlock[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = TASK_LINE_RE.exec(line);
    if (!match || !match.groups) continue;

    const state = match.groups.state as TaskState;
    const priorityToken = match.groups.priority;
    const priority: TaskPriority =
      priorityToken && priorityToken.includes("A")
        ? "A"
        : priorityToken && priorityToken.includes("B")
        ? "B"
        : priorityToken && priorityToken.includes("C")
        ? "C"
        : null;

    const text = match.groups.rest?.trim() ?? "";
    const tags = extractTagsFromText(text);

    const { properties, lastLineIndex } = collectFollowingProperties(
      lines,
      i + 1
    );

    const id = `${filePath}:${i + 1}`;

    tasks.push({
      id,
      page: filePath,
      line: i + 1,
      state,
      priority,
      text,
      tags,
      properties,
    });

    // Skip over property lines we already consumed
    i = lastLineIndex - 1;
  }

  return tasks;
}

function extractTagsFromText(text: string): string[] {
  const tagRe = /(^|\s)#([^\s#]+)/g;
  const tags: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = tagRe.exec(text)) !== null) {
    tags.push(`#${match[2]}`);
  }

  return tags;
}

function collectFollowingProperties(
  lines: string[],
  startIndex: number
): { properties: TaskProperties; lastLineIndex: number } {
  const properties: TaskProperties = {};
  let i = startIndex;

  for (; i < lines.length; i++) {
    const line = lines[i];
    const propMatch = /^\s*([\w-]+)::\s*(.*)$/.exec(line);
    if (!propMatch) {
      break;
    }

    const key = propMatch[1];
    const value = propMatch[2].trim();
    properties[key] = value;
  }

  return { properties, lastLineIndex: i };
}

