import { loadData } from "./data.js";
import { computeDefaultTax, computeEarnBack, computeResult } from "./calculator.js";
import { populateProgramSelect, populateFareTypeSelect, renderTaxInfo, renderOutput, renderTables, badge } from "./render.js";

const $ = (id) => document.getElementById(id);
const dom = {
  prog: $("prog"),
  tripType: $("tripType"),
  passengers: $("passengers"),
  cash: $("cash"),
  pts: $("pts"),
  tax: $("tax"),
  taxInfo: $("taxInfo"),
  taxEditToggle: $("taxEditToggle"),
  fareTypeField: $("fareTypeField"),
  fareType: $("fareType"),
  cppOut: $("cppOut"),
  decision: $("decision"),
  decisionHeadline: $("decisionHeadline"),
  decisionDetail: $("decisionDetail"),
  decisionThreshold: $("decisionThreshold"),
  earnback: $("earnback"),
  totals: $("totals"),
  usBody: $("us"),
  intlBody: $("intl"),
  asOfLine: $("asOfLine"),
  valuationsSourceNote: $("valuationsSourceNote"),
};

let data;
let taxUnlocked = false; // true once the user chooses to override our estimate

function currentProgram() {
  return data.programsById.get(dom.prog.value);
}

function setTaxLocked(locked) {
  taxUnlocked = !locked;
  dom.tax.readOnly = locked;
  dom.tax.classList.toggle("locked", locked);
  dom.taxEditToggle.textContent = locked
    ? "I was quoted a different fee — edit it"
    : "Use our estimated fee instead";
}

function refreshTaxDefault() {
  const program = currentProgram();
  const result = computeDefaultTax(program, dom.tripType.value, data.universalFee);
  renderTaxInfo(dom.taxInfo, program, result);
  if (!taxUnlocked) {
    dom.tax.value = result.amount;
  }
}

function update() {
  const program = currentProgram();
  populateFareTypeSelect(dom.fareType, dom.fareTypeField, program);

  const cashFare = parseFloat(dom.cash.value) || 0;
  const awardTaxes = parseFloat(dom.tax.value) || 0;
  const awardPoints = parseFloat(dom.pts.value) || 0;
  const passengers = Math.max(parseInt(dom.passengers.value, 10) || 1, 1);
  const fareType = dom.fareTypeField.hidden ? null : dom.fareType.value;

  const earnBack = computeEarnBack(program, fareType, cashFare);
  const result = computeResult({ program, cashFare, awardTaxes, awardPoints, earnBack });

  renderOutput({ dom, result, earnBack, program, passengers, awardTaxes, awardPoints, cashFare });
  renderTables({
    usBody: dom.usBody,
    intlBody: dom.intlBody,
    programs: data.programs,
    selectedId: program.id,
    cashFare,
    awardTaxes,
  });
}

function onProgramOrTripChange() {
  setTaxLocked(true);
  refreshTaxDefault();
  update();
}

async function init() {
  data = await loadData();

  populateProgramSelect(dom.prog, data.programs);
  dom.asOfLine.textContent = `Values as of ${data.valuationsAsOf} (points values) / ${data.awardFeesAsOf} (fees). Third-party estimates, not airline-published figures — recheck before booking.`;
  dom.valuationsSourceNote.innerHTML = `Point values are ${data.valuationsSource.name}, ${data.valuationsAsOf} (multiplier = 100 ÷ ¢/point, rounded). <a href="${data.valuationsSource.url}" target="_blank" rel="noopener">Source</a>.`;

  setTaxLocked(true);
  refreshTaxDefault();
  update();

  dom.prog.addEventListener("change", onProgramOrTripChange);
  dom.tripType.addEventListener("change", onProgramOrTripChange);
  dom.tax.addEventListener("input", update);
  dom.taxEditToggle.addEventListener("click", () => {
    const wasLocked = dom.tax.readOnly;
    setTaxLocked(!wasLocked);
    if (wasLocked) {
      dom.tax.focus();
      dom.tax.select();
    } else {
      refreshTaxDefault();
    }
    update();
  });
  ["cash", "pts", "passengers", "fareType"].forEach((id) =>
    dom[id].addEventListener("input", update)
  );
}

init();
