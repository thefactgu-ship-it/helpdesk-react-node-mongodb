import * as XLSX from "xlsx";

export function exportReportExcel({
  filename,
  periodLabel,
  report,
  reportTitle,
  scopeLabel,
  tickets = [],
}) {
  const workbook = XLSX.utils.book_new();
  const generatedAt = new Date().toLocaleString();
  const statusSummary = report.statusSummary || countBy(tickets, "status").map(toNameValue);
  const prioritySummary = report.prioritySummary || countBy(tickets, "priority").map(toNameValue);
  const topCategories = report.topCategories || countBy(tickets, "category").slice(0, 10).map(toNameValue);

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([
      ["Metric", "Value"],
      ["Report", reportTitle],
      ["Period", periodLabel],
      ["Hotel Scope", scopeLabel],
      ["Generated At", generatedAt],
      ["Total Tickets", report.total ?? tickets.length],
      ["Completion Rate", `${report.completionRate ?? 0}%`],
      ["Completed Tickets", report.completedCount ?? report.resolved ?? 0],
      ["Success Rate", `${report.successRate ?? 0}%`],
      ["Success Detail", report.successDetail || "-"],
      ["Open Tickets", report.open ?? 0],
      ["Active Tickets", report.active ?? 0],
      ["Overdue Tickets", report.overdue ?? 0],
      ["Closed Tickets", report.closed ?? 0],
      ["Avg. Resolve Hours", report.avgResolutionHours ?? 0],
      ["Avg. Satisfaction", report.avgSatisfactionLabel || "-"],
      ["Satisfaction Count", report.satisfactionCount ?? 0],
    ]),
    "Summary",
  );

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(statusSummary.map((item) => ({ Status: item.name, Tickets: item.value }))),
    "Status",
  );

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(prioritySummary.map((item) => ({ Priority: item.name, Tickets: item.value }))),
    "Priority",
  );

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(topCategories.map((item) => ({ Category: item.name, Tickets: item.value }))),
    "Top Categories",
  );

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(tickets.map(toRawTicketRow)),
    "Raw Tickets",
  );

  XLSX.writeFile(workbook, ensureExtension(filename, "xlsx"));
}

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
  return `คุณคือที่ปรึกษา IT Operations สำหรับกลุ่มโรงแรม ช่วยเขียนรายงานผู้บริหารจากไฟล์ Excel/CSV ที่แนบเท่านั้น ห้ามแต่งข้อมูลเพิ่มเอง และถ้าข้อมูลไม่พอให้ระบุว่า "ข้อมูลไม่เพียงพอ"

บริบทของรายงาน
- ชื่อรายงาน: ${reportTitle}
- ช่วงเวลา: ${periodLabel}
- ขอบเขตโรงแรม: ${scopeLabel}
- จำนวน Ticket ทั้งหมด: ${report.total ?? 0}
- Completion Rate: ${report.completionRate ?? 0}%
- Success Rate: ${report.successRate ?? 0}% (${report.successDetail || "-"})
- Open Tickets: ${report.open ?? 0}
- Active Tickets: ${report.active ?? 0}
- Overdue Tickets: ${report.overdue ?? 0}
- Avg. Resolve Hours: ${report.avgResolutionHours ?? 0}
- Avg. Satisfaction: ${report.avgSatisfactionLabel || "-"} จาก ${report.satisfactionCount ?? 0} ratings

ภาพรวมข้อมูลในไฟล์
- Status Summary: ${formatNameValueList(statusSummary)}
- Priority Summary: ${formatNameValueList(prioritySummary)}
- Top Categories: ${formatNameValueList(topCategories)}

โปรดสร้างรายงานภาษาไทยสำหรับผู้บริหาร โดยจัดหัวข้อดังนี้
1. Executive Summary แบบกระชับ 3-5 bullet
2. KPI Highlights: Completion Rate, Success Rate, SLA/on-time context, Satisfaction Score
3. Risks & Attention Points: ประเด็นที่ควรระวังจาก overdue, priority, category, hotel/department
4. Root-cause Themes: วิเคราะห์แนวโน้มจาก category/comment/title ใน Raw Tickets
5. Hotel / Department Focus: ชี้จุดที่ควรโฟกัสตามข้อมูลจริง
6. Recommendations: ข้อเสนอเชิงปฏิบัติสำหรับ IT/helpdesk
7. Next Actions: งานต่อไปแบบ 30/60/90 วัน

ข้อกำชับ
- อ้างอิงเฉพาะตัวเลขและรายการในไฟล์ที่แนบ
- อย่าสรุปเกินข้อมูลจริง
- ถ้าต้องตั้งสมมติฐานให้แยกหัวข้อ "Assumptions" ชัดเจน
- ใช้น้ำเสียงมืออาชีพ เหมาะสำหรับส่งต่อผู้บริหารโรงแรม`;
}

function toRawTicketRow(ticket) {
  return {
    Ticket: ticket.ticketNumber || ticket._id || ticket.id || "",
    Title: ticket.title || "",
    Hotel: getEntityLabel(ticket.hotelId) || ticket.hotelCode || "",
    Department: getEntityLabel(ticket.departmentId) || ticket.departmentName || ticket.department || "",
    Category: ticket.category || "",
    Priority: ticket.priority || "",
    Status: ticket.status || "",
    Requester: getEntityLabel(ticket.requesterUserId) || ticket.requesterName || ticket.createdByName || "",
    AssignedTo: getEntityLabel(ticket.assignedTo) || "",
    CreatedAt: formatDateTime(ticket.createdAt),
    DueDate: formatDateTime(ticket.dueDate),
    ResolvedAt: formatDateTime(ticket.resolvedAt),
    SatisfactionScore: ticket.satisfactionScore || "",
    SatisfactionComment: ticket.satisfactionComment || "",
  };
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

function getEntityLabel(entity) {
  if (!entity || typeof entity === "string") return "";
  return [entity.code, entity.name, entity.email].filter(Boolean).join(" / ");
}

function formatDateTime(value) {
  return value ? new Date(value).toLocaleString() : "";
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
