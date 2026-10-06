const { createHmac, timingSafeEqual } = require("node:crypto");

const cookieName = "smile_admin_session";
const sessionDuration = 12 * 60 * 60;

function getAdminConfig() {
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!password || !secret || secret.length < 32) {
    throw new Error("Admin authentication is not configured");
  }
  return { password, secret };
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function createSessionCookie(secret) {
  const payload = Buffer.from(JSON.stringify({ expiresAt: Date.now() + sessionDuration * 1000 })).toString("base64url");
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${cookieName}=${payload}.${signature}; HttpOnly; Secure; SameSite=Strict; Path=/api/admin; Max-Age=${sessionDuration}`;
}

function isAdminSession(request, secret) {
  const cookieHeader = request.headers.cookie || "";
  const value = cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
  if (!value) return false;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return false;

  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  if (!safeEqual(signature, expected)) return false;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return Number.isFinite(session.expiresAt) && session.expiresAt > Date.now();
  } catch {
    return false;
  }
}

function expiredSessionCookie() {
  return `${cookieName}=; HttpOnly; Secure; SameSite=Strict; Path=/api/admin; Max-Age=0`;
}

module.exports = { createSessionCookie, expiredSessionCookie, getAdminConfig, isAdminSession, safeEqual };
