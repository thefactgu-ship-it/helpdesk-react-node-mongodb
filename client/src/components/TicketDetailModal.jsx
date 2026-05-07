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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Ticket Details
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {ticket.ticketNumber} • {ticket.category} • {ticket.department}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Close
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Title
              </h3>
              <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                {ticket.title}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Description
              </h3>
              <p className="mt-2 text-slate-600 dark:text-slate-300">
                {ticket.description || "No description provided."}
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
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
          </div>

          <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Updated By
              </h3>
              <p className="text-slate-700 dark:text-slate-200">
                {ticket.updatedBy?.name || ticket.createdBy?.name || "Unknown"}
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Attachments
              </h3>
              {ticket.attachments?.length ? (
                <ul className="space-y-2">
                  {ticket.attachments.map((attachment) => (
                    <li key={attachment._id} className="rounded-2xl bg-white p-3 shadow-sm dark:bg-slate-800">
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
                <p className="text-slate-500 dark:text-slate-400">No attachments yet.</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Comments
            </h3>
            <div className="space-y-3">
              {ticket.comments?.length ? (
                ticket.comments.map((comment) => (
                  <div
                    key={comment._id}
                    className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800"
                  >
                    <p className="text-sm text-slate-700 dark:text-slate-200">
                      {comment.text}
                    </p>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      {comment.author?.name || "Unknown"} • {new Date(comment.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 dark:text-slate-400">No comments yet.</p>
              )}
            </div>

            <form onSubmit={handleSubmitComment} className="mt-4 space-y-3">
              <textarea
                rows="3"
                value={comment}
                disabled={!onComment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <button
                type="submit"
                className="rounded-2xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-purple-700"
              >
                Post Comment
              </button>
            </form>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Add Attachment
            </h3>
            <form onSubmit={handleUpload} className="space-y-3">
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <button
                type="submit"
                disabled={!file}
                className="rounded-2xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-purple-400"
              >
                Upload File
              </button>
            </form>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-700 dark:bg-slate-950">
          <h3 className="mb-3 font-semibold text-slate-700 dark:text-slate-200">Activity log</h3>
          <div className="space-y-3">
            {ticket.activityLog?.length ? (
              ticket.activityLog.map((entry) => (
                <div key={entry._id} className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800">
                  <p className="text-sm text-slate-700 dark:text-slate-200">{entry.details}</p>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    {entry.action} by {entry.user?.name || "Unknown"} • {new Date(entry.createdAt).toLocaleString()}
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

function InfoItem({ label, value }) {
  return (
    <div className="rounded-2xl bg-white p-3 shadow-sm dark:bg-slate-800">
      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

export default TicketDetailModal;
