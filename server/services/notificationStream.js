const crypto = require("node:crypto");

const DEFAULT_HEARTBEAT_MS = 30000;
const clientsByUserId = new Map();

function toId(value) {
  return String(value?._id || value || "");
}

function normalizeNotification(notification) {
  if (!notification) return null;
  if (typeof notification.toObject === "function") {
    return notification.toObject({ getters: true, virtuals: false });
  }
  return notification;
}

function writeEvent(res, event, payload = {}) {
  if (res.writableEnded || res.destroyed) return false;

  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
  return true;
}

function subscribe(userId, res, options = {}) {
  const normalizedUserId = toId(userId);
  const heartbeatMs = options.heartbeatMs || DEFAULT_HEARTBEAT_MS;
  const client = {
    id: crypto.randomUUID(),
    res,
  };

  if (!clientsByUserId.has(normalizedUserId)) {
    clientsByUserId.set(normalizedUserId, new Set());
  }

  clientsByUserId.get(normalizedUserId).add(client);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  if (typeof res.flushHeaders === "function") {
    res.flushHeaders();
  }

  res.write("retry: 5000\n\n");
  writeEvent(res, "notification:sync", {
    connected: true,
    userId: normalizedUserId,
    timestamp: new Date().toISOString(),
  });

  const heartbeatId = setInterval(() => {
    writeEvent(res, "heartbeat", { timestamp: new Date().toISOString() });
  }, heartbeatMs);

  return function unsubscribe() {
    clearInterval(heartbeatId);

    const clients = clientsByUserId.get(normalizedUserId);
    if (clients) {
      clients.delete(client);
      if (!clients.size) {
        clientsByUserId.delete(normalizedUserId);
      }
    }

    if (!res.writableEnded && !res.destroyed) {
      res.end();
    }
  };
}

function emitToUser(userId, event, payload) {
  const clients = clientsByUserId.get(toId(userId));
  if (!clients?.size) return 0;

  let sent = 0;
  clients.forEach((client) => {
    if (writeEvent(client.res, event, payload)) {
      sent += 1;
    }
  });

  return sent;
}

function emitNotification(notification) {
  const payload = normalizeNotification(notification);
  if (!payload?.userId) return 0;

  return emitToUser(payload.userId, "notification:new", payload);
}

function emitNotifications(notifications = []) {
  return notifications.reduce(
    (total, notification) => total + emitNotification(notification),
    0
  );
}

function getClientCount(userId) {
  if (userId) return clientsByUserId.get(toId(userId))?.size || 0;

  return [...clientsByUserId.values()].reduce(
    (total, clients) => total + clients.size,
    0
  );
}

function resetClientsForTests() {
  [...clientsByUserId.values()].forEach((clients) => {
    clients.forEach((client) => {
      if (!client.res.writableEnded && !client.res.destroyed) {
        client.res.end();
      }
    });
  });
  clientsByUserId.clear();
}

module.exports = {
  emitNotification,
  emitNotifications,
  getClientCount,
  resetClientsForTests,
  subscribe,
  writeEvent,
};
