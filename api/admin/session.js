const { getAdminConfig, isAdminSession } = require("../_lib/admin-auth");
const { sendJson } = require("../_lib/supabase");

module.exports = function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return sendJson(response, 405, { error: "Method not allowed" });
  }

  try {
    const { secret } = getAdminConfig();
    const authenticated = isAdminSession(request, secret);
    return sendJson(response, authenticated ? 200 : 401, { authenticated });
  } catch {
    return sendJson(response, 503, { authenticated: false, error: "Admin access is not configured" });
  }
};
