// ── AI Logger — module-level singleton ────────────────────────
// Keeps an in-memory ring buffer of AI-related events.
// SettingsScreen reads it to display the diagnostic panel.

export type LogLevel = 'info' | 'step' | 'warn' | 'error';

export interface LogEntry {
  ts: number;
  level: LogLevel;
  msg: string;
}

const MAX_ENTRIES = 300;

type LogListener = () => void;

class AILogger {
  private entries: LogEntry[] = [];
  private listeners = new Set<LogListener>();

  private push(level: LogLevel, msg: string) {
    this.entries.push({ ts: Date.now(), level, msg });
    if (this.entries.length > MAX_ENTRIES) {
      this.entries = this.entries.slice(-MAX_ENTRIES);
    }
    this.listeners.forEach((cb) => cb());
  }

  subscribe(cb: LogListener): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  info(msg: string) { this.push('info', msg); }
  step(msg: string) { this.push('step', msg); }
  warn(msg: string) { this.push('warn', msg); }
  error(msg: string) { this.push('error', msg); }

  clear() {
    this.entries = [];
    this.listeners.forEach((cb) => cb());
  }

  getEntries(): readonly LogEntry[] {
    return this.entries;
  }

  export(): string {
    if (this.entries.length === 0) return '(aucun log)';
    return this.entries
      .map((e) => {
        const d = new Date(e.ts);
        const time = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
        const prefix = e.level === 'error' ? '❌' : e.level === 'warn' ? '⚠️' : e.level === 'step' ? '→' : '·';
        return `[${time}] ${prefix} ${e.msg}`;
      })
      .join('\n');
  }
}

export const aiLogger = new AILogger();
