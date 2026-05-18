import { Bell, CheckCheck } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notificationService";

function NotificationBell({ token, onOpenTicket }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [mobilePanelStyle, setMobilePanelStyle] = useState({});
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      const body = await getNotifications(token, { limit: 20 });
      setNotifications(body.data || []);
      setUnreadCount(body.unreadCount || 0);
    } catch (error) {
      console.error("Failed to load notifications", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const updateMobilePanelPosition = useCallback(() => {
    const buttonRect = buttonRef.current?.getBoundingClientRect();
    if (!buttonRect || window.innerWidth >= 640) {
      setMobilePanelStyle({});
      return;
    }

    const top = Math.max(buttonRect.bottom + 8, 72);
    setMobilePanelStyle({
      top: `${top}px`,
      maxHeight: `calc(100vh - ${top}px - 5.75rem)`,
    });
  }, []);

  useEffect(() => {

    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!token) return undefined;

    const intervalId = window.setInterval(fetchNotifications, 45000);
    return () => window.clearInterval(intervalId);
  }, [fetchNotifications, token]);

  useEffect(() => {
    if (!open) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    updateMobilePanelPosition();
    window.addEventListener("resize", updateMobilePanelPosition);
    window.addEventListener("scroll", updateMobilePanelPosition, true);

    return () => {
      window.removeEventListener("resize", updateMobilePanelPosition);
      window.removeEventListener("scroll", updateMobilePanelPosition, true);
    };
  }, [open, updateMobilePanelPosition]);

  const handleOpenNotification = async (notification) => {
    try {
      if (!notification.readAt) {
        await markNotificationRead(token, notification._id);
      }

      setOpen(false);
      await fetchNotifications();

      const ticketId = notification.ticketId?._id || notification.ticketId;
      if (ticketId) {
        onOpenTicket(ticketId);
      }
    } catch (error) {
      console.error("Failed to open notification", error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead(token);
      await fetchNotifications();
    } catch (error) {
      console.error("Failed to mark notifications as read", error);
    }
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          if (!open) {
            updateMobilePanelPosition();
          } else {
            setMobilePanelStyle({});
          }
          setOpen((current) => !current);
        }}
        className="relative grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-blue-400 dark:hover:bg-slate-800"
        aria-label="Open notifications"
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-rose-600 px-1.5 text-[10px] font-black text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="fixed left-4 right-4 z-50 flex w-auto flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl shadow-slate-200/60 dark:border-slate-700 dark:bg-slate-950 dark:shadow-slate-950/60 sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:z-30 sm:w-[min(22rem,calc(100vw-2rem))] sm:max-h-none"
          style={mobilePanelStyle}
        >
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <div>
              <p className="text-sm font-black text-slate-900 dark:text-white">
                Notifications
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {unreadCount ? `${unreadCount} unread` : "All caught up"}
              </p>
            </div>
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={!unreadCount}
              className="grid h-9 w-9 place-items-center rounded-full text-slate-500 transition hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-200"
              aria-label="Mark all notifications as read"
              title="Mark all as read"
            >
              <CheckCheck className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2 sm:max-h-96">
            {loading && !notifications.length && (
              <p className="px-3 py-5 text-center text-sm text-slate-500 dark:text-slate-400">
                Loading notifications...
              </p>
            )}

            {!loading && !notifications.length && (
              <p className="px-3 py-5 text-center text-sm text-slate-500 dark:text-slate-400">
                No notifications yet.
              </p>
            )}

            {notifications.map((notification) => (
              <button
                key={notification._id}
                type="button"
                onClick={() => handleOpenNotification(notification)}
                className="flex w-full gap-3 rounded-md px-3 py-3 text-left transition hover:bg-blue-50 dark:hover:bg-slate-900"
              >
                <span
                  className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                    notification.readAt ? "bg-slate-300 dark:bg-slate-700" : "bg-rose-500"
                  }`}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <span className="block overflow-hidden text-sm font-bold text-slate-900 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] dark:text-white">
                    {notification.title}
                  </span>
                  <span className="mt-0.5 block overflow-hidden text-xs leading-5 text-slate-500 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] dark:text-slate-400">
                    {notification.message}
                  </span>
                  <span className="mt-1 block text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                    {formatNotificationTime(notification.createdAt)}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatNotificationTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleString();
}

export default NotificationBell;
