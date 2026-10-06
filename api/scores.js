const { sendJson, supabaseRequest } = require("./_lib/supabase");

const config = { api: { bodyParser: { sizeLimit: "256kb" } } };

async function handler(request, response) {
  try {
    if (request.method === "GET") {
      const scores = await supabaseRequest("/rest/v1/smile_scores?select=name,score,photo,created_at&order=score.desc,created_at.asc");
      return sendJson(response, 200, scores);
    }

    if (request.method !== "POST") {
      response.setHeader("Allow", "GET, POST");
      return sendJson(response, 405, { error: "Method not allowed" });
    }

    const name = typeof request.body?.name === "string" ? request.body.name.trim().replace(/\s+/g, " ") : "";
    const score = request.body?.score;
    const photo = request.body?.photo;
    if (!name || name.length > 20 || !Number.isInteger(score) || score < 0 || score > 100
      || typeof photo !== "string" || !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/.test(photo)
      || Buffer.byteLength(photo, "utf8") > 240000) {
      return sendJson(response, 400, { error: "Invalid score submission" });
    }

    await supabaseRequest("/rest/v1/rpc/submit_smile_score", {
      method: "POST",
      body: JSON.stringify({ p_name: name, p_score: score, p_photo: photo })
    });
    return sendJson(response, 201, { ok: true });
  } catch (error) {
    console.error("Leaderboard request failed", error.message);
    return sendJson(response, 503, { error: "The shared leaderboard is temporarily unavailable" });
  }
}

module.exports = handler;
module.exports.config = config;
