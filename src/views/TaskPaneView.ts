import { ItemView, WorkspaceLeaf } from "obsidian";
import { h } from "preact";
import { render } from "preact/compat";
import LogseqTasksPlugin from "../main";
import { TaskPaneApp } from "../ui/TaskPaneApp";

export const LOGSEQ_TASKS_VIEW_TYPE = "logseq-tasks-view";

export class TaskPaneView extends ItemView {
  plugin: LogseqTasksPlugin;

  constructor(leaf: WorkspaceLeaf, plugin: LogseqTasksPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return LOGSEQ_TASKS_VIEW_TYPE;
  }

  getDisplayText(): string {
    return "Tasks";
  }

  getIcon(): string {
    return "check-circle";
  }

  async onOpen(): Promise<void> {
    const container = this.containerEl.children[1];
    container.empty();

    const root = container.createDiv("logseq-task-root");
    if (this.plugin.indexer) {
      render(
        h(TaskPaneApp, {
          plugin: this.plugin,
          indexer: this.plugin.indexer,
        }),
        root
      );
    }
  }

  async onClose(): Promise<void> {
    // Nothing to clean up yet
  }
}

