import { describe, expect, it } from 'vitest';
import { AUDIO_RUNS, SPEAKERS } from '../../src/data/audio.ts';
import { DEVICE_ROUTES, PATHWAYS, PENETRATIONS } from '../../src/data/cabling.ts';
import { infoCardFor } from '../../src/data/infoCards.ts';

describe('infoCardFor', () => {
  it('builds a card for every clickable target', () => {
    for (const w of PATHWAYS.filter((x) => x.service === 'data')) expect(infoCardFor({ type: 'pathway', id: w.id })?.title).toBe(w.id);
    for (const r of DEVICE_ROUTES) expect(infoCardFor({ type: 'drop', id: r.device.id })?.checks.length).toBeGreaterThan(0);
    for (const p of PENETRATIONS) expect(infoCardFor({ type: 'sleeve', id: p.id })?.title).toBe(p.id);
    for (const s of SPEAKERS) expect(infoCardFor({ type: 'speaker', id: s.id })?.specs[0]?.[1]).toContain('JBL EON715');
    for (const a of AUDIO_RUNS) expect(infoCardFor({ type: 'audio', line: a.line })).not.toBeNull();
    expect(infoCardFor({ type: 'idf' })?.title).toBe('IDF-N');
    expect(infoCardFor({ type: 'pathway', id: 'NOPE' })).toBeNull();
  });

  it('states cable type, category and length on a drop', () => {
    const card = infoCardFor({ type: 'drop', id: 'CAM05' });
    const specs = Object.fromEntries(card?.specs ?? []);
    expect(specs.Cable).toContain('Cat6');
    expect(specs['Enlace permanente']).toMatch(/^\d+\.\d m$/);
    expect(card?.checks.find((c) => c.standard.includes('568.2'))?.verdict).toBe('pass');
  });

  it('reports a drop that does not hug a surface as not meeting the criterion', () => {
    const hug = infoCardFor({ type: 'drop', id: 'M17' })?.checks.find((c) => c.standard.includes('pegado'));
    expect(hug?.verdict).toBe('pass');
  });

  it('reports the unbudgeted IDF power as not met', () => {
    expect(infoCardFor({ type: 'idf' })?.checks.find((c) => c.standard === 'Alimentación')?.verdict).toBe('fail');
  });

  it('keeps every tray under the TIA-569 fill limit', () => {
    for (const w of PATHWAYS.filter((x) => x.service === 'data')) {
      expect(infoCardFor({ type: 'pathway', id: w.id })?.checks.find((c) => c.standard.includes('llenado'))?.verdict).toBe('pass');
    }
  });
});
