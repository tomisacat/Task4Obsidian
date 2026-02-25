import { App, Modal, Setting } from "obsidian";
import type { TaskBlock } from "../core/parser";
import type TasksPlugin from "../main";

export class PropertyModal extends Modal {
  private plugin: TasksPlugin;
  private task: TaskBlock;

  private entries: { key: string; value: string }[] = [];

  constructor(app: App, plugin: TasksPlugin, task: TaskBlock) {
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
    contentEl.addClass("logseq-property-modal-content");

    const title = contentEl.createEl("h2", { text: "Edit task properties" });
    title.addClass("logseq-property-modal-title");

    const listEl = contentEl.createDiv({ cls: "logseq-property-rows" });

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

    const buttons = contentEl.createDiv({ cls: "logseq-modal-actions" });

    const cancelBtn = buttons.createEl("button", {
      text: "Cancel",
      cls: "logseq-btn logseq-btn-ghost",
    });
    const saveBtn = buttons.createEl("button", {
      text: "Save",
      cls: "logseq-btn logseq-btn-primary",
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

