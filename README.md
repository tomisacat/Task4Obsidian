# Logseq-style Tasks for Obsidian

Logseq-style, outliner-focused task management with a side pane that lists all tasks in your vault, grouped by page.

## Task syntax

- **States**: Lines starting with `TODO`, `DOING`, `DONE`, `CANCELED`, or `WAITING` are treated as tasks. You can use a list bullet before the keyword:

```markdown
TODO [#A] Implement task parser #work
- DOING Investigate bug in project X #debug
* DONE [#C] Refactor helper function
```

- **Priorities**: Optional `[#A]`, `[#B]`, or `[#C]` immediately after the state.
- **Tags**: Inline `#tags` in the task text are indexed.
- **Properties**: Lines immediately under a task that match `key:: value` are stored as properties:

```markdown
TODO Implement indexer #work
project:: Project X
context:: @home
```

## Task panel

Open the **Logseq Tasks** pane from the ribbon icon (check-circle) or the command **"Open Logseq Tasks view"**.

- **All tasks** in your vault are listed and **grouped by page** (file).
- Each task is shown as a card:
  - **First line**: Action buttons — **state** (TODO/DOING/DONE/…), **priority** (#A/#B/#C), and **properties** (gear icon).
  - **Second line**: The task description (clickable).
- **Interactions**:
  - **Click the task description** to open the note and **jump to that task’s line** (cursor and scroll).
  - **State button**: Cycle `TODO → DOING → DONE → CANCELED`.
  - **Priority button**: Cycle no priority → `#C` → `#B` → `#A`.
  - **Gear button**: Open the **Edit task properties** modal to add, edit, or remove any `key:: value` properties for that task.
- The list **refreshes automatically** when you change files in the vault.

## Development

1. Install dependencies:

```bash
cd obsidian-logseq-tasks
npm install
```

2. Build the plugin:

```bash
npm run build
```

3. Link or copy the plugin folder into your Obsidian vault’s `.obsidian/plugins` directory (e.g. `.obsidian/plugins/obsidian-logseq-tasks`).

4. Enable **Logseq-style Tasks** in **Settings → Community plugins**.

5. Use **npm run dev** for watch mode while developing.
