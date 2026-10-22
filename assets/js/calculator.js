// Core comparison math. All functions are pure (no DOM) so they're easy to test by hand.

const VERDICT_THRESHOLD = 0.05; // within 5% either way counts as "about even"

// Default award taxes for a program/trip type, built only from what's in the
// JSON — no invented numbers, no currency conversion. Aeroplan's CAD partner
// fee is deliberately left out of the default (different currency, unconfirmed
// basis) and surfaced as a note instead.
export function computeDefaultTax(program, tripType, universalFee) {
  let base =
    tripType === "roundtrip" ? universalFee.roundTripCap : universalFee.amountPerOneWay;

  let note = null;
  const fees = program.awardFees;

  if (fees && typeof fees.partnerBookingFee === "number" && fees.partnerBookingFee > 0) {
    if (fees.partnerBookingFeeCurrency) {
      note = `This program may also charge a ${fees.partnerBookingFeeCurrency} ${fees.partnerBookingFee} partner booking fee (not included above — different currency, add manually if it applies).`;
    } else {
      const perDirection = fees.partnerBookingFee;
      base += tripType === "roundtrip" ? perDirection * 2 : perDirection;
    }
  }

  return { amount: round2(base), note };
}

// $ value of the points you'd earn back by paying cash instead of redeeming,
// valued at the program's own benchmark cents-per-point (what they'd likely
// be worth later). Returns null when earn-back data isn't available for this
// program/fare combination — callers must show that explicitly, not default to 0.
export function computeEarnBack(program, fareType, cashFare) {
  if (!program.earnBack || !fareType) return null;
  const perDollar = program.earnBack.fareTypes[fareType];
  if (typeof perDollar !== "number") return null;
  const pointsEarned = perDollar * cashFare;
  const dollarValue = (pointsEarned * program.centsPerPoint) / 100;
  return { pointsEarned: Math.round(pointsEarned), dollarValue: round2(dollarValue) };
}

export function computeResult({ program, cashFare, awardTaxes, awardPoints, earnBack }) {
  if (!cashFare || !awardPoints) return null;

  const netForPoints = Math.max(cashFare - awardTaxes, 0);
  const cppRedeemed = (netForPoints / awardPoints) * 100;

  const pointsOptionCost = awardTaxes + (awardPoints * program.centsPerPoint) / 100;
  const cashOptionCost = earnBack ? cashFare - earnBack.dollarValue : cashFare;

  const diff = (cashOptionCost - pointsOptionCost) / cashOptionCost;

  let verdict;
  if (diff > VERDICT_THRESHOLD) verdict = "points";
  else if (diff < -VERDICT_THRESHOLD) verdict = "cash";
  else verdict = "even";

  return {
    cppRedeemed,
    benchmark: program.centsPerPoint,
    pointsOptionCost: round2(pointsOptionCost),
    cashOptionCost: round2(cashOptionCost),
    verdict,
    diffPercent: Math.round(diff * 100),
  };
}

export function breakEvenPoints(netFare, centsPerPoint) {
  if (netFare <= 0) return null;
  return Math.round((netFare * 100) / centsPerPoint);
}

function round2(n) {
  return Math.round(n * 100) / 100;
}
