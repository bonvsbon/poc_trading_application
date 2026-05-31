import { parseCsv } from './data-loader';

describe('parseCsv', () => {
  it('parses rows with a header', () => {
    const csv = [
      'timestamp,open,high,low,close,volume',
      '2026-05-29T13:30:00.000Z,100,101,99,100,1000',
      '2026-05-29T13:31:00.000Z,100,102,99,101,1500',
    ].join('\n');

    const bars = parseCsv(csv, 'NVDA');
    expect(bars).toHaveLength(2);
    expect(bars[0]).toMatchObject({ symbol: 'NVDA', open: 100, high: 101, close: 100, volume: 1000 });
    expect(bars[1].close).toBe(101);
  });

  it('parses rows without a header', () => {
    const csv = '2026-05-29T13:30:00.000Z,100,101,99,100,1000';
    const bars = parseCsv(csv, 'NVDA');
    expect(bars).toHaveLength(1);
    expect(bars[0].volume).toBe(1000);
  });

  it('ignores blank lines', () => {
    const csv = '\n2026-05-29T13:30:00.000Z,100,101,99,100,1000\n\n';
    expect(parseCsv(csv, 'NVDA')).toHaveLength(1);
  });

  it('returns an empty array for empty input', () => {
    expect(parseCsv('', 'NVDA')).toEqual([]);
  });

  it('throws on a malformed row', () => {
    expect(() => parseCsv('2026-05-29,100,101', 'NVDA')).toThrow('Malformed CSV row');
  });

  it('throws on a non-numeric field', () => {
    expect(() => parseCsv('2026-05-29,abc,101,99,100,1000', 'NVDA')).toThrow('Invalid number');
  });
});
