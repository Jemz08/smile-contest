const { expiredSessionCookie } = require("../_lib/admin-auth");
const { sendJson } = require("../_lib/supabase");

module.exports = function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return sendJson(response, 405, { error: "Method not allowed" });
  }
  response.setHeader("Set-Cookie", expiredSessionCookie());
  return sendJson(response, 200, { authenticated: false });
};
