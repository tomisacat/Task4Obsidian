import { describe, it, expect } from "vitest";
import { parseTasksFromMarkdown } from "./parser";

describe("parseTasksFromMarkdown", () => {
  it("parses basic task lines with states and text", () => {
    const content = `TODO Write plugin
DOING Implement parser
DONE Initial skeleton`;

    const tasks = parseTasksFromMarkdown("daily.md", content);
    expect(tasks).toHaveLength(3);
    expect(tasks[0].state).toBe("TODO");
    expect(tasks[1].state).toBe("DOING");
    expect(tasks[2].state).toBe("DONE");
    expect(tasks[0].text).toBe("Write plugin");
  });

  it("parses priorities and tags", () => {
    const content = `TODO [#A] Critical task #work
TODO [#C] Minor task #home`;

    const tasks = parseTasksFromMarkdown("tasks.md", content);
    expect(tasks[0].priority).toBe("A");
    expect(tasks[1].priority).toBe("C");
    expect(tasks[0].tags).toEqual(["#work"]);
    expect(tasks[1].tags).toEqual(["#home"]);
  });

  it("collects following properties", () => {
    const content = `TODO Do something #tag
project:: Project X
context:: @home

TODO Another task`;

    const tasks = parseTasksFromMarkdown("props.md", content);
    expect(tasks).toHaveLength(2);
    expect(tasks[0].properties.project).toBe("Project X");
    expect(tasks[0].properties.context).toBe("@home");
    expect(tasks[1].properties).toEqual({});
  });
});

