const assert = require("node:assert/strict");
const { existsSync, readFileSync } = require("node:fs");
const { stripTypeScriptTypes } = require("node:module");
const { runInNewContext } = require("node:vm");
const { test } = require("node:test");

function pluginCode() {
  if (existsSync("main.js")) return readFileSync("main.js", "utf8");
  // Offline test harness only. Production releases always use esbuild.
  const apiSource = stripTypeScriptTypes(readFileSync("src/tasknotes-api.ts", "utf8"))
    .replace("export function getTaskNotesApi", "function getTaskNotesApi");
  const mainSource = stripTypeScriptTypes(readFileSync("src/main.ts", "utf8"))
    .replace(/^import \{[^}]*\} from "obsidian";/m, 'const { Notice, Plugin } = require("obsidian");')
    .replace(/^import \{[^}]*\} from "\.\/tasknotes-api";/m, "")
    .replace("export default class TaskNotesTimeTrack", "module.exports.default = class TaskNotesTimeTrack");
  const code = `${apiSource}\n${mainSource}`;
  assert.doesNotMatch(code, /^import\s/m, "The offline harness supports only the two existing source modules");
  return code;
}

const code = pluginCode();
console.log(existsSync("main.js") ? "Testing compiled bundle" : "Testing source via Node TypeScript stripping; production build not verified");

function session(taskPath, second) {
  return { taskPath, entry: { startTime: `2026-10-10T12:00:${String(second).padStart(2, "0")}.000Z` } };
}

function harness(initial = []) {
  let active = initial.slice();
  let handler;
  let layoutReady;
  let available = true;
  let failNextRead = false;
  let activeReads = 0;
  const stopped = [];
  const notices = [];
  const commands = new Map();
  const intervalCallbacks = new Map();
  let nextInterval = 0;
  const eventRef = {};
  let detached = false;
  const api = {
    events: {
      on(event, callback) { assert.equal(event, "time.started"); handler = callback; return eventRef; },
      off(ref) { assert.equal(ref, eventRef); detached = true; handler = undefined; },
    },
    time: {
      async active() {
        activeReads++;
        if (failNextRead) { failNextRead = false; throw new Error("Temporary API failure"); }
        return active.slice();
      },
      async stop(path) { stopped.push(path); active = active.filter((item) => item.taskPath !== path); },
    },
  };
  class Plugin {
    constructor() {
      this.app = {
        plugins: { getPlugin: () => available ? { api } : null },
        workspace: { onLayoutReady: (callback) => { layoutReady = callback; } },
      };
    }
    addCommand(command) { commands.set(command.id, command.callback); }
    registerInterval() {}
  }
  const sandbox = {
    module: { exports: {} },
    require(name) {
      assert.equal(name, "obsidian");
      return { Plugin, Notice: class { constructor(message) { notices.push(message); } } };
    },
    console: { error() {} },
    window: {
      setInterval(callback) { const id = ++nextInterval; intervalCallbacks.set(id, callback); return id; },
      clearInterval(id) { intervalCallbacks.delete(id); },
    },
  };
  runInNewContext(code, sandbox);
  const PluginClass = sandbox.module.exports.default;
  assert.equal(typeof PluginClass, "function", "The plugin must provide a default class export");
  const plugin = new PluginClass();
  return {
    plugin, stopped, notices, commands,
    get active() { return active; },
    get activeReads() { return activeReads; },
    get detached() { return detached; },
    async load() { await plugin.onload(); layoutReady(); },
    async flush() { await plugin.serial; },
    start(item) { active.push(item); handler(); },
    emit() { handler(); },
    failRead() { failNextRead = true; },
    setAvailable(value) { available = value; },
    tick() { for (const callback of [...intervalCallbacks.values()]) callback(); },
  };
}

test("native start event keeps the latest timestamp regardless of API ordering", async () => {
  const h = harness([session("middle.md", 20), session("old.md", 10)]);
  await h.load();
  h.start(session("new.md", 30));
  await h.flush();
  assert.deepEqual(h.active.map((item) => item.taskPath), ["new.md"]);
  assert.deepEqual(h.stopped, ["middle.md", "old.md"]);
});

test("rapid events settle on the newest task", async () => {
  const h = harness([session("old.md", 10)]);
  await h.load();
  h.start(session("middle.md", 20));
  h.start(session("new.md", 30));
  await h.flush();
  assert.deepEqual(h.active.map((item) => item.taskPath), ["new.md"]);
  assert.equal(h.notices.length, 0);
});

test("stop-all command stops each distinct task once", async () => {
  const h = harness([session("a.md", 10), session("a.md", 11), session("b.md", 20)]);
  await h.load();
  h.commands.get("stop-all-time-tracking")();
  await h.flush();
  assert.deepEqual(h.stopped, ["a.md", "b.md"]);
  assert.deepEqual(h.active, []);
  assert.match(h.notices[0], /stopped 2 active timers/);
});

test("startup preserves existing timers until the keep-newest command runs", async () => {
  const h = harness([session("old.md", 10), session("new.md", 20)]);
  await h.load();
  assert.equal(h.activeReads, 0);
  h.commands.get("keep-newest-time-tracker")();
  await h.flush();
  assert.deepEqual(h.active.map((item) => item.taskPath), ["new.md"]);
});

test("an API failure is reported and subsequent events still reconcile", async () => {
  const h = harness([session("old.md", 10), session("new.md", 20)]);
  await h.load();
  h.failRead();
  h.emit();
  await h.flush();
  assert.match(h.notices[0], /unable to reconcile/);
  h.emit();
  await h.flush();
  assert.deepEqual(h.active.map((item) => item.taskPath), ["new.md"]);
});

test("unload detaches the event and suppresses queued operations", async () => {
  const h = harness([session("old.md", 10), session("new.md", 20)]);
  await h.load();
  h.emit();
  h.plugin.onunload();
  await h.flush();
  assert.equal(h.detached, true);
  assert.deepEqual(h.stopped, []);
});

test("delayed TaskNotes loading connects through retry", async () => {
  const h = harness([session("old.md", 10)]);
  h.setAvailable(false);
  await h.load();
  h.setAvailable(true);
  h.tick();
  h.start(session("new.md", 20));
  await h.flush();
  assert.deepEqual(h.active.map((item) => item.taskPath), ["new.md"]);
});

test("missing TaskNotes gives a useful command notification", async () => {
  const h = harness();
  h.setAvailable(false);
  await h.load();
  h.commands.get("stop-all-time-tracking")();
  await h.flush();
  assert.match(h.notices[0], /requires TaskNotes/);
  assert.deepEqual(h.stopped, []);
});
