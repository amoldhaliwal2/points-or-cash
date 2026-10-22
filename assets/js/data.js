// Fetches the JSON data files and joins them by program id.
// The JSON files are the source of truth — this module only reads and joins, never invents values.

const DATA_FILES = {
  valuations: "data/valuations.json",
  awardFees: "data/award-fees.json",
  cashEarning: "data/cash-earning.json",
};

async function fetchJson(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.json();
}

export async function loadData() {
  const [valuations, awardFees, cashEarning] = await Promise.all([
    fetchJson(DATA_FILES.valuations),
    fetchJson(DATA_FILES.awardFees),
    fetchJson(DATA_FILES.cashEarning),
  ]);

  const awardFeesById = new Map(awardFees.programs.map((p) => [p.id, p]));
  const cashEarningById = new Map(cashEarning.programs.map((p) => [p.id, p]));

  // Only expose fare types whose earn rate is a plain per-dollar number.
  // Distance-based programs (Alaska) and elite/cobranded variants are out of
  // scope for v1 — surfaced as "not available" rather than guessed.
  const earnBackByProgram = new Map();
  for (const p of cashEarning.programs) {
    if (p.basis !== "per dollar") continue;
    const fareTypes = Object.entries(p.fares).filter(
      ([, v]) => typeof v === "number"
    );
    if (fareTypes.length === 0) continue;
    earnBackByProgram.set(p.id, {
      fareTypes: Object.fromEntries(fareTypes),
      notes: p.notes,
      sourceUrl: p.sourceUrl,
      verification: p.verification,
    });
  }

  const programs = valuations.programs.map((v) => ({
    id: v.id,
    name: v.name,
    region: v.region,
    centsPerPoint: v.centsPerPoint,
    tiedToCashFare: v.tiedToCashFare,
    valuationNotes: v.notes,
    awardFees: awardFeesById.get(v.id) ?? null,
    earnBack: earnBackByProgram.get(v.id) ?? null,
  }));

  return {
    programs,
    programsById: new Map(programs.map((p) => [p.id, p])),
    universalFee: awardFees.universal.september11SecurityFee,
    valuationsAsOf: valuations.asOf,
    valuationsSource: valuations.source,
    awardFeesAsOf: awardFees.asOf,
    cashEarningAsOf: cashEarning.asOf,
  };
}
