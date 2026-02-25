# Logseq-style Tasks for Obsidian

Logseq-style, outliner-focused task management with query-based side pane views for Obsidian.

## Task syntax

- **States**: lines starting with `TODO`, `DOING`, `DONE`, `CANCELED`, or `WAITING` are treated as tasks:

```markdown
TODO [#A] Implement task parser #work
DOING Investigate bug in project X #debug
DONE [#C] Refactor helper function
```

- **Priorities**: optional `[#A]`, `[#B]`, or `[#C]` immediately after the state.
- **Tags**: inline `#tags` in the task text are indexed and can be queried.
- **Properties**: lines immediately following a task that match `key:: value` are stored as properties, e.g.:

```markdown
TODO Implement indexer #work
project:: Project X
context:: @home
```

## Task panel

Open the **Logseq Tasks** pane from the ribbon icon or command palette. The pane:

- Shows **all tasks in your vault**, grouped by page.
- Allows basic interactions:
  - Click the state button to **cycle** between `TODO → DOING → DONE → CANCELED`.
  - Click the priority button to cycle between no priority and `[#C]`, `[#B]`, `[#A]`.
  - Click the text to open the source note.
  - Click the `…` button to quickly edit `project::` and `context::` via prompts.

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

3. Link or copy the plugin folder into your Obsidian vault's `.obsidian/plugins` directory.

4. Enable **Logseq-style Tasks** in Obsidian's community plugins settings.

