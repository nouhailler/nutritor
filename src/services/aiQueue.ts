// ── AI Queue — module-level singleton ─────────────────────────
// Runs AI jobs serially (one at a time). Any screen can add jobs;
// AppShell subscribes and shows the status banner.

export type AIJobStatus = 'pending' | 'running' | 'done' | 'error';

export interface AIJobSnapshot {
  id: string;
  label: string;
  status: AIJobStatus;
  error?: string;
}

type QueueListener = (jobs: AIJobSnapshot[]) => void;

interface InternalJob extends AIJobSnapshot {
  execute: () => Promise<void>;
}

class AIQueueManager {
  private jobs: InternalJob[] = [];
  private listeners = new Set<QueueListener>();
  private busy = false;

  // Subscribe returns an unsubscribe function
  subscribe(cb: QueueListener): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    const snap: AIJobSnapshot[] = this.jobs.map(({ id, label, status, error }) => ({
      id, label, status, error,
    }));
    this.listeners.forEach((cb) => cb(snap));
  }

  add(label: string, execute: () => Promise<void>): string {
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
    this.busy = true;
    next.status = 'running';
    this.notify();
    try {
      await next.execute();
      next.status = 'done';
    } catch (e: unknown) {
      next.status = 'error';
      next.error = (e as Error).message ?? 'Erreur inconnue';
    }
    this.busy = false;
    this.notify();
    void this.tick(); // process next job if any
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
    return this.jobs.map(({ id, label, status, error }) => ({ id, label, status, error }));
  }
}

export const aiQueue = new AIQueueManager();
