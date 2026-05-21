export function exportReportPrompt({
  filename,
  periodLabel,
  report,
  reportTitle,
  scopeLabel,
  tickets = [],
}) {
  const statusSummary = report.statusSummary || countBy(tickets, "status").map(toNameValue);
  const prioritySummary = report.prioritySummary || countBy(tickets, "priority").map(toNameValue);
  const topCategories = report.topCategories || countBy(tickets, "category").slice(0, 10).map(toNameValue);
  const prompt = buildExecutivePrompt({
    periodLabel,
    prioritySummary,
    report,
    reportTitle,
    scopeLabel,
    statusSummary,
    topCategories,
  });

  downloadTextFile(ensureExtension(filename, "txt"), prompt);
}

export function getHotelScopeLabel(selectedHotelId, hotels = []) {
  if (!selectedHotelId || selectedHotelId === "all") return "All accessible hotels";
  const hotel = hotels.find((item) => String(item._id || item.id) === String(selectedHotelId));
  return hotel ? [hotel.code, hotel.name].filter(Boolean).join(" / ") : "Selected hotel";
}

export function makeReportFilename(prefix, periodLabel, scopeLabel) {
  const safePeriod = sanitizeFilenamePart(periodLabel);
  const safeScope = sanitizeFilenamePart(scopeLabel);
  return `${prefix}-${safePeriod}-${safeScope}`;
}

function buildExecutivePrompt({
  periodLabel,
  prioritySummary,
  report,
  reportTitle,
  scopeLabel,
  statusSummary,
  topCategories,
}) {
  return `คุณคือที่ปรึกษา IT Operations สำหรับกลุ่มโรงแรม ช่วยเขียนรายงานผู้บริหารจากข้อมูล report และ ticket ที่แนบหรือ paste ไปพร้อม prompt นี้เท่านั้น ห้ามแต่งข้อมูลเพิ่มเอง และถ้าข้อมูลไม่พอให้ระบุว่า "ข้อมูลไม่เพียงพอ"

บริบทของรายงาน
- ชื่อรายงาน: ${reportTitle}
- ช่วงเวลา: ${periodLabel}
- ขอบเขตโรงแรม: ${scopeLabel}
- จำนวน Ticket ทั้งหมด: ${report.total ?? 0}
- Closed Rate: ${report.completionRate ?? 0}%
- SLA Success Rate: ${report.successRate ?? 0}% (${report.successDetail || "-"})
- Waiting Confirmation: ${report.resolved ?? 0}
- Closed Tickets: ${report.closed ?? 0}
- Active Tickets: ${report.active ?? 0}
- Overdue Tickets: ${report.overdue ?? 0}
- Avg. Resolve Hours: ${report.avgResolutionHours ?? 0}
- Avg. Satisfaction: ${report.avgSatisfactionLabel || "-"} จาก ${report.satisfactionCount ?? 0} ratings

ภาพรวมข้อมูลใน report
- Status Summary: ${formatNameValueList(statusSummary)}
- Priority Summary: ${formatNameValueList(prioritySummary)}
- Top Categories: ${formatNameValueList(topCategories)}

โปรดสร้างรายงานภาษาไทยสำหรับผู้บริหาร โดยจัดหัวข้อดังนี้
1. Executive Summary แบบกระชับ 3-5 bullet
2. KPI Highlights: Closed Rate, Waiting Confirmation, SLA/on-time context, Satisfaction Score
3. Risks & Attention Points: ประเด็นที่ควรระวังจาก overdue, priority, category, hotel/department
4. Root-cause Themes: วิเคราะห์แนวโน้มจาก category/comment/title ในข้อมูล ticket
5. Hotel / Department Focus: ชี้จุดที่ควรโฟกัสตามข้อมูลจริง
6. Recommendations: ข้อเสนอเชิงปฏิบัติสำหรับ IT/helpdesk
7. Next Actions: งานต่อไปแบบ 30/60/90 วัน

ข้อกำชับ
- อ้างอิงเฉพาะตัวเลขและรายการในข้อมูล report/ticket ที่ให้มา
- อย่าสรุปเกินข้อมูลจริง
- ถ้าต้องตั้งสมมติฐานให้แยกหัวข้อ "Assumptions" ชัดเจน
- ใช้น้ำเสียงมืออาชีพ เหมาะสำหรับส่งต่อผู้บริหารโรงแรม`;
}

function countBy(items, key) {
  return Object.entries(
    items.reduce((acc, item) => {
      const name = item[key] || "Unspecified";
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);
}

function toNameValue([name, value]) {
  return { name: capitalize(String(name).replace("_", " ")), value };
}

function formatNameValueList(items) {
  return items.length
    ? items.map((item) => `${item.name}: ${item.value}`).join(", ")
    : "-";
}

function capitalize(value) {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

function sanitizeFilenamePart(value) {
  return String(value || "report")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "report";
}

function ensureExtension(filename, extension) {
  return filename.endsWith(`.${extension}`) ? filename : `${filename}.${extension}`;
}

function downloadTextFile(filename, text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
