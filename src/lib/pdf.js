import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { DOMAINS, DMAP } from "../data/domains.js";
import { PASS_MARK, MOCK_SECONDS, clockStr } from "./scoring.js";

const NAVY = [5, 47, 99];
const GOLD = [255, 211, 92];
const MINT = [59, 178, 115];
const ROSE = [255, 90, 110];
const INK = [20, 20, 20];
const MUTED = [110, 110, 110];

/* Generates a downloadable PDF report for a completed mock exam: score, pass/fail,
   per-domain breakdown, and every missed question with the chosen answer, correct
   answer, and explanation. Client-side only — no server round-trip. */
export function generateMockResultPdf(mock) {
  const { correct, by } = mock.result;
  const total = mock.qs.length;
  const pct = Math.round((correct / total) * 100);
  const passed = pct >= PASS_MARK * 100;
  const missed = mock.qs.filter(q => mock.ans[q.id] !== q.c);
  const used = MOCK_SECONDS - mock.left;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // header band
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageWidth, 34, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("ForceCamp — Mock Exam Result", 14, 15);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(new Date(mock.result.at).toLocaleString(), 14, 24);

  // score
  doc.setTextColor(...GOLD);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(36);
  doc.text(`${pct}%`, 14, 55);

  doc.setFontSize(13);
  doc.setTextColor(...(passed ? MINT : ROSE));
  doc.text(passed ? "PASS — above the 65% mark" : "FAIL — below the 65% mark", 55, 55);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...INK);
  doc.text(`${correct} of ${total} correct in ${clockStr(used)}. The real exam needs 39 of 60.`, 14, 65);

  // per-domain breakdown
  const domainRows = DOMAINS.map(d => {
    const b = by[d.k] || { r: 0, n: 0 };
    const dp = b.n ? Math.round((b.r / b.n) * 100) : 0;
    return [d.name, `${b.r}/${b.n}`, `${dp}%`, `${d.weight}%`];
  });

  autoTable(doc, {
    startY: 74,
    head: [["Domain", "Correct", "Accuracy", "Exam weight"]],
    body: domainRows,
    headStyles: { fillColor: NAVY, textColor: 255 },
    styles: { fontSize: 9, cellPadding: 3 },
    theme: "striped",
  });

  // missed-question review
  const missedRows = missed.map((q, i) => [
    String(i + 1),
    DMAP[q.d].short,
    q.q,
    mock.ans[q.id] !== undefined ? q.a[mock.ans[q.id]] : "(left blank)",
    q.a[q.c],
    q.e,
  ]);

  const afterTableY = doc.lastAutoTable.finalY + 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...INK);
  doc.text(`Missed questions (${missed.length})`, 14, afterTableY);

  if (missedRows.length) {
    autoTable(doc, {
      startY: afterTableY + 4,
      head: [["#", "Domain", "Question", "Your answer", "Correct answer", "Why"]],
      body: missedRows,
      headStyles: { fillColor: NAVY, textColor: 255 },
      styles: { fontSize: 8, cellPadding: 3, overflow: "linebreak" },
      columnStyles: {
        0: { cellWidth: 7 },
        1: { cellWidth: 18 },
        2: { cellWidth: 42 },
        3: { cellWidth: 28, textColor: ROSE },
        4: { cellWidth: 28, textColor: MINT },
        5: { cellWidth: "auto" },
      },
      theme: "grid",
    });
  } else {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    doc.text("Clean sweep — nothing missed.", 14, afterTableY + 8);
  }

  doc.save(`forcecamp-mock-${new Date(mock.result.at).toISOString().slice(0, 10)}.pdf`);
}
