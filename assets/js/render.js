// DOM building / rendering. No calculation logic lives here.

const fmtMoney = (n) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtInt = (n) => Math.round(n).toLocaleString();
const mult = (centsPerPoint) => Math.round(100 / centsPerPoint);

const VERIFICATION_LABEL = {
  primary: "Primary source",
  secondary: "Secondary source",
  general: "General knowledge",
  unverified: "Unverified — needs a check",
};

export function badge(verification, sourceUrl, extraLabel) {
  if (!verification) return "";
  const label = VERIFICATION_LABEL[verification] ?? verification;
  const title = extraLabel ? `${extraLabel} — ${label}` : label;
  const cls = VERIFICATION_LABEL[verification] ? verification : "unverified";
  const inner = `<span class="tag ${cls}" title="${title}">${verification}</span>`;
  return sourceUrl
    ? `<a href="${sourceUrl}" target="_blank" rel="noopener" class="badge-link">${inner}</a>`
    : inner;
}

export function populateProgramSelect(select, programs) {
  const us = programs.filter((p) => p.region === "us");
  const intl = programs.filter((p) => p.region === "intl");

  const group = (label, list) => {
    const og = document.createElement("optgroup");
    og.label = label;
    list.forEach((p) => {
      const o = document.createElement("option");
      o.value = p.id;
      o.textContent = p.name;
      og.appendChild(o);
    });
    return og;
  };

  select.appendChild(group("U.S. airlines", us));
  select.appendChild(group("Partner & international programs", intl));
  select.value = "southwest";
}

export function populateFareTypeSelect(select, field, program) {
  if (!program.earnBack) {
    field.hidden = true;
    select.innerHTML = "";
    return;
  }
  field.hidden = false;
  select.innerHTML = "";
  Object.keys(program.earnBack.fareTypes).forEach((name) => {
    const o = document.createElement("option");
    o.value = name;
    o.textContent = name;
    select.appendChild(o);
  });
}

export function renderTaxInfo(el, program, taxResult) {
  const parts = [];
  if (program.awardFees) {
    parts.push(badge(program.awardFees.verification, program.awardFees.sourceUrl, "Award fees"));
    if (program.awardFees.notes) parts.push(program.awardFees.notes);
  } else {
    parts.push(badge("primary", "https://tsa.gov/for-industry/security-fees", "Base security fee"));
    parts.push("No partner-specific fee data for this program yet — using the base U.S. security fee only. Actual taxes/partner fees may be higher.");
  }
  if (taxResult.note) parts.push(taxResult.note);
  el.innerHTML = parts.join(" ");
}

const DECISION_HEADLINE = {
  points: "Use points",
  even: "Toss-up — either works",
  cash: "Pay cash",
};

export function renderOutput({ dom, result, earnBack, program, passengers, awardTaxes, awardPoints, cashFare }) {
  if (!result) {
    dom.cppOut.innerHTML = '–<small>¢ / point</small>';
    dom.decision.className = "decision";
    dom.decisionHeadline.textContent = "Enter a fare and points";
    dom.decisionDetail.textContent = "";
    dom.decisionThreshold.textContent = "";
    dom.earnback.textContent = "";
    dom.totals.textContent = "";
    return;
  }

  dom.cppOut.innerHTML = `${result.cppRedeemed.toFixed(2)}<small>¢ / point</small>`;

  dom.decision.className = `decision ${result.verdict}`;
  dom.decisionHeadline.textContent = DECISION_HEADLINE[result.verdict];

  if (result.verdict === "even") {
    dom.decisionDetail.textContent = `Points and cash cost about the same here — within ${fmtMoney(result.costDiff)} of each other per passenger (${fmtMoney(result.pointsOptionCost)} points vs. ${fmtMoney(result.cashOptionCost)} cash). Pick whichever currency you'd rather hold onto.`;
  } else {
    const winner = result.verdict === "points" ? "Points save" : "Cash saves";
    dom.decisionDetail.textContent = `${winner} about ${fmtMoney(result.costDiff)} per passenger (${fmtMoney(result.pointsOptionCost)} points vs. ${fmtMoney(result.cashOptionCost)} cash).`;
  }

  dom.decisionThreshold.textContent = `At this cash fare and tax, points clearly win below ~${fmtInt(result.pointsLowThreshold)} points, and cash clearly wins above ~${fmtInt(result.pointsHighThreshold)} points. This award is priced at ${fmtInt(awardPoints)} points.`;

  if (earnBack) {
    dom.earnback.textContent = `Paying cash would also earn about ${fmtInt(earnBack.pointsEarned)} points back (≈${fmtMoney(earnBack.dollarValue)}), already factored in above.`;
  } else {
    dom.earnback.textContent = "Earn-back on the cash ticket isn't available for this program/fare — not counted above.";
  }

  if (passengers > 1) {
    dom.totals.textContent = `For ${passengers} passengers: ${fmtMoney(cashFare * passengers)} cash fare total, or ${fmtInt(awardPoints * passengers)} points + ${fmtMoney(awardTaxes * passengers)} taxes total.`;
  } else {
    dom.totals.textContent = "";
  }
}

function tableRow(program, selectedId, netForBreakEven) {
  const tag =
    program.tiedToCashFare
      ? '<span class="tag fixed">Fixed</span>'
      : '<span class="tag vary">Variable</span>';
  const be = netForBreakEven > 0 ? fmtInt((netForBreakEven * 100) / program.centsPerPoint) : "–";
  const selected = program.id === selectedId ? "sel" : "";
  return `<tr class="${selected}">
    <td class="prog">${program.name}${program.valuationNotes ? `<span>${program.valuationNotes}</span>` : ""}</td>
    <td class="num">${program.centsPerPoint.toFixed(2)}¢</td>
    <td class="mult">×${mult(program.centsPerPoint)}</td>
    <td class="num">${be}</td>
    <td>${tag}</td>
  </tr>`;
}

export function renderTables({ usBody, intlBody, programs, selectedId, cashFare, awardTaxes }) {
  const net = Math.max((cashFare || 0) - (awardTaxes || 0), 0);
  const us = programs.filter((p) => p.region === "us");
  const intl = programs.filter((p) => p.region === "intl");
  usBody.innerHTML = us.map((p) => tableRow(p, selectedId, net)).join("");
  intlBody.innerHTML = intl.map((p) => tableRow(p, selectedId, net)).join("");
  document.querySelectorAll(".cashEcho").forEach((el) => (el.textContent = fmtInt(cashFare || 0)));
}
