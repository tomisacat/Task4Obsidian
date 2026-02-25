import { App, PluginSettingTab, Setting } from "obsidian";
import type TasksPlugin from "./main";
import type { GroupBy, QueryDefinition } from "./core/query";

export interface TasksSettings {
  queries: QueryDefinition[];
  defaultGroupBy: GroupBy;
}

export const DEFAULT_SETTINGS: TasksSettings = {
  defaultGroupBy: "page",
  queries: [
    {
      id: "todo-all",
      name: "All TODO",
      states: ["TODO", "DOING"],
    },
  ],
};

export class TasksSettingTab extends PluginSettingTab {
  plugin: TasksPlugin;

  constructor(app: App, plugin: TasksPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", {
      text: "Tasks Settings",
    });

    new Setting(containerEl)
      .setName("Default grouping")
      .setDesc("How tasks are grouped in the side pane.")
      .addDropdown((dropdown) => {
        dropdown
          .addOption("page", "By page")
          .addOption("state", "By state")
          .addOption("project", "By project property");
        dropdown.setValue(this.plugin.settings.defaultGroupBy);
        dropdown.onChange(async (value) => {
          this.plugin.settings.defaultGroupBy = value as GroupBy;
          await this.plugin.saveSettings();
        });
      });

    const queriesArea = new Setting(containerEl)
      .setName("Saved queries (JSON)")
      .setDesc(
        "Edit the list of saved queries as JSON. Each query can filter by states, page pattern, tags, and properties."
      )
      .addTextArea((text) => {
        text.inputEl.rows = 8;
        text.inputEl.style.width = "100%";
        text.setValue(JSON.stringify(this.plugin.settings.queries, null, 2));
        text.onChange(async (value) => {
          try {
            const parsed = JSON.parse(value) as QueryDefinition[];
            this.plugin.settings.queries = parsed;
            await this.plugin.saveSettings();
          } catch {
            // ignore parse errors; user can fix JSON
          }
        });
      });

    queriesArea.infoEl.createEl("p", {
      text: "Example: [{\"id\":\"today\",\"name\":\"Today\",\"states\":[\"TODO\"],\"tags\":[\"#today\"]}]",
    });
  }
}

