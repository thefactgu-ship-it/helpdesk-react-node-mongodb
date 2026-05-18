import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { API_BASE_URL } from "../services/api";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const API_ORIGIN = API_BASE_URL.replace(/\/api$/, "");

function TicketDetailModal({
  open,
  ticket,
  onClose,
  onComment,
  onUploadAttachment,
  canUploadAttachment = false,
}) {
  const [comment, setComment] = useState("");
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState("");

  useEffect(() => {
    if (!open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setComment("");
      setFile(null);
      setFileError("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const closeOnEscape = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [onClose, open]);

  if (!open || !ticket) {
    return null;
  }

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    await onComment(ticket._id, comment.trim());
    setComment("");
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!canUploadAttachment) return;
    if (!file) return;
    await onUploadAttachment(ticket._id, file);
    setFile(null);
    setFileError("");
    e.target.reset();
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

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-0 pt-10 backdrop-blur-sm sm:items-center sm:px-3 sm:py-4">
      <button
        type="button"
        className="absolute inset-0 h-full w-full"
        onClick={onClose}
        aria-label="Close ticket details backdrop"
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
              Ticket Details
            </h2>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              {ticket.ticketNumber} / {ticket.category} / {ticket.departmentName || ticket.department}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            aria-label="Close ticket details"
          >
            Close
          </button>
        </div>

        <div className={`grid gap-3 ${ticket.attachments?.length ? "lg:grid-cols-2" : ""}`}>
          <CompactPanel>
            <SectionLabel>Title</SectionLabel>
            <p className="mt-1 text-base font-semibold text-slate-900 dark:text-white">
              {ticket.title}
            </p>

            <div className="mt-3">
              <SectionLabel>Description</SectionLabel>
              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {ticket.description || "No description provided."}
              </p>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <InfoItem label="Priority" value={ticket.priority} />
              <InfoItem label="Status" value={ticket.status} />
              <InfoItem label="Requester" value={ticket.requester || "Unknown"} />
              <InfoItem label="Created By" value={ticket.createdBy?.name || "Unknown"} />
              <InfoItem label="Assigned To" value={ticket.assignedTo?.name || "Unassigned"} />
              <InfoItem label="SLA (hrs)" value={ticket.slaHours} />
              <InfoItem
                label="Due Date"
                value={ticket.dueDate ? new Date(ticket.dueDate).toLocaleString() : "Not set"}
              />
            </div>
          </CompactPanel>

          {ticket.attachments?.length ? (
            <CompactPanel>
              <SectionLabel>Updated By</SectionLabel>
              <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                {ticket.updatedBy?.name || ticket.createdBy?.name || "Unknown"}
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
                        className="text-left text-sm font-semibold text-purple-700 hover:text-purple-900 dark:text-purple-300 dark:hover:text-purple-200"
                        onClick={() => handleViewAttachment(attachment)}
                      >
                        {attachment.originalName}
                      </button>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Uploaded by {attachment.uploadedBy?.name || "Unknown"}
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

        <div className={`mt-3 grid gap-3 ${canUploadAttachment ? "lg:grid-cols-2" : ""}`}>
          <CompactPanel>
            <SectionLabel>Comments</SectionLabel>
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
                      {item.author?.name || "Unknown"} / {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No comments yet.
                </p>
              )}
            </div>

            <form onSubmit={handleSubmitComment} className="mt-3 space-y-2">
              <textarea
                rows="2"
                value={comment}
                disabled={!onComment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <button
                type="submit"
                className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700"
              >
                Post Comment
              </button>
            </form>
          </CompactPanel>

          {canUploadAttachment && (
            <CompactPanel>
              <SectionLabel>Add Attachment</SectionLabel>
              <form onSubmit={handleUpload} className="mt-2 space-y-2">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleFileChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
                  className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-purple-400"
                >
                  Upload File
                </button>
              </form>
            </CompactPanel>
          )}
        </div>

        <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-950">
          <h3 className="mb-2 font-semibold text-slate-700 dark:text-slate-200">
            Activity log
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
                    {entry.action} by {entry.user?.name || "Unknown"} / {new Date(entry.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-slate-500 dark:text-slate-400">No activity yet.</p>
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
      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}

function getAttachmentUrl(ticketId, attachment) {
  return `${API_ORIGIN}/api/tickets/${ticketId}/attachments/${attachment._id}/view`;
}

export default TicketDetailModal;
