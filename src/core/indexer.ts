import { App, Plugin, TAbstractFile, TFile } from "obsidian";
import { TaskBlock, TaskPriority, TaskState, TaskProperties, parseTasksFromMarkdown } from "./parser";

export class TaskIndexer {
  private app: App;
  private plugin: Plugin;

  private tasksById = new Map<string, TaskBlock>();
  private tasksByFile = new Map<string, TaskBlock[]>();

  constructor(plugin: Plugin) {
    this.plugin = plugin;
    this.app = plugin.app;
  }

  async initialize(): Promise<void> {
    const markdownFiles = this.app.vault.getMarkdownFiles();

    for (const file of markdownFiles) {
      await this.indexFile(file);
    }

    this.plugin.registerEvent(
      this.app.vault.on("modify", async (file) => {
        if (file instanceof TFile && file.extension === "md") {
          await this.indexFile(file);
        }
      })
    );

    this.plugin.registerEvent(
      this.app.vault.on("delete", (file) => {
        this.removeFile(file);
      })
    );

    this.plugin.registerEvent(
      this.app.vault.on("rename", async (file, oldPath) => {
        if (file instanceof TFile && file.extension === "md") {
          this.removeFileByPath(oldPath);
          await this.indexFile(file);
        }
      })
    );
  }

  getAllTasks(): TaskBlock[] {
    return Array.from(this.tasksById.values());
  }

  getTasksForFile(path: string): TaskBlock[] {
    return this.tasksByFile.get(path) ?? [];
  }

  getTaskById(id: string): TaskBlock | undefined {
    return this.tasksById.get(id);
  }

  private async indexFile(file: TFile): Promise<void> {
    const content = await this.app.vault.cachedRead(file);
    const tasks = parseTasksFromMarkdown(file.path, content);

    const previousTasks = this.tasksByFile.get(file.path) ?? [];
    for (const task of previousTasks) {
      this.tasksById.delete(task.id);
    }

    this.tasksByFile.set(file.path, tasks);
    for (const task of tasks) {
      this.tasksById.set(task.id, task);
    }
  }

  private removeFile(file: TAbstractFile): void {
    if (!(file instanceof TFile) || file.extension !== "md") {
      return;
    }
    this.removeFileByPath(file.path);
  }

  private removeFileByPath(path: string): void {
    const tasks = this.tasksByFile.get(path) ?? [];
    for (const task of tasks) {
      this.tasksById.delete(task.id);
    }
    this.tasksByFile.delete(path);
  }

  async updateTaskState(id: string, nextState: TaskState): Promise<void> {
    const task = this.tasksById.get(id);
    if (!task) return;
    const file = this.app.vault.getAbstractFileByPath(task.page);
    if (!(file instanceof TFile)) return;

    const content = await this.app.vault.read(file);
    const lines = content.split(/\r?\n/);
    const index = task.line - 1;
    if (!lines[index]) return;

    lines[index] = lines[index].replace(
      /^(?<indent>\s*)(?<bullet>(?:[-*]\s+)?)(TODO|DOING|DONE|CANCELED|WAITING)/,
      (_, indent, bullet) => `${indent}${bullet ?? ""}${nextState}`
    );

    await this.app.vault.modify(file, lines.join("\n"));
  }

  async updateTaskPriority(id: string, nextPriority: TaskPriority): Promise<void> {
    const task = this.tasksById.get(id);
    if (!task) return;
    const file = this.app.vault.getAbstractFileByPath(task.page);
    if (!(file instanceof TFile)) return;

    const content = await this.app.vault.read(file);
    const lines = content.split(/\r?\n/);
    const index = task.line - 1;
    if (!lines[index]) return;

    let line = lines[index];

    if (nextPriority === null) {
      line = line.replace(/\s*\[#([A-C])\]/, "");
    } else if (/\[#([A-C])\]/.test(line)) {
      line = line.replace(/\[#([A-C])\]/, `[#${nextPriority}]`);
    } else {
      line = line.replace(
        /^(?<indent>\s*)(?<bullet>(?:[-*]\s+)?)(TODO|DOING|DONE|CANCELED|WAITING)/,
        (_match, indent, bullet, state) =>
          `${indent}${bullet ?? ""}${state} [#${nextPriority}]`
      );
    }

    lines[index] = line;
    await this.app.vault.modify(file, lines.join("\n"));
  }

  async updateTaskProperty(
    id: string,
    key: string,
    value: string | null
  ): Promise<void> {
    const task = this.tasksById.get(id);
    if (!task) return;

    const properties: TaskProperties = { ...task.properties };
    if (value === null || value === "") {
      delete properties[key];
    } else {
      properties[key] = value;
    }

    await this.updateTaskProperties(id, properties);
  }

  async updateTaskProperties(
    id: string,
    properties: TaskProperties
  ): Promise<void> {
    const task = this.tasksById.get(id);
    if (!task) return;
    const file = this.app.vault.getAbstractFileByPath(task.page);
    if (!(file instanceof TFile)) return;

    const content = await this.app.vault.read(file);
    const lines = content.split(/\r?\n/);
    const start = task.line;

    let i = start;
    const propRe = /^\s*([\w-]+)::\s*(.*)$/;

    while (i < lines.length) {
      const m = propRe.exec(lines[i]);
      if (!m) break;
      i++;
    }

    const newPropLines: string[] = [];
    for (const [k, v] of Object.entries(properties)) {
      if (!k) continue;
      if (v === undefined || v === null || v === "") continue;
      newPropLines.push(`${k}:: ${v}`);
    }

    lines.splice(start, i - start, ...newPropLines);
    await this.app.vault.modify(file, lines.join("\n"));
  }
}

