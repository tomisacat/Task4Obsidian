import { App, Modal } from "obsidian";
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
    this.modalEl.addClass("logseq-property-modal");
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("logseq-property-modal-content");

    const header = contentEl.createDiv({ cls: "logseq-property-modal-header" });
    const title = header.createEl("h2", { text: "Edit task properties" });
    title.addClass("logseq-property-modal-title");
    const subtitle = header.createEl("p", {
      text: "Add or edit key:: value pairs. Empty rows are ignored when saving.",
    });
    subtitle.addClass("logseq-property-modal-subtitle");

    const listEl = contentEl.createDiv({ cls: "logseq-property-rows" });

    const renderRows = () => {
      listEl.empty();

      this.entries.forEach((entry, index) => {
        const row = listEl.createDiv({ cls: "logseq-property-row" });
        const fields = row.createDiv({ cls: "logseq-property-fields" });

        const keyWrap = fields.createDiv({ cls: "logseq-property-field" });
        keyWrap.createEl("label", { text: "Key", cls: "logseq-property-label" });
        const keyInput = keyWrap.createEl("input", {
          type: "text",
          cls: "logseq-property-input",
        });
        keyInput.placeholder = "e.g. project";
        keyInput.value = entry.key;
        keyInput.addEventListener("input", () => {
          this.entries[index].key = keyInput.value;
        });

        const valueWrap = fields.createDiv({ cls: "logseq-property-field" });
        valueWrap.createEl("label", { text: "Value", cls: "logseq-property-label" });
        const valueInput = valueWrap.createEl("input", {
          type: "text",
          cls: "logseq-property-input",
        });
        valueInput.placeholder = "e.g. My Project";
        valueInput.value = entry.value;
        valueInput.addEventListener("input", () => {
          this.entries[index].value = valueInput.value;
        });

        const removeBtn = row.createEl("button", {
          type: "button",
          cls: "logseq-property-remove",
        });
        removeBtn.setAttribute("aria-label", "Remove property");
        removeBtn.innerHTML =
          '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        removeBtn.addEventListener("click", () => {
          this.entries.splice(index, 1);
          renderRows();
        });
      });

      const addWrap = listEl.createDiv({ cls: "logseq-property-add-wrap" });
      const addBtn = addWrap.createEl("button", {
        type: "button",
        text: "+ Add property",
        cls: "logseq-property-add-btn",
      });
      addBtn.addEventListener("click", () => {
        this.entries.push({ key: "", value: "" });
        renderRows();
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

    cancelBtn.addEventListener("click", () => this.close());
  }

  onClose() {
    this.modalEl.removeClass("logseq-property-modal");
    this.contentEl.empty();
  }
}

