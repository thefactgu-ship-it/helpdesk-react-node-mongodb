import { Bell, CheckCheck } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notificationService";
import { API_BASE_URL } from "../services/api";

const NOTIFICATION_LIMIT = 20;
const POLLING_FALLBACK_MS = 120000;
const STREAM_RECONNECT_MS = 5000;

function upsertNotification(notifications, notification) {
  if (!notification?._id) return notifications;

  const notificationId = String(notification._id);
  const next = [
    notification,
    ...notifications.filter((item) => String(item._id) !== notificationId),
  ];

  return next.slice(0, NOTIFICATION_LIMIT);
}

function NotificationBell({ token, onOpenTicket, onRealtimeNotification, onRealtimeSync, t }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(Boolean(token));
  const [mobilePanelStyle, setMobilePanelStyle] = useState({});
  const [recentNotificationId, setRecentNotificationId] = useState("");
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const syncTimeoutRef = useRef(null);
  const realtimeNotificationRef = useRef(onRealtimeNotification);
  const realtimeSyncRef = useRef(onRealtimeSync);

  useEffect(() => {
    realtimeNotificationRef.current = onRealtimeNotification;
    realtimeSyncRef.current = onRealtimeSync;
  }, [onRealtimeNotification, onRealtimeSync]);

  const fetchNotifications = useCallback(async (options = {}) => {
    if (!token) return;
    const { silent = false } = options;

    try {
      if (!silent) setLoading(true);
      const body = await getNotifications(token, { limit: NOTIFICATION_LIMIT });
      setNotifications(body.data || []);
      setUnreadCount(body.unreadCount || 0);
      if (silent) {
        realtimeSyncRef.current?.();
      }
    } catch (error) {
      console.error("Failed to load notifications", error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [token]);

  const scheduleNotificationSync = useCallback(() => {
    window.clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = window.setTimeout(() => {
      fetchNotifications({ silent: true });
    }, 750);
  }, [fetchNotifications]);

  const applyStreamNotification = useCallback(
    (notification) => {
      if (!notification?._id) return;

      setNotifications((current) => upsertNotification(current, notification));
      setRecentNotificationId(String(notification._id));
      if (!notification.readAt) {
        setUnreadCount((current) => current + 1);
      }
      realtimeNotificationRef.current?.(notification);
      scheduleNotificationSync();
    },
    [scheduleNotificationSync],
  );

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
    if (!token) return undefined;

    let ignore = false;

    const loadNotifications = async () => {
      try {
        const body = await getNotifications(token, { limit: NOTIFICATION_LIMIT });
        if (ignore) return;

        setNotifications(body.data || []);
        setUnreadCount(body.unreadCount || 0);
      } catch (error) {
        console.error("Failed to load notifications", error);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadNotifications();

    return () => {
      ignore = true;
    };
  }, [token]);

  useEffect(() => {
    if (!token) return undefined;

    const intervalId = window.setInterval(() => {
      fetchNotifications({ silent: true });
    }, POLLING_FALLBACK_MS);
    return () => window.clearInterval(intervalId);
  }, [fetchNotifications, token]);

  useEffect(() => {
    if (!recentNotificationId) return undefined;

    const timeoutId = window.setTimeout(() => {
      setRecentNotificationId("");
    }, 3500);

    return () => window.clearTimeout(timeoutId);
  }, [recentNotificationId]);

  useEffect(() => {
    if (!token) return undefined;

    let cancelled = false;
    let abortController = null;

    const connect = async () => {
      abortController = new AbortController();

      try {
        const response = await fetch(`${API_BASE_URL}/notifications/stream`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: abortController.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(`Notification stream failed: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (!cancelled) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const chunks = buffer.split("\n\n");
          buffer = chunks.pop() || "";

          chunks.forEach((chunk) => {
            const event = parseSseEvent(chunk);
            if (event.name === "notification:new") {
              applyStreamNotification(event.data);
            } else if (event.name === "notification:sync") {
              fetchNotifications({ silent: true });
            }
          });
        }
      } catch (error) {
        if (!cancelled && error.name !== "AbortError") {
          console.error("Notification stream disconnected", error);
        }
      }

      if (!cancelled) {
        reconnectTimeoutRef.current = window.setTimeout(connect, STREAM_RECONNECT_MS);
      }
    };

    connect();

    return () => {
      cancelled = true;
      abortController?.abort();
      window.clearTimeout(reconnectTimeoutRef.current);
    };
  }, [applyStreamNotification, fetchNotifications, token]);

  useEffect(() => {
    if (!token) return undefined;

    const syncOnFocus = () => {
      if (document.visibilityState === "visible") {
        fetchNotifications({ silent: true });
      }
    };

    document.addEventListener("visibilitychange", syncOnFocus);
    window.addEventListener("focus", syncOnFocus);

    return () => {
      document.removeEventListener("visibilitychange", syncOnFocus);
      window.removeEventListener("focus", syncOnFocus);
      window.clearTimeout(syncTimeoutRef.current);
    };
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
        aria-label={t("notifications.open")}
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
                {t("notifications.title")}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {unreadCount ? t("notifications.unread", { count: unreadCount }) : t("notifications.allCaughtUp")}
              </p>
            </div>
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={!unreadCount}
              className="grid h-9 w-9 place-items-center rounded-full text-slate-500 transition hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-200"
              aria-label={t("notifications.markAll")}
              title={t("notifications.markAll")}
            >
              <CheckCheck className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2 sm:max-h-96">
            {loading && !notifications.length && (
              <p className="px-3 py-5 text-center text-sm text-slate-500 dark:text-slate-400">
                {t("notifications.loading")}
              </p>
            )}

            {!loading && !notifications.length && (
              <p className="px-3 py-5 text-center text-sm text-slate-500 dark:text-slate-400">
                {t("notifications.empty")}
              </p>
            )}

            {notifications.map((notification) => (
              <button
                key={notification._id}
                type="button"
                onClick={() => handleOpenNotification(notification)}
                className={`flex w-full gap-3 rounded-md px-3 py-3 text-left transition ${
                  String(notification._id) === recentNotificationId
                    ? "bg-blue-50 ring-1 ring-blue-200 dark:bg-blue-500/10 dark:ring-blue-400/20"
                    : "hover:bg-blue-50 dark:hover:bg-slate-900"
                }`}
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

function parseSseEvent(chunk) {
  const lines = chunk.split("\n");
  const eventName = lines
    .find((line) => line.startsWith("event:"))
    ?.replace("event:", "")
    .trim();
  const dataLines = lines
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.replace("data:", "").trim());

  if (!dataLines.length) return { name: eventName || "message", data: null };

  try {
    return {
      name: eventName || "message",
      data: JSON.parse(dataLines.join("\n")),
    };
  } catch (error) {
    console.error("Failed to parse notification stream event", error);
    return { name: eventName || "message", data: null };
  }
}

export default NotificationBell;
