import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { API_BASE_URL } from "../services/api";
import ThemedSelect from "./ThemedSelect";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const API_ORIGIN = API_BASE_URL.replace(/\/api$/, "");

function TicketDetailModal({
  open,
  ticket,
  currentUser,
  onClose,
  onComment,
  onSatisfaction,
  onUploadAttachment,
  canUploadAttachment = false,
  canManageTickets = false,
  onUpdatePriority,
  t,
}) {
  if (!open || !ticket) return null;

  return (
    <TicketDetailModalContent
      key={ticket._id || ticket.id}
      ticket={ticket}
      currentUser={currentUser}
      onClose={onClose}
      onComment={onComment}
      onSatisfaction={onSatisfaction}
      onUploadAttachment={onUploadAttachment}
      canUploadAttachment={canUploadAttachment}
      canManageTickets={canManageTickets}
      onUpdatePriority={onUpdatePriority}
      t={t}
    />
  );
}

function TicketDetailModalContent({
  ticket,
  currentUser,
  onClose,
  onComment,
  onSatisfaction,
  onUploadAttachment,
  canUploadAttachment,
  canManageTickets,
  onUpdatePriority,
  t,
}) {
  const [comment, setComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [satisfactionScore, setSatisfactionScore] = useState(
    ticket.satisfactionScore ? String(ticket.satisfactionScore) : "",
  );
  const [satisfactionComment, setSatisfactionComment] = useState(
    ticket.satisfactionComment || "",
  );
  const [savingSatisfaction, setSavingSatisfaction] = useState(false);

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      setSubmittingComment(true);
      await onComment(ticket._id, comment.trim());
      setComment("");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!canUploadAttachment || !file) return;
    await onUploadAttachment(ticket._id, file);
    setFile(null);
    setFileError("");
    e.target.reset();
  };

  const handleSubmitSatisfaction = async (e) => {
    e.preventDefault();
    if (!onSatisfaction || !satisfactionScore) return;

    try {
      setSavingSatisfaction(true);
      const success = await onSatisfaction(ticket._id, {
        score: Number(satisfactionScore),
        comment: satisfactionComment.trim(),
      });

      if (success) setSatisfactionComment("");
    } finally {
      setSavingSatisfaction(false);
    }
  };

  const handleViewAttachment = async (attachment) => {
    const token = localStorage.getItem("token");
    const res = await fetch(getAttachmentUrl(ticket._id, attachment), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return;

    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
  };

  const handleDownloadAttachment = async (attachment) => {
    const token = localStorage.getItem("token");
    const res = await fetch(getAttachmentUrl(ticket._id, attachment), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return;

    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = attachment.originalName || attachment.filename || "attachment";
    link.click();
    URL.revokeObjectURL(blobUrl);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(null);
    setFileError("");
    if (!selectedFile) return;

    if (!ALLOWED_IMAGE_TYPES.includes(selectedFile.type)) {
      setFileError("Only JPG, PNG, GIF, or WEBP images are allowed.");
      e.target.value = "";
      return;
    }

    if (selectedFile.size > MAX_IMAGE_SIZE) {
      setFileError("Image must be 5 MB or smaller.");
      e.target.value = "";
      return;
    }

    setFile(selectedFile);
  };

  const isCompleted = ["resolved", "closed"].includes(ticket.status);
  const canSubmitSatisfaction = isCompleted && canCurrentUserSubmitSatisfaction(currentUser, ticket);
  const hasSatisfaction = Number(ticket.satisfactionScore) > 0;
  const showSatisfactionPanel = isCompleted && (hasSatisfaction || canSubmitSatisfaction);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-0 pt-10 backdrop-blur-sm sm:items-center sm:px-3 sm:py-4">
      <button
        type="button"
        className="absolute inset-0 h-full w-full"
        onClick={onClose}
        aria-label={t("detail.closeBackdrop")}
      />
      <div
        className="relative max-h-[90dvh] w-full overflow-y-auto rounded-t-2xl bg-white p-4 shadow-2xl dark:bg-slate-900 sm:max-w-[52rem] sm:rounded-2xl md:p-5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ticket-detail-title"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id="ticket-detail-title" className="text-xl font-bold text-slate-900 dark:text-white">
              {t("detail.title")}
            </h2>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              {ticket.ticketNumber} / {ticket.category} / {ticket.departmentName || ticket.department}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            aria-label={t("common.close")}
          >
            {t("common.close")}
          </button>
        </div>

        <div className={`grid gap-3 ${ticket.attachments?.length ? "lg:grid-cols-2" : ""}`}>
          <CompactPanel>
            <SectionLabel>{t("detail.titleLabel")}</SectionLabel>
            <p className="mt-1 text-base font-semibold text-slate-900 dark:text-white">
              {ticket.title}
            </p>
            {ticket.criticalRequested && (
              <span className="mt-3 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 ring-1 ring-amber-200 dark:bg-amber-500/20 dark:text-amber-100 dark:ring-amber-400/20">
                {t("detail.criticalReview")}
              </span>
            )}

            <div className="mt-3">
              <SectionLabel>{t("detail.description")}</SectionLabel>
              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {ticket.description || t("detail.noDescription")}
              </p>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <InfoItem
                label={t("detail.priority")}
                value={
                  canManageTickets && onUpdatePriority ? (
                    <ThemedSelect
                      compactOptions
                      size="sm"
                      value={ticket.priority}
                      onChange={(value) => onUpdatePriority(ticket._id, value)}
                      options={buildPriorityOptions(t)}
                    />
                  ) : (
                    getPriorityLabel(ticket.priority, t)
                  )
                }
              />
              <InfoItem label={t("detail.status")} value={getStatusLabel(ticket.status, t)} />
              <InfoItem label={t("detail.requester")} value={ticket.requester || t("common.unknown")} />
              <InfoItem label={t("detail.createdBy")} value={ticket.createdBy?.name || t("common.unknown")} />
              <InfoItem label={t("detail.assignedTo")} value={ticket.assignedTo?.name || t("common.unassigned")} />
              <InfoItem label={t("detail.slaHours")} value={ticket.slaHours} />
              <InfoItem
                label={t("detail.dueDate")}
                value={ticket.dueDate ? new Date(ticket.dueDate).toLocaleString() : t("common.notSet")}
              />
            </div>
          </CompactPanel>

          {ticket.attachments?.length ? (
            <CompactPanel>
              <SectionLabel>Updated By</SectionLabel>
              <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                {ticket.updatedBy?.name || ticket.createdBy?.name || t("common.unknown")}
              </p>

              <div className="mt-4">
                <SectionLabel>Archived Attachments</SectionLabel>
                <ul className="mt-2 max-h-40 space-y-2 overflow-y-auto">
                  {ticket.attachments.map((attachment) => (
                    <li
                      key={attachment._id}
                      className="rounded-xl bg-white p-3 shadow-sm dark:bg-slate-800"
                    >
                      <button
                        type="button"
                        className="text-left text-sm font-semibold text-blue-700 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-200"
                        onClick={() => handleViewAttachment(attachment)}
                      >
                        {attachment.originalName}
                      </button>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Uploaded by {attachment.uploadedBy?.name || t("common.unknown")}
                      </p>
                      <button
                        type="button"
                        className="mt-2 text-xs font-semibold text-slate-500 hover:text-blue-700 dark:text-slate-400 dark:hover:text-blue-200"
                        onClick={() => handleDownloadAttachment(attachment)}
                      >
                        Download
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </CompactPanel>
          ) : null}
        </div>

        {showSatisfactionPanel && (
          <div className="mt-3">
            <CompactPanel>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <SectionLabel>Satisfaction</SectionLabel>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {hasSatisfaction
                      ? `Rated ${ticket.satisfactionScore}/5 by ${ticket.satisfactionSubmittedBy?.name || "requester"}`
                      : "Please rate the completed support experience."}
                  </p>
                  {ticket.satisfactionSubmittedAt && (
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {new Date(ticket.satisfactionSubmittedAt).toLocaleString()}
                    </p>
                  )}
                </div>
                {hasSatisfaction && (
                  <div className="rounded-lg bg-white px-3 py-2 text-sm font-black text-blue-700 shadow-sm dark:bg-slate-800 dark:text-blue-200">
                    {ticket.satisfactionScore}/5
                  </div>
                )}
              </div>

              {hasSatisfaction && ticket.satisfactionComment && (
                <p className="mt-3 rounded-xl bg-white p-3 text-sm text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-200">
                  {ticket.satisfactionComment}
                </p>
              )}

              {canSubmitSatisfaction && (
                <form onSubmit={handleSubmitSatisfaction} className="mt-3 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        key={score}
                        type="button"
                        onClick={() => setSatisfactionScore(String(score))}
                        className={`grid h-10 w-10 place-items-center rounded-full border text-sm font-black transition ${
                          Number(satisfactionScore) === score
                            ? "border-blue-600 bg-blue-600 text-white"
                            : "border-slate-200 bg-white text-slate-700 hover:border-blue-400 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        }`}
                        aria-pressed={Number(satisfactionScore) === score}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows="2"
                    value={satisfactionComment}
                    maxLength={1000}
                    onChange={(e) => setSatisfactionComment(e.target.value)}
                    placeholder="Optional feedback"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <button
                    type="submit"
                    disabled={!satisfactionScore || savingSatisfaction}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
                  >
                    {savingSatisfaction ? t("common.saving") : hasSatisfaction ? "Update Rating" : "Submit Rating"}
                  </button>
                </form>
              )}
            </CompactPanel>
          </div>
        )}

        <div className={`mt-3 grid gap-3 ${canUploadAttachment ? "lg:grid-cols-2" : ""}`}>
          <CompactPanel>
            <SectionLabel>{t("detail.comments")}</SectionLabel>
            <div className="mt-2 max-h-28 space-y-2 overflow-y-auto">
              {ticket.comments?.length ? (
                ticket.comments.map((item) => (
                  <div
                    key={item._id}
                    className="rounded-xl bg-white p-3 shadow-sm dark:bg-slate-800"
                  >
                    <p className="text-sm text-slate-700 dark:text-slate-200">
                      {item.text}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {item.author?.name || t("common.unknown")} / {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t("detail.noComments")}
                </p>
              )}
            </div>

            <form onSubmit={handleSubmitComment} className="mt-3 space-y-2">
              <textarea
                rows="2"
                value={comment}
                disabled={!onComment || submittingComment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t("detail.commentPlaceholder")}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <button
                type="submit"
                disabled={!comment.trim() || submittingComment}
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submittingComment ? t("detail.sendingComment") : t("detail.submitComment")}
              </button>
            </form>
          </CompactPanel>

          {canUploadAttachment && (
            <CompactPanel>
              <SectionLabel>{t("detail.attachment")}</SectionLabel>
              <form onSubmit={handleUpload} className="mt-2 space-y-2">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleFileChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  JPG, PNG, GIF, or WEBP only. Max 5 MB.
                </p>
                {fileError && (
                  <p className="text-xs font-semibold text-rose-600 dark:text-rose-300">
                    {fileError}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={!file || !!fileError}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
                >
                  Upload File
                </button>
              </form>
            </CompactPanel>
          )}
        </div>

        <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-950">
          <h3 className="mb-2 font-semibold text-slate-700 dark:text-slate-200">
            {t("detail.activityLog")}
          </h3>
          <div className="max-h-40 space-y-2 overflow-y-auto">
            {ticket.activityLog?.length ? (
              ticket.activityLog.map((entry) => (
                <div
                  key={entry._id}
                  className="rounded-xl bg-white p-3 shadow-sm dark:bg-slate-800"
                >
                  <p className="text-sm text-slate-700 dark:text-slate-200">
                    {entry.details}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {entry.action} by {entry.user?.name || t("common.unknown")} / {new Date(entry.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-slate-500 dark:text-slate-400">{t("detail.noActivity")}</p>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function CompactPanel({ children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950">
      {children}
    </section>
  );
}

function SectionLabel({ children }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
      {children}
    </h3>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-slate-800">
      <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
        {value}
      </div>
    </div>
  );
}

function buildPriorityOptions(t) {
  return [
    { value: "low", label: t("addTicket.priorities.low"), prefix: "L" },
    { value: "medium", label: t("addTicket.priorities.medium"), prefix: "M" },
    { value: "high", label: t("addTicket.priorities.high"), prefix: "H" },
    { value: "critical", label: t("addTicket.priorities.critical"), prefix: "C" },
  ];
}

function getStatusLabel(status, t) {
  return t(`queue.status.${status}`) || status;
}

function getPriorityLabel(priority, t) {
  return t(`addTicket.priorities.${priority}`) || priority;
}

function getEntityId(entity) {
  return String(entity?._id || entity?.id || entity || "");
}

function canCurrentUserSubmitSatisfaction(user, ticket) {
  const userId = getEntityId(user);
  const requesterUserId = getEntityId(ticket.requesterUserId);
  const creatorId = getEntityId(ticket.createdBy);

  return requesterUserId ? requesterUserId === userId : creatorId === userId;
}

function getAttachmentUrl(ticketId, attachment) {
  return `${API_ORIGIN}/api/tickets/${ticketId}/attachments/${attachment._id}/view`;
}

export default TicketDetailModal;
