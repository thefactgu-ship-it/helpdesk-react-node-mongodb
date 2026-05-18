const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const uploadsDir = path.resolve(__dirname, "..", "uploads");

async function saveAttachmentFile(file) {
  const provider = getProvider();

  if (provider === "disabled") {
    const error = new Error("Ticket attachments are disabled in this environment");
    error.status = 503;
    throw error;
  }

  return saveToLocal(file);
}

async function readAttachmentFile(attachment) {
  if (attachment.storageProvider && attachment.storageProvider !== "local") {
    return null;
  }

  return readFromLocal(attachment);
}

function getProvider() {
  const defaultProvider = process.env.NODE_ENV === "production" ? "disabled" : "local";
  return String(process.env.ATTACHMENT_STORAGE_PROVIDER || defaultProvider).toLowerCase();
}

function buildObjectKey(file) {
  const extension = path.extname(file.originalname).toLowerCase();
  return `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}${extension}`;
}

async function saveToLocal(file) {
  await fs.promises.mkdir(uploadsDir, { recursive: true });
  const objectKey = buildObjectKey(file).replace(/\//g, "-");
  const filePath = path.join(uploadsDir, objectKey);
  await fs.promises.writeFile(filePath, file.buffer);

  return {
    filename: objectKey,
    objectKey,
    storageProvider: "local",
    url: `/uploads/${objectKey}`,
  };
}

async function readFromLocal(attachment) {
  const safeFilename = path.basename(attachment.objectKey || attachment.filename);
  const filePath = path.join(uploadsDir, safeFilename);

  if (!filePath.startsWith(uploadsDir) || !fs.existsSync(filePath)) {
    return null;
  }

  return fs.promises.readFile(filePath);
}

module.exports = {
  getProvider,
  readAttachmentFile,
  saveAttachmentFile,
};
