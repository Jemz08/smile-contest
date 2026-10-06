const { createSessionCookie, getAdminConfig, safeEqual } = require("../_lib/admin-auth");
const { sendJson } = require("../_lib/supabase");

module.exports = function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return sendJson(response, 405, { error: "Method not allowed" });
  }

  try {
    const { password, secret } = getAdminConfig();
    if (!safeEqual(String(request.body?.password || ""), password)) {
      return sendJson(response, 401, { error: "Incorrect admin password" });
    }
    response.setHeader("Set-Cookie", createSessionCookie(secret));
    return sendJson(response, 200, { authenticated: true });
  } catch (error) {
    console.error("Admin login is unavailable", error.message);
    return sendJson(response, 503, { error: "Admin access is not configured" });
  }
};
