import type { Group, NationId, TableRow } from '@/types';
import { Flag } from '@/components/Flag';
import { getNation, nameIn } from '@/data/nations';
import { signed } from '@/utils/format';
import type { RowState } from '../../bracketUtils';
import './GroupTable.css';

export interface GroupTableProps {
  group: Group;
  rows: TableRow[];
  userId: NationId;
  year: number;
  /** How each row is marked. */
  status: (row: TableRow) => RowState | null;
}

export function GroupTable({ group, rows, userId, year, status }: GroupTableProps) {
  return (
    <table className="gtable">
      <caption className="sr-only">Group {group.name} table</caption>
      <thead>
        <tr>
          <th scope="col" className="gtable__pos">
            <span className="sr-only">Position</span>
          </th>
          <th scope="col" className="gtable__team">
            Team
          </th>
          <th scope="col">
            <abbr title="Played">P</abbr>
          </th>
          <th scope="col">
            <abbr title="Won">W</abbr>
          </th>
          <th scope="col">
            <abbr title="Lost">L</abbr>
          </th>
          <th scope="col">
            <abbr title="Penalty difference">+/−</abbr>
          </th>
          <th scope="col">
            <abbr title="Points">Pts</abbr>
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const state = status(r);
          return (
            <tr key={r.id} className={`${state ? `is-${state}` : ''}${r.id === userId ? ' is-me' : ''}`}>
              <td className="gtable__pos">
                {r.pos}
                {state && (
                  <span className="sr-only">
                    {{ in: ', qualifying', maybe: ', play-off or best-placed spot', down: ', relegation zone', out: ', eliminated' }[state]}
                  </span>
                )}
              </td>
              <th scope="row" className="gtable__team">
                <span className="gtable__who">
                  <Flag id={r.id} size="xs" />
                  <span className="gtable__name">{nameIn(getNation(r.id), year)}</span>
                </span>
              </th>
              <td>{r.p}</td>
              <td>{r.w}</td>
              <td>{r.l}</td>
              <td>{signed(r.gd)}</td>
              <td className="gtable__pts">{r.pts}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
