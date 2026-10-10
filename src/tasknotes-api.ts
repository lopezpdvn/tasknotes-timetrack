import type { App, EventRef } from "obsidian";

/** Structural subset of TaskNotes' public runtime contract; no runtime import.
 * https://github.com/callumalpass/tasknotes/blob/main/src/api/runtime-api.ts
 * TaskNotes may return additional fields which this companion does not use.
 */
export interface ActiveTimeEntry {
  taskPath: string;
  entry: { startTime: string };
}

export interface TaskNotesTimerApi {
  events: {
    on(event: "time.started", handler: () => void): EventRef;
    off(ref: EventRef): void;
  };
  time: {
    active(): Promise<ActiveTimeEntry[]>;
    stop(path: string): Promise<unknown>;
  };
}

type PluginRegistry = {
  getPlugin(id: string): { api?: TaskNotesTimerApi } | null;
};

// Obsidian's plugin registry is available at runtime but absent from its types.
export function getTaskNotesApi(app: App): TaskNotesTimerApi | null {
  const registry = (app as App & { plugins: PluginRegistry }).plugins;
  const api = registry.getPlugin("tasknotes")?.api;
  if (
    !api ||
    typeof api.events?.on !== "function" ||
    typeof api.events?.off !== "function" ||
    typeof api.time?.active !== "function" ||
    typeof api.time?.stop !== "function"
  ) return null;
  return api;
}
