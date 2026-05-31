import { Bar } from '../market/bar';

const HEADER = ['timestamp', 'open', 'high', 'low', 'close', 'volume'];

/**
 * Parse CSV text into bars. Expected columns:
 * timestamp,open,high,low,close,volume. A header row is optional.
 */
export const parseCsv = (content: string, symbol: string): Bar[] => {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return [];
  }

  const firstCells = lines[0].split(',').map((c) => c.trim().toLowerCase());
  const hasHeader = HEADER.every((h, i) => firstCells[i] === h);
  const rows = hasHeader ? lines.slice(1) : lines;

  return rows.map((line, index) => {
    const cells = line.split(',').map((c) => c.trim());
    if (cells.length < 6) {
      throw new Error(`Malformed CSV row ${index + 1}: "${line}"`);
    }

    const [timestamp, open, high, low, close, volume] = cells;
    const bar: Bar = {
      timestamp,
      symbol,
      open: Number(open),
      high: Number(high),
      low: Number(low),
      close: Number(close),
      volume: Number(volume),
    };

    for (const key of ['open', 'high', 'low', 'close', 'volume'] as const) {
      if (Number.isNaN(bar[key])) {
        throw new Error(`Invalid number for ${key} on CSV row ${index + 1}: "${line}"`);
      }
    }

    return bar;
  });
};
