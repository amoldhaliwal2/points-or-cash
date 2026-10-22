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

export function renderOutput({ dom, result, earnBack, program, passengers, awardTaxes, awardPoints, cashFare }) {
  if (!result) {
    dom.cppOut.innerHTML = '–<small>¢ / point</small>';
    dom.verdict.className = "verdict ok";
    dom.verdict.textContent = "Enter a fare and points";
    dom.detail.textContent = "";
    dom.earnback.textContent = "";
    dom.totals.textContent = "";
    return;
  }

  dom.cppOut.innerHTML = `${result.cppRedeemed.toFixed(2)}<small>¢ / point</small>`;

  const verdictText = {
    points: "Use points",
    even: "About even",
    cash: "Pay cash",
  }[result.verdict];
  dom.verdict.className = `verdict ${result.verdict === "points" ? "good" : result.verdict === "cash" ? "bad" : "ok"}`;
  dom.verdict.textContent = verdictText;

  const cmp = result.cppRedeemed >= result.benchmark ? "above" : "below";
  dom.detail.textContent = `You'd get ${result.cppRedeemed.toFixed(2)}¢/point here, ${cmp} this program's typical ${result.benchmark.toFixed(2)}¢. Counting taxes and (where available) the points you'd earn back paying cash, redeeming points costs about ${fmtMoney(result.pointsOptionCost)} in value vs. ${fmtMoney(result.cashOptionCost)} for cash, per passenger.`;

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
