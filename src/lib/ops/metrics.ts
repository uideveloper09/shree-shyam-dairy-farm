type CounterMap = Map<string, number>;
type HistogramBucket = { sum: number; count: number };

const counters: CounterMap = new Map();
const histograms: Map<string, HistogramBucket> = new Map();
const startTime = Date.now();

export const metrics = {
  increment(name: string, value = 1, labels?: Record<string, string>) {
    const key = labelKey(name, labels);
    counters.set(key, (counters.get(key) || 0) + value);
  },

  observe(name: string, value: number, labels?: Record<string, string>) {
    const key = labelKey(name, labels);
    const bucket = histograms.get(key) || { sum: 0, count: 0 };
    bucket.sum += value;
    bucket.count += 1;
    histograms.set(key, bucket);
  },

  toPrometheus(): string {
    const lines: string[] = [];
    lines.push("# HELP ssd_uptime_seconds Process uptime");
    lines.push("# TYPE ssd_uptime_seconds gauge");
    lines.push(`ssd_uptime_seconds ${Math.floor((Date.now() - startTime) / 1000)}`);

    for (const [key, value] of counters) {
      const { name, labels } = parseKey(key);
      lines.push(`# TYPE ${name} counter`);
      lines.push(`${name}${formatLabels(labels)} ${value}`);
    }

    for (const [key, bucket] of histograms) {
      const { name, labels } = parseKey(key);
      lines.push(`# TYPE ${name}_sum summary`);
      lines.push(`${name}_sum${formatLabels(labels)} ${bucket.sum}`);
      lines.push(`# TYPE ${name}_count summary`);
      lines.push(`${name}_count${formatLabels(labels)} ${bucket.count}`);
    }

    return lines.join("\n") + "\n";
  },
};

function labelKey(name: string, labels?: Record<string, string>) {
  if (!labels || !Object.keys(labels).length) return name;
  return `${name}|${JSON.stringify(labels)}`;
}

function parseKey(key: string) {
  const [name, labelJson] = key.split("|");
  return { name, labels: labelJson ? (JSON.parse(labelJson) as Record<string, string>) : {} };
}

function formatLabels(labels: Record<string, string>) {
  const entries = Object.entries(labels);
  if (!entries.length) return "";
  return `{${entries.map(([k, v]) => `${k}="${v}"`).join(",")}}`;
}
