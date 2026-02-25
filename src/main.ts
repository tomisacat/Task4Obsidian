import { Plugin, WorkspaceLeaf } from "obsidian";
import { LOGSEQ_TASKS_VIEW_TYPE, TaskPaneView } from "./views/TaskPaneView";
import { TaskIndexer } from "./core/indexer";
import { DEFAULT_SETTINGS, LogseqTasksSettings, LogseqTasksSettingTab } from "./settings";
import type { TaskBlock, TaskState, TaskPriority } from "./core/parser";

export default class LogseqTasksPlugin extends Plugin {
  settings: LogseqTasksSettings = DEFAULT_SETTINGS;
  indexer: TaskIndexer | null = null;

  async onload() {
    await this.loadSettings();

    this.indexer = new TaskIndexer(this);
    await this.indexer.initialize();

    this.registerView(
      LOGSEQ_TASKS_VIEW_TYPE,
      (leaf: WorkspaceLeaf) => new TaskPaneView(leaf, this)
    );

    this.addRibbonIcon("check-circle", "Open Logseq Tasks", () => {
      this.activateView();
    });

    this.addCommand({
      id: "open-logseq-tasks-view",
      name: "Open Logseq Tasks view",
      callback: () => this.activateView(),
    });

    this.addSettingTab(new LogseqTasksSettingTab(this.app, this));
  }

  onunload() {
    this.app.workspace
      .getLeavesOfType(LOGSEQ_TASKS_VIEW_TYPE)
      .forEach((leaf) => leaf.detach());
  }

  private async activateView() {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(LOGSEQ_TASKS_VIEW_TYPE)[0];

    if (!leaf) {
      leaf = workspace.getRightLeaf(false);
      if (!leaf) return;
      await leaf.setViewState({
        type: LOGSEQ_TASKS_VIEW_TYPE,
        active: true,
      });
    }

    workspace.revealLeaf(leaf);
  }

  async loadSettings() {
    const data = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
  }

  async saveSettings() {
    await this.saveData(this.settings);
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
}

