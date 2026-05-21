// ── AI Queue — module-level singleton ─────────────────────────
// Runs AI jobs serially (one at a time). Any screen can add jobs;
// AppShell subscribes and shows the status banner.

import { aiLogger } from './aiLogger';

const JOB_TIMEOUT_MS = 90_000;

export type AIJobStatus = 'pending' | 'running' | 'done' | 'error';

export interface AIJobSnapshot {
  id: string;
  label: string;
  status: AIJobStatus;
  step?: string;
  error?: string;
}

type QueueListener = (jobs: AIJobSnapshot[]) => void;
export type ExecuteFn = (signal: AbortSignal, setStep: (step: string) => void) => Promise<void>;

interface InternalJob extends AIJobSnapshot {
  execute: ExecuteFn;
}

class AIQueueManager {
  private jobs: InternalJob[] = [];
  private listeners = new Set<QueueListener>();
  private busy = false;
  private currentController: AbortController | null = null;

  subscribe(cb: QueueListener): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    const snap: AIJobSnapshot[] = this.jobs.map(({ id, label, status, step, error }) => ({
      id, label, status, step, error,
    }));
    this.listeners.forEach((cb) => cb(snap));
  }

  add(label: string, execute: ExecuteFn): string {
    const id = `ai-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    this.jobs.push({ id, label, status: 'pending', execute });
    this.notify();
    void this.tick();
    return id;
  }

  private async tick() {
    if (this.busy) return;
    const next = this.jobs.find((j) => j.status === 'pending');
    if (!next) return;

    const controller = new AbortController();
    this.currentController = controller;
    this.busy = true;
    next.status = 'running';
    this.notify();

    const setStep = (step: string) => {
      next.step = step;
      this.notify();
      aiLogger.step(`[${next.label}] ${step}`);
    };

    aiLogger.info(`Début job : ${next.label}`);
    const startMs = Date.now();

    const timeoutId = setTimeout(() => {
      aiLogger.error(`[${next.label}] Timeout après ${JOB_TIMEOUT_MS / 1000}s — annulation automatique`);
      controller.abort();
    }, JOB_TIMEOUT_MS);

    try {
      await next.execute(controller.signal, setStep);
      clearTimeout(timeoutId);
      const elapsed = ((Date.now() - startMs) / 1000).toFixed(1);
      next.status = 'done';
      aiLogger.info(`Succès job : ${next.label} (${elapsed}s)`);
    } catch (e: unknown) {
      clearTimeout(timeoutId);
      const elapsed = ((Date.now() - startMs) / 1000).toFixed(1);
      if ((e as Error)?.name === 'AbortError') {
        aiLogger.warn(`[${next.label}] Annulé après ${elapsed}s`);
        // Cancelled — remove silently, no error shown
        this.jobs = this.jobs.filter((j) => j.id !== next.id);
      } else {
        const msg = (e as Error).message ?? 'Erreur inconnue';
        aiLogger.error(`[${next.label}] Erreur après ${elapsed}s : ${msg}`);
        next.status = 'error';
        next.error = msg;
      }
    }

    this.currentController = null;
    this.busy = false;
    this.notify();
    void this.tick();
  }

  cancelRunning() {
    const running = this.jobs.find((j) => j.status === 'running');
    if (running && this.currentController) {
      this.currentController.abort();
    }
  }

  dismiss(id: string) {
    this.jobs = this.jobs.filter((j) => j.id !== id);
    this.notify();
  }

  dismissCompleted() {
    this.jobs = this.jobs.filter(
      (j) => j.status === 'pending' || j.status === 'running',
    );
    this.notify();
  }

  getSnapshot(): AIJobSnapshot[] {
    return this.jobs.map(({ id, label, status, step, error }) => ({ id, label, status, step, error }));
  }
}

export const aiQueue = new AIQueueManager();
