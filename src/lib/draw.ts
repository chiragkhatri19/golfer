/**
 * Draw engine.
 * - winning_numbers: 5 unique ints in 1..45
 * - random: pure random pick
 * - algorithmic: weighted toward most-frequent scores (top half) plus a least-frequent tail
 *   so popular numbers are favored without locking out variety.
 *
 * Prize logic:
 *   pool: monthlyRevenue * 0.5  (50% of revenue funds the pool)
 *   tiers: 5-match 40% (rolls over), 4-match 35% split, 3-match 25% split.
 */
import { supabase } from "@/integrations/supabase/client";
import { PLAN_PRICES } from "@/lib/roles";

export const POOL_PCT = 0.5;
export const TIER_SHARE = { 5: 0.4, 4: 0.35, 3: 0.25 } as const;

export const drawRandom = (): number[] => {
  const set = new Set<number>();
  while (set.size < 5) set.add(1 + Math.floor(Math.random() * 45));
  return [...set].sort((a, b) => a - b);
};

export const drawAlgorithmic = (allScores: number[]): number[] => {
  if (allScores.length < 5) return drawRandom();
  const freq = new Map<number, number>();
  for (const s of allScores) freq.set(s, (freq.get(s) || 0) + 1);
  // Build weight: frequency + 0.5 baseline so untouched numbers can still appear.
  const weights: { n: number; w: number }[] = [];
  for (let n = 1; n <= 45; n++) weights.push({ n, w: (freq.get(n) || 0) + 0.5 });
  const picked = new Set<number>();
  while (picked.size < 5) {
    const total = weights.filter(x => !picked.has(x.n)).reduce((s, x) => s + x.w, 0);
    let r = Math.random() * total;
    for (const x of weights) {
      if (picked.has(x.n)) continue;
      r -= x.w;
      if (r <= 0) { picked.add(x.n); break; }
    }
  }
  return [...picked].sort((a, b) => a - b);
};

export const matchCount = (entry: number[], winning: number[]): number =>
  entry.filter(n => winning.includes(n)).length;

export type SimResult = {
  winning: number[];
  pool: number;
  rolloverIn: number;
  entries: { user_id: string; numbers: number[]; matched: number[]; tier: number | null }[];
  tiers: Record<3 | 4 | 5, { winners: string[]; pot: number; perWinner: number }>;
  jackpotRolloverOut: number;
};

export const computePool = async (rolloverIn = 0): Promise<number> => {
  const { data } = await supabase.from("subscriptions").select("plan").eq("status", "active");
  const revenue = (data || []).reduce((s, x: any) => s + (PLAN_PRICES[x.plan] || 0), 0);
  return revenue * POOL_PCT + rolloverIn;
};

export const fetchEntriesPool = async () => {
  // Build entries from each member's last 5 scores. Members with <5 scores skipped.
  const { data: scores } = await supabase.from("scores").select("user_id,score,date").order("date", { ascending: false });
  const byUser = new Map<string, number[]>();
  for (const s of (scores || [])) {
    const arr = byUser.get(s.user_id) || [];
    if (arr.length < 5) arr.push(s.score);
    byUser.set(s.user_id, arr);
  }
  const entries: { user_id: string; numbers: number[] }[] = [];
  byUser.forEach((nums, user_id) => { if (nums.length === 5) entries.push({ user_id, numbers: nums }); });
  const allScores = (scores || []).map(s => s.score);
  return { entries, allScores };
};

export const simulate = async (logic: "random" | "algorithmic", rolloverIn = 0): Promise<SimResult> => {
  const { entries, allScores } = await fetchEntriesPool();
  const winning = logic === "random" ? drawRandom() : drawAlgorithmic(allScores);
  const pool = await computePool(rolloverIn);

  const enriched = entries.map(e => {
    const matched = e.numbers.filter(n => winning.includes(n));
    const m = matched.length;
    const tier = m >= 3 ? m : null;
    return { ...e, matched, tier };
  });

  const tiers = { 3: { winners: [] as string[], pot: 0, perWinner: 0 }, 4: { winners: [] as string[], pot: 0, perWinner: 0 }, 5: { winners: [] as string[], pot: 0, perWinner: 0 } };
  for (const e of enriched) if (e.tier) tiers[e.tier as 3 | 4 | 5].winners.push(e.user_id);
  for (const t of [3, 4, 5] as const) {
    tiers[t].pot = pool * TIER_SHARE[t];
    tiers[t].perWinner = tiers[t].winners.length ? tiers[t].pot / tiers[t].winners.length : 0;
  }
  const jackpotRolloverOut = tiers[5].winners.length === 0 ? tiers[5].pot : 0;
  return { winning, pool, rolloverIn, entries: enriched, tiers, jackpotRolloverOut };
};
