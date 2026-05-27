import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { API_BASE_URL } from "../services/api";
import ThemedSelect from "./ThemedSelect";
import { Badge, Button, Card } from "./ui";

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

  const canSubmitSatisfaction = ticket.status === "resolved" && canCurrentUserSubmitSatisfaction(currentUser, ticket);
  const hasSatisfaction = Number(ticket.satisfactionScore) > 0;
  const showSatisfactionPanel = hasSatisfaction || canSubmitSatisfaction;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#090514]/58 px-0 pt-10 backdrop-blur-sm sm:items-center sm:px-3 sm:py-4">
      <button
        type="button"
        className="absolute inset-0 h-full w-full"
        onClick={onClose}
        aria-label={t("detail.closeBackdrop")}
      />
      <div
        className="relative max-h-[90dvh] w-full overflow-y-auto rounded-t-xl border border-purple-100/90 bg-white/95 p-4 shadow-2xl shadow-purple-950/15 backdrop-blur-xl dark:border-purple-400/15 dark:bg-[#140d24]/95 dark:shadow-slate-950/70 sm:max-w-[52rem] sm:rounded-xl md:p-5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ticket-detail-title"
      >
        <div className="mb-4 flex items-start justify-between gap-4 border-b border-purple-100/80 pb-4 dark:border-purple-400/10">
          <div className="min-w-0">
            <h2 id="ticket-detail-title" className="text-xl font-black tracking-tight text-slate-950 dark:text-white">
              {t("detail.title")}
            </h2>
            <p className="mt-1 truncate text-xs font-semibold text-slate-500 dark:text-slate-400">
              {ticket.ticketNumber} / {ticket.category} / {ticket.departmentName || ticket.department}
            </p>
          </div>

          <Button
            onClick={onClose}
            icon={X}
            iconOnly
            aria-label={t("common.close")}
            title={t("common.close")}
            variant="secondary"
          />
        </div>

        <div className={`grid gap-3 ${ticket.attachments?.length ? "lg:grid-cols-2" : ""}`}>
          <CompactPanel>
            <SectionLabel>{t("detail.titleLabel")}</SectionLabel>
            <p className="mt-1 text-base font-semibold text-slate-900 dark:text-white">
              {ticket.title}
            </p>
            {ticket.criticalRequested && (
              <Badge className="mt-3" tone="amber">
                {t("detail.criticalReview")}
              </Badge>
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
                      className="rounded-lg border border-purple-100/80 bg-white/90 p-3 shadow-sm backdrop-blur-sm dark:border-purple-400/10 dark:bg-white/5"
                    >
                      <button
                        type="button"
                        className="text-left text-sm font-semibold text-purple-700 hover:text-purple-900 dark:text-purple-200 dark:hover:text-purple-100"
                        onClick={() => handleViewAttachment(attachment)}
                      >
                        {attachment.originalName}
                      </button>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Uploaded by {attachment.uploadedBy?.name || t("common.unknown")}
                      </p>
                      <button
                        type="button"
                        className="mt-2 text-xs font-semibold text-slate-500 hover:text-purple-700 dark:text-slate-400 dark:hover:text-purple-200"
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
                  <SectionLabel>{t("detail.resolutionConfirmation")}</SectionLabel>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {hasSatisfaction
                      ? t("detail.resolutionConfirmedBy", {
                          score: ticket.satisfactionScore,
                          requester: ticket.satisfactionSubmittedBy?.name || "requester",
                        })
                      : t("detail.confirmResolutionHelp")}
                  </p>
                  {ticket.satisfactionSubmittedAt && (
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {new Date(ticket.satisfactionSubmittedAt).toLocaleString()}
                    </p>
                  )}
                </div>
                {hasSatisfaction && (
                  <div className="rounded-lg border border-purple-100 bg-white/90 px-3 py-2 text-sm font-black text-purple-700 dark:border-purple-400/20 dark:bg-white/5 dark:text-purple-200">
                    {ticket.satisfactionScore}/5
                  </div>
                )}
              </div>

              {hasSatisfaction && ticket.satisfactionComment && (
                <p className="mt-3 rounded-lg border border-purple-100/80 bg-white/90 p-3 text-sm text-slate-700 shadow-sm backdrop-blur-sm dark:border-purple-400/10 dark:bg-white/5 dark:text-slate-200">
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
                            ? "border-purple-600 bg-purple-600 text-white dark:border-purple-400 dark:bg-purple-500"
                            : "border-purple-100 bg-white/90 text-slate-700 hover:border-purple-300 hover:text-purple-700 dark:border-purple-400/15 dark:bg-white/5 dark:text-slate-200"
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
                    placeholder={t("detail.confirmResolutionPlaceholder")}
                    className="ops-input px-3 py-2"
                  />
                  <Button
                    type="submit"
                    disabled={!satisfactionScore || savingSatisfaction}
                    size="sm"
                    variant="primary"
                  >
                    {savingSatisfaction ? t("common.saving") : t("detail.confirmResolutionSubmit")}
                  </Button>
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
                    className="rounded-lg border border-purple-100/80 bg-white/90 p-3 shadow-sm backdrop-blur-sm dark:border-purple-400/10 dark:bg-white/5"
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
                className="ops-input px-3 py-2"
              />
              <Button
                type="submit"
                disabled={!comment.trim() || submittingComment}
                size="sm"
                variant="primary"
              >
                {submittingComment ? t("detail.sendingComment") : t("detail.submitComment")}
              </Button>
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
                  className="ops-input px-3 py-2"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  JPG, PNG, GIF, or WEBP only. Max 5 MB.
                </p>
                {fileError && (
                  <p className="text-xs font-semibold text-rose-600 dark:text-rose-300">
                    {fileError}
                  </p>
                )}
                <Button
                  type="submit"
                  disabled={!file || !!fileError}
                  size="sm"
                  variant="primary"
                >
                  Upload File
                </Button>
              </form>
            </CompactPanel>
          )}
        </div>

        <Card className="mt-3 text-sm">
          <h3 className="mb-2 font-semibold text-slate-700 dark:text-slate-200">
            {t("detail.activityLog")}
          </h3>
          <div className="max-h-40 space-y-2 overflow-y-auto">
            {ticket.activityLog?.length ? (
              ticket.activityLog.map((entry) => (
                <div
                  key={entry._id}
                  className="rounded-lg border border-purple-100/80 bg-white/90 p-3 shadow-sm backdrop-blur-sm dark:border-purple-400/10 dark:bg-white/5"
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
        </Card>
      </div>
    </div>,
    document.body,
  );
}

function CompactPanel({ children }) {
  return (
    <section className="rounded-lg border border-purple-100/80 bg-white/90 p-3 shadow-[0_10px_26px_rgba(76,29,149,0.06)] backdrop-blur-sm dark:border-purple-400/10 dark:bg-white/5">
      {children}
    </section>
  );
}

function SectionLabel({ children }) {
  return (
    <h3 className="ops-section-label">
      {children}
    </h3>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="rounded-lg border border-purple-100/80 bg-white/90 p-3 shadow-sm backdrop-blur-sm dark:border-purple-400/10 dark:bg-white/5">
      <p className="ops-section-label">
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
