const assert = require("node:assert/strict");
const test = require("node:test");

const notificationStream = require("../services/notificationStream");

function mockSseResponse() {
  return {
    destroyed: false,
    headers: {},
    output: "",
    writableEnded: false,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    flushHeaders() {
      this.flushed = true;
    },
    write(chunk) {
      this.output += chunk;
      return true;
    },
    end() {
      this.writableEnded = true;
    },
  };
}

function waitFor(predicate, timeoutMs = 200) {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const intervalId = setInterval(() => {
      if (predicate()) {
        clearInterval(intervalId);
        resolve();
        return;
      }

      if (Date.now() - startedAt > timeoutMs) {
        clearInterval(intervalId);
        reject(new Error("Timed out waiting for condition"));
      }
    }, 5);
  });
}

test("notification stream initializes SSE headers and heartbeat", async () => {
  const res = mockSseResponse();
  const unsubscribe = notificationStream.subscribe("user-1", res, {
    heartbeatMs: 10,
  });

  assert.equal(res.headers["Content-Type"], "text/event-stream");
  assert.equal(res.headers["Cache-Control"], "no-cache, no-transform");
  assert.match(res.output, /event: notification:sync/);

  await waitFor(() => res.output.includes("event: heartbeat"));
  unsubscribe();

  assert.equal(res.writableEnded, true);
  assert.equal(notificationStream.getClientCount("user-1"), 0);
});

test("notification stream emits new notifications only to the recipient", () => {
  const recipientRes = mockSseResponse();
  const otherRes = mockSseResponse();
  const unsubscribeRecipient = notificationStream.subscribe("user-1", recipientRes);
  const unsubscribeOther = notificationStream.subscribe("user-2", otherRes);

  const sentCount = notificationStream.emitNotification({
    _id: "notification-1",
    userId: "user-1",
    title: "New ticket comment",
    message: "Ticket 1 / Printer issue",
  });

  assert.equal(sentCount, 1);
  assert.match(recipientRes.output, /event: notification:new/);
  assert.match(recipientRes.output, /New ticket comment/);
  assert.doesNotMatch(otherRes.output, /event: notification:new/);

  unsubscribeRecipient();
  unsubscribeOther();
  notificationStream.resetClientsForTests();
});
