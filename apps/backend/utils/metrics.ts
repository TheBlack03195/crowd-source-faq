
type CounterMap = Map<string, number>;
type HistogramMap = Map<string, number[]>;

const counters: CounterMap = new Map();
const histograms: HistogramMap = new Map();

export function incrementCounter(name: string, value = 1) {
  counters.set(name, (counters.get(name) ?? 0) + value);
}

export function recordDuration(name: string, ms: number) {
  const list = histograms.get(name) ?? [];
  list.push(ms);
  
  if (list.length > 1000) list.shift();
  histograms.set(name, list);
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}


export function renderMetrics(): string {
  const lines: string[] = [];

  for (const [name, value] of counters) {
    lines.push(`# TYPE ${name} counter`);
    lines.push(`${name} ${value}`);
  }

  for (const [name, samples] of histograms) {
    const sorted = [...samples].sort((a, b) => a - b);
    lines.push(`# TYPE ${name} summary`);
    lines.push(`${name}{quantile="0.5"} ${percentile(sorted, 50)}`);
    lines.push(`${name}{quantile="0.9"} ${percentile(sorted, 90)}`);
    lines.push(`${name}{quantile="0.99"} ${percentile(sorted, 99)}`);
    lines.push(`${name}_count ${samples.length}`);
  }

  return lines.join('\n') + '\n';
}
