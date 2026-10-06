const { getAdminConfig, isAdminSession } = require("../_lib/admin-auth");
const { sendJson, supabaseRequest } = require("../_lib/supabase");

module.exports = async function handler(request, response) {
  if (request.method !== "DELETE") {
    response.setHeader("Allow", "DELETE");
    return sendJson(response, 405, { error: "Method not allowed" });
  }

  try {
    const { secret } = getAdminConfig();
    if (!isAdminSession(request, secret)) {
      return sendJson(response, 401, { error: "Admin sign-in required" });
    }
    await supabaseRequest("/rest/v1/smile_scores?id=not.is.null", {
      method: "DELETE",
      headers: { Prefer: "return=minimal" }
    });
    return sendJson(response, 200, { cleared: true });
  } catch (error) {
    console.error("Leaderboard clear failed", error.message);
    return sendJson(response, 503, { error: "The shared leaderboard could not be cleared" });
  }
};
