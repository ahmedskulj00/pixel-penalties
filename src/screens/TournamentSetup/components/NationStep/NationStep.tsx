import { useMemo } from 'react';
import type { Competition, Edition, NationGroup, NationId } from '@/types';
import { NationPicker, type NationSection } from '@/components/NationPicker';
import { Switch } from '@/components/Switch';
import { eligibleIds, formatLabel, formatOf, qualifyRule } from '@/data/competitions';
import { GROUP_LABELS, NATIONS, NATION_BY_ID, getNation, nameIn, sectionIn } from '@/data/nations';
import { Champion } from '../Champion';
import { LeagueLine } from '../LeagueLine';
import './NationStep.css';

export interface NationStepProps {
  comp: Competition;
  edition: Edition;
  nationId: NationId | null;
  setNationId: (id: NationId | null) => void;
  dream: boolean;
  setDream: (dream: boolean) => void;
}

/** Split nation ids into picker sections by confederation (as it was in `year`), keeping their order. */
function byConfederation(ids: NationId[], prefix: string, year?: number): NationSection[] {
  const buckets = new Map<string, NationId[]>(Object.keys(GROUP_LABELS).map((g) => [g, []]));
  for (const id of ids) buckets.get(year == null ? NATION_BY_ID.get(id)!.group : sectionIn(NATION_BY_ID.get(id)!, year))?.push(id);
  const filled = [...buckets].filter(([, list]) => list.length);
  if (filled.length <= 1) return [{ title: prefix, ids }];
  return filled.map(([g, list]) => ({ title: `${prefix}: ${GROUP_LABELS[g as NationGroup]}`, ids: list }));
}

/** Picker sections for an edition: the real line-up, everyone else eligible, then dream entries. */
function nationSections(comp: Competition, edition: Edition, dream: boolean): { sections: NationSection[]; eligible: NationId[] } {
  const field = (edition.field ?? []).filter((id) => NATION_BY_ID.has(id));
  const eligible = eligibleIds(comp, edition);
  const inField = new Set(field);
  const others = eligible.filter((id) => !inField.has(id));
  const taken = new Set(eligible);
  const rest = NATIONS.map((n) => n.id).filter((id) => !taken.has(id));
  const sections: NationSection[] = [];
  if (edition.leagues) {
    const byLeague: [string, NationId[][]][] = [['A', edition.groups!], ...Object.entries(edition.leagues)];
    for (const [league, groups] of byLeague) sections.push({ title: `League ${league}`, ids: groups.flat() });
  } else {
    if (field.length) sections.push({ title: edition.status === 'upcoming' ? 'Confirmed teams' : 'In the real line-up', ids: field });
    if (others.length)
      sections.push(...byConfederation(others, field.length ? `Also eligible in ${edition.year}` : `Eligible in ${edition.year}`, edition.year));
  }
  if (dream && rest.length) sections.push(...byConfederation(rest, 'Dream entries'));
  return { sections, eligible };
}

/** Step 3: the edition in brief, dream mode, and the nations that can enter. */
export function NationStep({ comp, edition, nationId, setNationId, dream, setDream }: NationStepProps) {
  // Cached per edition, so picking a nation only re-renders the two tiles that change.
  const { sections, eligible } = useMemo(() => nationSections(comp, edition, dream), [comp, edition, dream]);

  return (
    <div className="step-body">
      <div className="edition-summary frame">
        <div>
          <p className="edition-summary__name">
            {comp.short} {edition.label}
          </p>
          <p className="muted">
            {edition.hosts.length
              ? 'Hosted by ' + edition.hosts.map((id) => nameIn(getNation(id), edition.year)).join(', ')
              : (edition.hostNote ?? 'No fixed host')}
          </p>
          <p className="edition-summary__format">
            {edition.leagues ? 'League A: ' : ''}
            {formatLabel(formatOf(comp, edition))}. {qualifyRule(formatOf(comp, edition)) ?? ''}
          </p>
          {edition.leagues && <LeagueLine comp={comp} edition={edition} nationId={nationId} dream={dream} />}
          {edition.note && <p className="edition-summary__note">{edition.note}</p>}
        </div>
        <Champion edition={edition} />
      </div>
      <Switch
        label="Dream mode"
        description="Enter any nation from any era, like the Soviet Union at the 2030 World Cup."
        checked={dream}
        onChange={(v) => {
          setDream(v);
          if (!v && nationId && !eligible.includes(nationId)) setNationId(null);
        }}
      />
      <NationPicker sections={sections} year={edition.year} selected={nationId} onSelect={setNationId} />
    </div>
  );
}
