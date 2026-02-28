import { Plugin, WorkspaceLeaf } from "obsidian";
import { LOGSEQ_TASKS_VIEW_TYPE, TaskPaneView } from "./views/TaskPaneView";
import { TaskIndexer } from "./core/indexer";
import type { TaskState, TaskPriority, TaskProperties } from "./core/parser";

const STATE_CYCLE: TaskState[] = ["TODO", "DOING", "DONE", "CANCELED"];
const TASK_LINE_RE =
  /^\s*(?:[-*]\s+)?(TODO|DOING|DONE|CANCELED|WAITING)/;

export default class TasksPlugin extends Plugin {
  indexer: TaskIndexer | null = null;

  async onload() {
    this.indexer = new TaskIndexer(this);
    await this.indexer.initialize();

    this.registerView(
      LOGSEQ_TASKS_VIEW_TYPE,
      (leaf: WorkspaceLeaf) => new TaskPaneView(leaf, this)
    );

    this.addRibbonIcon("check-circle", "Open tasks", () => {
      void this.activateView();
    });

    this.addCommand({
      id: "open-logseq-tasks-view",
      name: "Open tasks view",
      callback: () => {
        void this.activateView();
      },
    });

    this.addCommand({
      id: "cycle-task-state-at-cursor",
      name: "Cycle task state at cursor",
      editorCallback: (editor, view) => {
        this.cycleTaskStateAtCursor(editor, view);
      },
    });
  }

  private cycleTaskStateAtCursor(
    editor: { getCursor: () => { line: number }; getLine: (line: number) => string; replaceRange: (text: string, from: { line: number; ch: number }, to: { line: number; ch: number }) => void },
    view: { file?: { path: string } | null }
  ): void {
    const file = view.file;
    if (!file?.path) return;

    const cursor = editor.getCursor();
    const lineNumber = cursor.line;
    const line = editor.getLine(lineNumber);

    const match = TASK_LINE_RE.exec(line);
    if (!match) return;

    const currentState = match[1] as TaskState;
    const stateStart = match.index + match[0].length - match[1].length;
    const stateEnd = stateStart + match[1].length;

    const idx = STATE_CYCLE.indexOf(currentState);
    const nextState = STATE_CYCLE[(idx + 1) % STATE_CYCLE.length] ?? "TODO";

    const taskId = `${file.path}:${lineNumber + 1}`;
    if (this.indexer?.getTaskById(taskId)) {
      void this.toggleTaskState(taskId);
      return;
    }

    editor.replaceRange(
      nextState,
      { line: lineNumber, ch: stateStart },
      { line: lineNumber, ch: stateEnd }
    );
  }

  onunload() {
    this.app.workspace
      .getLeavesOfType(LOGSEQ_TASKS_VIEW_TYPE)
      .forEach((leaf) => leaf.detach());
  }

  private async activateView() {
    const { workspace } = this.app;
    let leaf: WorkspaceLeaf | undefined | null =
      workspace.getLeavesOfType(LOGSEQ_TASKS_VIEW_TYPE)[0];

    if (!leaf) {
      leaf = workspace.getRightLeaf(false);
      if (!leaf) return;
      await leaf.setViewState({
        type: LOGSEQ_TASKS_VIEW_TYPE,
        active: true,
      });
    }

    if (!leaf) return;
    await workspace.revealLeaf(leaf);
  }

  async toggleTaskState(taskId: string): Promise<void> {
    if (!this.indexer) return;
    const task = this.indexer.getTaskById(taskId);
    if (!task) return;

    const order: TaskState[] = ["TODO", "DOING", "DONE", "CANCELED"];
    const currentIndex = order.indexOf(task.state);
    const nextState = order[(currentIndex + 1) % order.length] ?? "TODO";
    await this.indexer.updateTaskState(taskId, nextState);
  }

  async cycleTaskPriority(taskId: string): Promise<void> {
    if (!this.indexer) return;
    const task = this.indexer.getTaskById(taskId);
    if (!task) return;

    const order: (TaskPriority)[] = [null, "C", "B", "A"];
    const currentIndex = order.indexOf(task.priority);
    const nextPriority = order[(currentIndex + 1) % order.length] ?? null;
    await this.indexer.updateTaskPriority(taskId, nextPriority);
  }

  async setTaskProperty(
    taskId: string,
    key: string,
    value: string | null
  ): Promise<void> {
    if (!this.indexer) return;
    await this.indexer.updateTaskProperty(taskId, key, value);
  }

  async setTaskProperties(
    taskId: string,
    properties: TaskProperties
  ): Promise<void> {
    if (!this.indexer) return;
    await this.indexer.updateTaskProperties(taskId, properties);
  }
}

