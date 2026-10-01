import { useDeferredValue, useId, useMemo, useState } from 'react';
import type { NationId } from '@/types';
import { NATION_BY_ID, nameIn } from '@/data/nations';
import { foldText as fold } from '@/utils/text';
import { NationTile } from './NationTile';
import './NationPicker.css';

export interface NationSection {
  title: string;
  ids: NationId[];
  /** Replaces a nation's active years under its name. */
  tag?: (id: NationId) => string | undefined;
}

export interface NationPickerProps {
  /** Rendered in order, filtered by the search box. */
  sections: readonly NationSection[];
  /** Year for the teams' names at the time. */
  year?: number;
  selected: NationId | null;
  /** Should be stable (a state setter or a useCallback) so the tiles can skip re-rendering. */
  onSelect: (id: NationId) => void;
  autoFocus?: boolean;
}

/**
 * sections: [{ title, ids, tag? }] – rendered in order, filtered by the search box.
 * `onSelect` should be stable (a state setter or a useCallback) so the tiles can skip re-rendering.
 */
export function NationPicker({ sections, year, selected, onSelect, autoFocus = false }: NationPickerProps) {
  const [query, setQuery] = useState('');
  const deferred = useDeferredValue(query);
  const searchId = useId();
  const q = fold(deferred.trim());
  const visible = useMemo(
    () =>
      sections
        .map((s) => ({
          ...s,
          ids: q
            ? s.ids.filter((id) => {
                const n = NATION_BY_ID.get(id)!;
                return fold(nameIn(n, year)).includes(q) || fold(n.name).includes(q) || n.id.toLowerCase().includes(q);
              })
            : s.ids,
        }))
        .filter((s) => s.ids.length),
    [sections, q, year],
  );
  const total = visible.reduce((a, s) => a + s.ids.length, 0);

  return (
    <div className="picker">
      <label className="search" htmlFor={searchId}>
        <span className="search__label">Search nations</span>
        <input
          id={searchId}
          className="search__input"
          type="search"
          value={query}
          placeholder="Type a name, e.g. Wales"
          autoComplete="off"
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus={autoFocus}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <p className="picker__count" aria-live="polite">
        {total} {total === 1 ? 'nation' : 'nations'}
      </p>
      {visible.map((s) => (
        <section key={s.title} className="picker__section" aria-label={s.title}>
          <h3 className="section-title">{s.title}</h3>
          <div className={`nation-grid${query !== deferred ? ' is-stale' : ''}`}>
            {s.ids.map((id) => (
              <NationTile key={id} id={id} year={year} selected={selected === id} onSelect={onSelect} tag={s.tag?.(id)} />
            ))}
          </div>
        </section>
      ))}
      {!total && <p className="empty">No nation matches “{query}”.</p>}
    </div>
  );
}
