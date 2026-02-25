import { App, Modal, Setting } from "obsidian";
import type { TaskBlock } from "../core/parser";
import type LogseqTasksPlugin from "../main";

export class PropertyModal extends Modal {
  private plugin: LogseqTasksPlugin;
  private task: TaskBlock;

  private entries: { key: string; value: string }[] = [];

  constructor(app: App, plugin: LogseqTasksPlugin, task: TaskBlock) {
    super(app);
    this.plugin = plugin;
    this.task = task;
    this.entries = Object.entries(task.properties).map(([key, value]) => ({
      key,
      value,
    }));
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl("h3", { text: "Edit task properties" });

    const listEl = contentEl.createDiv();

    const renderRows = () => {
      listEl.empty();

      this.entries.forEach((entry, index) => {
        const setting = new Setting(listEl);
        setting.addText((text) => {
          text.setPlaceholder("key");
          text.setValue(entry.key);
          text.onChange((value) => {
            this.entries[index].key = value;
          });
        });
        setting.addText((text) => {
          text.setPlaceholder("value");
          text.setValue(entry.value);
          text.onChange((value) => {
            this.entries[index].value = value;
          });
        });
        setting.addExtraButton((btn) => {
          btn.setIcon("cross");
          btn.setTooltip("Remove property");
          btn.onClick(() => {
            this.entries.splice(index, 1);
            renderRows();
          });
        });
      });

      const addRow = new Setting(listEl);
      addRow.addButton((btn) => {
        btn.setButtonText("Add property");
        btn.onClick(() => {
          this.entries.push({ key: "", value: "" });
          renderRows();
        });
      });
    };

    renderRows();

    const buttons = contentEl.createDiv({ cls: "logseq-task-modal-buttons" });

    const saveBtn = buttons.createEl("button", {
      text: "Save",
      cls: "mod-cta",
    });
    const cancelBtn = buttons.createEl("button", {
      text: "Cancel",
    });

    saveBtn.addEventListener("click", async () => {
      const properties: Record<string, string> = {};
      for (const { key, value } of this.entries) {
        const k = key.trim();
        const v = value.trim();
        if (!k || !v) continue;
        properties[k] = v;
      }
      await this.plugin.setTaskProperties(this.task.id, properties);
      this.close();
    });

    cancelBtn.addEventListener("click", () => {
      this.close();
    });
  }

  onClose() {
    this.contentEl.empty();
  }
}

