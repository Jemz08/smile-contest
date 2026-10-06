const { test } = require("node:test");
const assert = require("node:assert/strict");

process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
process.env.ADMIN_PASSWORD = "test-admin-password";
process.env.ADMIN_SESSION_SECRET = "0123456789abcdef0123456789abcdef";

function createResponse() {
  return {
    headers: {},
    status(code) { this.statusCode = code; return this; },
    setHeader(name, value) { this.headers[name] = value; },
    json(body) { this.payload = body; return this; }
  };
}

test("score endpoint reads the board and validates score submissions", async () => {
  const requests = [];
  global.fetch = async (url, options = {}) => {
    requests.push({ url, options });
    return new Response("[]", { status: 200 });
  };
  const handler = require("../scores");

  let response = createResponse();
  await handler({ method: "GET" }, response);
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.payload, []);

  response = createResponse();
  await handler({ method: "POST", body: { name: "Player", score: 101, photo: "data:image/jpeg;base64,AA==" } }, response);
  assert.equal(response.statusCode, 400);
  assert.equal(requests.length, 1);

  response = createResponse();
  await handler({ method: "POST", body: { name: "Player", score: 80, photo: "data:image/jpeg;base64,AA==" } }, response);
  assert.equal(response.statusCode, 201);
  assert.match(requests.at(-1).url, /rpc\/submit_smile_score$/);
});

test("only a signed admin session can clear the shared board", async () => {
  let deleteRequests = 0;
  global.fetch = async (url, options = {}) => {
    if (options.method === "DELETE") deleteRequests += 1;
    return new Response(null, { status: 204 });
  };
  const login = require("../admin/login");
  const session = require("../admin/session");
  const clear = require("../admin/clear");

  let response = createResponse();
  login({ method: "POST", body: { password: "wrong" } }, response);
  assert.equal(response.statusCode, 401);

  response = createResponse();
  login({ method: "POST", body: { password: "test-admin-password" } }, response);
  assert.equal(response.statusCode, 200);
  const cookie = response.headers["Set-Cookie"].split(";")[0];
  assert.match(response.headers["Set-Cookie"], /HttpOnly; Secure; SameSite=Strict/);

  response = createResponse();
  session({ method: "GET", headers: { cookie } }, response);
  assert.equal(response.statusCode, 200);
  assert.equal(response.payload.authenticated, true);

  response = createResponse();
  await clear({ method: "DELETE", headers: {} }, response);
  assert.equal(response.statusCode, 401);
  assert.equal(deleteRequests, 0);

  response = createResponse();
  await clear({ method: "DELETE", headers: { cookie } }, response);
  assert.equal(response.statusCode, 200);
  assert.equal(response.payload.cleared, true);
  assert.equal(deleteRequests, 1);
});
