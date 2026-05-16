const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const uploadsDir = path.resolve(__dirname, "..", "uploads");

async function saveAttachmentFile(file) {
  if (getProvider() === "s3") {
    return saveToS3(file);
  }

  return saveToLocal(file);
}

async function readAttachmentFile(attachment) {
  if (attachment.storageProvider === "s3" || String(attachment.url || "").startsWith("s3://")) {
    return readFromS3(attachment);
  }

  return readFromLocal(attachment);
}

function getProvider() {
  return String(process.env.ATTACHMENT_STORAGE_PROVIDER || "local").toLowerCase();
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

async function saveToS3(file) {
  const objectKey = buildObjectKey(file);
  const bucket = requireS3Env("S3_BUCKET");
  const endpoint = requireS3Env("S3_ENDPOINT").replace(/\/$/, "");
  const url = `${endpoint}/${bucket}/${objectKey}`;

  const response = await signedS3Fetch("PUT", url, {
    body: file.buffer,
    contentType: file.mimetype,
  });

  if (!response.ok) {
    throw new Error(`Object storage upload failed with status ${response.status}`);
  }

  return {
    filename: path.basename(objectKey),
    objectKey,
    storageProvider: "s3",
    url: `s3://${bucket}/${objectKey}`,
  };
}

async function readFromS3(attachment) {
  const bucket = requireS3Env("S3_BUCKET");
  const endpoint = requireS3Env("S3_ENDPOINT").replace(/\/$/, "");
  const objectKey = attachment.objectKey || String(attachment.url || "").replace(`s3://${bucket}/`, "");
  const url = `${endpoint}/${bucket}/${objectKey}`;
  const response = await signedS3Fetch("GET", url);

  if (!response.ok) return null;

  return Buffer.from(await response.arrayBuffer());
}

async function signedS3Fetch(method, url, options = {}) {
  const accessKeyId = requireS3Env("S3_ACCESS_KEY_ID");
  const secretAccessKey = requireS3Env("S3_SECRET_ACCESS_KEY");
  const region = process.env.S3_REGION || "us-east-1";
  const service = "s3";
  const body = options.body || Buffer.alloc(0);
  const payloadHash = sha256(body, "hex");
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const parsedUrl = new URL(url);
  const headers = {
    host: parsedUrl.host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };

  if (options.contentType) headers["content-type"] = options.contentType;

  const signedHeaders = Object.keys(headers).sort().join(";");
  const canonicalHeaders = Object.keys(headers)
    .sort()
    .map((key) => `${key}:${headers[key]}\n`)
    .join("");
  const canonicalRequest = [
    method,
    encodeURI(parsedUrl.pathname),
    parsedUrl.searchParams.toString(),
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256(canonicalRequest, "hex"),
  ].join("\n");
  const signingKey = getSignatureKey(secretAccessKey, dateStamp, region, service);
  const signature = hmac(signingKey, stringToSign, "hex");

  headers.authorization = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return fetch(url, {
    method,
    headers,
    body: method === "GET" ? undefined : body,
  });
}

function requireS3Env(name) {
  if (!process.env[name]) {
    throw new Error(`${name} is required when ATTACHMENT_STORAGE_PROVIDER=s3`);
  }
  return process.env[name];
}

function sha256(value, encoding) {
  return crypto.createHash("sha256").update(value).digest(encoding);
}

function hmac(key, value, encoding) {
  return crypto.createHmac("sha256", key).update(value).digest(encoding);
}

function getSignatureKey(secretAccessKey, dateStamp, regionName, serviceName) {
  const kDate = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, regionName);
  const kService = hmac(kRegion, serviceName);
  return hmac(kService, "aws4_request");
}

module.exports = {
  readAttachmentFile,
  saveAttachmentFile,
};
