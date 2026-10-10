import { Notice, Plugin, type EventRef } from "obsidian";
import { getTaskNotesApi, type TaskNotesTimerApi } from "./tasknotes-api";

const CONNECT_RETRY_MS = 500;
const MAX_CONNECT_ATTEMPTS = 60;

/**
 * This plugin deliberately uses only TaskNotes' published runtime API:
 * - api.events.on("time.started", handler)
 * - api.time.active()
 * - api.time.stop(path)
 *
 * It therefore survives TaskNotes upgrades much better than a patched
 * TaskNotes main.js.  The event is emitted for starts from the native context
 * menu, commands, HTTP API, and other API consumers.
 */
export default class TaskNotesTimeTrack extends Plugin {
	private unloaded = false;
	private serial: Promise<void> = Promise.resolve();
	private taskNotesApi: TaskNotesTimerApi | null = null;
	private taskNotesEventRef: EventRef | null = null;
	async onload() {
		this.unloaded = false;
		this.serial = Promise.resolve();
		this.taskNotesApi = null;
		this.taskNotesEventRef = null;

		this.addCommand({
			id: "stop-all-time-tracking",
			name: "Stop all TaskNotes time tracking",
			callback: () => {
				void this.enqueue(async () => {
					const api = this.requireTaskNotesApi();
					if (!api) return;
					const stopped = await this.stopAllActiveTimers(api);
					new Notice(
						stopped === 0
							? "TaskNotes: no active timers"
							: `TaskNotes: stopped ${stopped} active timer${stopped === 1 ? "" : "s"}`
					);
				});
			},
		});

		this.addCommand({
			id: "keep-newest-time-tracker",
			name: "Keep newest TaskNotes timer only",
			callback: () => {
				void this.enqueue(async () => {
					const api = this.requireTaskNotesApi();
					if (!api) return;
					const stopped = await this.keepNewestTimerOnly(api);
					new Notice(
						stopped === 0
							? "TaskNotes: zero or one timer was already active"
							: `TaskNotes: stopped ${stopped} older timer${stopped === 1 ? "" : "s"}`
					);
				});
			},
		});

		this.app.workspace.onLayoutReady(() => this.connectWhenTaskNotesIsReady());
	}

	onunload() {
		this.unloaded = true;
		if (this.taskNotesApi && this.taskNotesEventRef) {
			this.taskNotesApi.events.off(this.taskNotesEventRef);
		}
	}

	connectWhenTaskNotesIsReady() {
		if (this.connectToTaskNotes()) return;

		let attempts = 0;
		const interval = window.setInterval(() => {
			if (this.unloaded || this.connectToTaskNotes()) {
				window.clearInterval(interval);
				return;
			}

			attempts += 1;
			if (attempts >= MAX_CONNECT_ATTEMPTS) {
				window.clearInterval(interval);
				new Notice(
					"TaskNotes TimeTrack: TaskNotes' runtime API was not found. Update and enable TaskNotes, then reload this plugin."
				);
			}
		}, CONNECT_RETRY_MS);
		this.registerInterval(interval);
	}

	connectToTaskNotes() {
		if (this.taskNotesApi) return true;

		const api = this.getTaskNotesApi();
		if (!api) return false;

		this.taskNotesApi = api;
		this.taskNotesEventRef = api.events.on("time.started", () => {
			// The event is post-start. Serializing reconciliation avoids races
			// between rapid clicks; choosing the newest timestamp makes the last
			// requested start win even if two events are already queued.
			void this.enqueue(() => this.keepNewestTimerOnly(api));
		});
		return true;
	}

	getTaskNotesApi(): TaskNotesTimerApi | null {
		return getTaskNotesApi(this.app);
	}

	requireTaskNotesApi() {
		const api = this.taskNotesApi || this.getTaskNotesApi();
		if (!api) {
			new Notice(
				"TaskNotes TimeTrack requires TaskNotes with its runtime API enabled."
			);
			return null;
		}
		return api;
	}

	enqueue(operation: () => Promise<unknown>): Promise<void> {
		this.serial = this.serial
			.catch(() => undefined)
			.then(async () => {
				if (!this.unloaded) await operation();
			})
			.catch((error) => {
				console.error("TaskNotes TimeTrack failed to reconcile timers", error);
				new Notice("TaskNotes TimeTrack: unable to reconcile active timers.");
			});
		return this.serial;
	}

	async stopAllActiveTimers(api: TaskNotesTimerApi): Promise<number> {
		const active = await api.time.active();
		const paths = [...new Set(active.map((session) => session.taskPath))];
		for (const path of paths) {
			await api.time.stop(path);
		}
		return paths.length;
	}

	async keepNewestTimerOnly(api: TaskNotesTimerApi): Promise<number> {
		const active = await api.time.active();
		if (active.length <= 1) return 0;

		const newest = active.reduce((winner, candidate) => {
			const winnerTime = Date.parse(winner.entry.startTime);
			const candidateTime = Date.parse(candidate.entry.startTime);
			return candidateTime > winnerTime ? candidate : winner;
		});
		const pathsToStop = [
			...new Set(
				active
					.filter((session) => session.taskPath !== newest.taskPath)
					.map((session) => session.taskPath)
			),
		];

		for (const path of pathsToStop) {
			await api.time.stop(path);
		}
		return pathsToStop.length;
	}
}
