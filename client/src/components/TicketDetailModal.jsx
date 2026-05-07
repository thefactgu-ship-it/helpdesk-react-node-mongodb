import { useEffect, useState } from "react";

function TicketDetailModal({ open, ticket, onClose, onComment, onUploadAttachment }) {
  const [comment, setComment] = useState("");
  const [file, setFile] = useState(null);

  useEffect(() => {
    if (!open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setComment("");
      setFile(null);
    }
  }, [open]);

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
    if (!file) return;
    await onUploadAttachment(ticket._id, file);
    setFile(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3 py-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-[52rem] overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl dark:bg-slate-900 md:p-5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Ticket Details
            </h2>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              {ticket.ticketNumber} / {ticket.category} / {ticket.department}
            </p>
          </div>

          <button
            onClick={onClose}
            className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Close
          </button>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
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
              <InfoItem label="Created By" value={ticket.createdBy?.name || "Unknown"} />
              <InfoItem label="Assigned To" value={ticket.assignedTo?.name || "Unassigned"} />
              <InfoItem label="SLA (hrs)" value={ticket.slaHours} />
              <InfoItem
                label="Due Date"
                value={ticket.dueDate ? new Date(ticket.dueDate).toLocaleString() : "Not set"}
              />
            </div>
          </CompactPanel>

          <CompactPanel>
            <SectionLabel>Updated By</SectionLabel>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
              {ticket.updatedBy?.name || ticket.createdBy?.name || "Unknown"}
            </p>

            <div className="mt-4">
              <SectionLabel>Attachments</SectionLabel>
              {ticket.attachments?.length ? (
                <ul className="mt-2 max-h-40 space-y-2 overflow-y-auto">
                  {ticket.attachments.map((attachment) => (
                    <li
                      key={attachment._id}
                      className="rounded-xl bg-white p-3 shadow-sm dark:bg-slate-800"
                    >
                      <a
                        className="text-sm font-semibold text-purple-700 hover:text-purple-900 dark:text-purple-300 dark:hover:text-purple-200"
                        href={attachment.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {attachment.originalName}
                      </a>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Uploaded by {attachment.uploadedBy?.name || "Unknown"}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  No attachments yet.
                </p>
              )}
            </div>
          </CompactPanel>
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-2">
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

          <CompactPanel>
            <SectionLabel>Add Attachment</SectionLabel>
            <form onSubmit={handleUpload} className="mt-2 space-y-2">
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <button
                type="submit"
                disabled={!file}
                className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-purple-400"
              >
                Upload File
              </button>
            </form>
          </CompactPanel>
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
    </div>
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

export default TicketDetailModal;
