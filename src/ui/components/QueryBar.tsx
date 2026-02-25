import { h } from "preact";
import type { TaskState } from "../../core/parser";

const TASK_STATES: (TaskState | "")[] = [
  "",
  "TODO",
  "DOING",
  "DONE",
  "CANCELED",
  "WAITING",
];

const PRIORITY_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "A", label: "#A" },
  { value: "B", label: "#B" },
  { value: "C", label: "#C" },
  { value: "none", label: "None" },
];

export interface PropertyFilterRow {
  key: string;
  value: string;
}

export interface QueryBarProps {
  stateFilter: string;
  priorityFilter: string;
  tagsFilter: string;
  propertyFilters: PropertyFilterRow[];
  propKeyOptions: string[];
  propValueOptionsByKey: Record<string, string[]>;
  onStateChange: (value: string) => void;
  onPriorityChange: (value: string) => void;
  onTagsChange: (value: string) => void;
  onPropertyFiltersChange: (filters: PropertyFilterRow[]) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
}

export function QueryBar(props: QueryBarProps) {
  const {
    stateFilter,
    priorityFilter,
    tagsFilter,
    propertyFilters,
    propKeyOptions,
    propValueOptionsByKey,
    onStateChange,
    onPriorityChange,
    onTagsChange,
    onPropertyFiltersChange,
    onClear,
    hasActiveFilters,
  } = props;

  const updatePropertyRow = (index: number, update: Partial<PropertyFilterRow>) => {
    const next = propertyFilters.slice();
    next[index] = { ...next[index], ...update };
    onPropertyFiltersChange(next);
  };

  const removePropertyRow = (index: number) => {
    onPropertyFiltersChange(propertyFilters.filter((_, i) => i !== index));
  };

  const addPropertyRow = () => {
    onPropertyFiltersChange([...propertyFilters, { key: "", value: "" }]);
  };

  return (
    <div className="logseq-query-bar">
      <div className="logseq-query-row">
        <label className="logseq-query-label">State</label>
        <select
          className="logseq-query-select"
          value={stateFilter}
          onChange={(e) => onStateChange((e.target as HTMLSelectElement).value)}
          title="Filter by task state"
        >
          <option value="">All</option>
          {TASK_STATES.filter(Boolean).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="logseq-query-row">
        <label className="logseq-query-label">Priority</label>
        <select
          className="logseq-query-select"
          value={priorityFilter}
          onChange={(e) => onPriorityChange((e.target as HTMLSelectElement).value)}
          title="Filter by priority"
        >
          {PRIORITY_OPTIONS.map((opt) => (
            <option key={opt.value || "all"} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="logseq-query-row">
        <label className="logseq-query-label">Tags</label>
        <input
          type="text"
          className="logseq-query-input"
          placeholder="#work #urgent"
          value={tagsFilter}
          onChange={(e) => onTagsChange((e.target as HTMLInputElement).value)}
          title="Filter by tags (space-separated, e.g. #work #urgent)"
        />
      </div>

      <div className="logseq-query-property-section">
        <div className="logseq-query-property-header">
          <span className="logseq-query-property-title">Property</span>
          <button
            type="button"
            className="logseq-query-add-prop"
            onClick={addPropertyRow}
            title="Add property filter"
          >
            + Add filter
          </button>
        </div>
        <div className="logseq-query-property-rows">
          {propertyFilters.map((row, index) => (
            <div key={index} className="logseq-query-property-row">
              <div className="logseq-query-property-field">
                <label className="logseq-query-property-field-label">Key</label>
                <select
                  className="logseq-query-select logseq-query-select-key"
                  value={row.key}
                  onChange={(e) => {
                    const v = (e.target as HTMLSelectElement).value;
                    updatePropertyRow(index, { key: v, value: "" });
                  }}
                  title="Property key"
                >
                  <option value="">—</option>
                  {propKeyOptions.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>
              <div className="logseq-query-property-field">
                <label className="logseq-query-property-field-label">Value</label>
                <select
                  className="logseq-query-select logseq-query-select-value"
                  value={row.value}
                  onChange={(e) =>
                    updatePropertyRow(index, {
                      value: (e.target as HTMLSelectElement).value,
                    })
                  }
                  disabled={!row.key}
                  title="Property value"
                >
                  <option value="">—</option>
                  {(propValueOptionsByKey[row.key] ?? []).map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                className="logseq-query-remove-prop"
                onClick={() => removePropertyRow(index)}
                title="Remove property filter"
                aria-label="Remove property filter"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="logseq-query-clear"
        onClick={onClear}
        disabled={!hasActiveFilters}
        title={hasActiveFilters ? "Clear all filters" : "No filters active"}
      >
        Clear filters
      </button>
    </div>
  );
}
