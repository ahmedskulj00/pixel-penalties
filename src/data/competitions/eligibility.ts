import type { Competition, Edition, Eligibility, Nation, NationId } from '@/types';
import { NATIONS, existsIn, fifaMember, memberOf } from '../nations';

// ─── Who can enter ──────────────────────────────────────────────────────────

export const ARAB = 'ALG BHR COM DJI EGY IRQ JOR KUW LBN LBY MTN MAR OMA PLE QAT KSA SOM SDN SYR TUN UAE YEM';
export const GULF = 'BHR IRQ KUW OMA QAT KSA UAE YEM';
export const AFF = 'BRU CAM IDN LAO MAS MYA PHI SGP THA VIE TLS';
export const EAFF = 'JPN KOR CHN PRK TPE HKG MAC GUM MNG NMI';
export const SAFF_MEMBERS = 'IND PAK BAN SRI NEP MDV BHU AFG:2005-2014';
export const CAFA_MEMBERS = 'AFG IRN KGZ TJK TKM UZB';
export const COSAFA_MEMBERS = 'ANG BOT COM SWZ LES MAD MWI MRI MOZ NAM SEY RSA ZAM ZIM';
export const BALTIC_MEMBERS = 'EST LVA LTU';

/** 'IND AFG:2005-2014' → Map { IND → [-∞, ∞], AFG → [2005, 2014] } */
function memberSpans(spec: string): Map<NationId, [number, number]> {
  return new Map(
    spec.split(' ').map((entry): [NationId, [number, number]] => {
      const [id, range] = entry.split(':');
      const [from, to] = range ? range.split('-').map(Number) : [-Infinity, Infinity];
      return [id, [from, to]];
    }),
  );
}

type MemberTest = (n: Nation, year: number) => boolean;

const memberTests = new Map<Eligibility, MemberTest>();

/** (nation, year) → could it enter? One test per eligibility rule. */
function eligibilityTest(rule: Eligibility): MemberTest | null {
  if (rule === 'field') return null;
  if (rule === 'FIFA') return fifaMember;
  if (typeof rule === 'string') return (n, year) => memberOf(n, rule, year);
  let test = memberTests.get(rule);
  if (!test) {
    const spans = memberSpans(rule.members);
    test = (n, year) => {
      const span = spans.get(n.id);
      return !!span && year >= span[0] && year <= span[1] && existsIn(n, year) && !(n.ban != null && year >= n.ban);
    };
    memberTests.set(rule, test);
  }
  return test;
}

/** Nations that could historically take part in this edition: its listed teams plus every eligible member. */
export function eligibleIds(comp: Competition, edition: Edition): NationId[] {
  const listed = new Set([...(edition.field ?? []), ...(edition.byes ?? []), ...(edition.groups?.flat() ?? [])]);
  const test = eligibilityTest(comp.eligibility);
  if (!test) return NATIONS.filter((n) => listed.has(n.id) && existsIn(n, edition.year)).map((n) => n.id);
  return NATIONS.filter((n) => listed.has(n.id) || test(n, edition.year)).map((n) => n.id);
}
