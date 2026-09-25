import { memo, useDeferredValue, useId, useMemo, useState } from 'react';
import { NATION_BY_ID, nameIn, activeLabel } from '../data/nations.js';
import { Flag, Stars } from './pixel.jsx';
import { play } from '../audio/sfx.js';

const fold = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

function NationTileView({ id, year, selected, onSelect, tag }) {
  const n = NATION_BY_ID.get(id);
  const name = nameIn(n, year);
  return (
    <button
      type="button"
      className={`nation${selected ? ' is-selected' : ''}`}
      aria-pressed={selected}
      onClick={() => {
        play('blip');
        onSelect(id);
      }}
    >
      <Flag id={id} size="lg" />
      <span className="nation__text">
        <span className="nation__name">{name}</span>
        <span className="nation__meta">{tag ?? activeLabel(n)}</span>
        <Stars rating={n.rating} label={false} />
      </span>
    </button>
  );
}

// Memoised: selecting a nation or typing a search re-renders only the tiles that change.
const NationTile = memo(NationTileView);

/**
 * sections: [{ title, ids, tag? }] – rendered in order, filtered by the search box.
 * `onSelect` should be stable (a state setter or a useCallback) so the tiles can skip re-rendering.
 */
export function NationPicker({ sections, year, selected, onSelect, autoFocus = false }) {
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
                const n = NATION_BY_ID.get(id);
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
