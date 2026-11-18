const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const request = require("supertest");
const { app, mockQuery, resetDb } = require("./helpers/app");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { getJwtSecret } = require("../utils/jwtSecret");
const AppError = require("../utils/AppError");

function run(middleware, headers = {}, user) {
  const req = { headers, user };
  let statusCode = null;
  let body = null;
  let nextCalled = false;
  const res = {
    status(code) { statusCode = code; return this; },
    json(payload) { body = payload; return this; },
  };
  middleware(req, res, () => { nextCalled = true; });
  return { req, statusCode, body, nextCalled };
}

const bearer = (payload, secret = "test-secret") => ({ authorization: `Bearer ${jwt.sign(payload, secret)}` });

describe("requireAuth", () => {
  it("rejects requests without a token", () => {
    const r = run(requireAuth);
    assert.equal(r.statusCode, 401);
    assert.equal(r.body.code, "AUTH_REQUIRED");
  });

  it("rejects tokens signed with another secret", () => {
    const r = run(requireAuth, bearer({ id: 1 }, "attacker-secret"));
    assert.equal(r.statusCode, 401);
    assert.equal(r.body.code, "INVALID_TOKEN");
  });

  it("attaches the token payload to req.user", () => {
    const r = run(requireAuth, bearer({ id: 3, user_type: "client" }));
    assert.ok(r.nextCalled);
    assert.equal(r.req.user.id, 3);
  });
});

describe("requireAdmin", () => {
  it("blocks non-admin users with 403", () => {
    const r = run(requireAdmin, {}, { id: 1, user_type: "freelancer" });
    assert.equal(r.statusCode, 403);
  });

  it("allows admins", () => {
    const r = run(requireAdmin, bearer({ id: 1, user_type: "admin" }));
    assert.ok(r.nextCalled);
  });
});

describe("getJwtSecret", () => {
  const original = { secret: process.env.JWT_SECRET, env: process.env.NODE_ENV };
  afterEach(() => {
    process.env.JWT_SECRET = original.secret;
    process.env.NODE_ENV = original.env;
  });

  it("refuses to fall back to a default secret in production", () => {
    delete process.env.JWT_SECRET;
    process.env.NODE_ENV = "production";
    assert.throws(getJwtSecret, /JWT_SECRET must be set/);
  });

  it("uses a development fallback outside production", () => {
    delete process.env.JWT_SECRET;
    process.env.NODE_ENV = "development";
    assert.equal(getJwtSecret(), "dev_secret");
  });
});

describe("app-level handlers", () => {
  it("returns a structured 404 for unknown API routes", async () => {
    const res = await request(app).get("/api/does-not-exist");
    assert.equal(res.status, 404);
    assert.equal(res.body.code, "NOT_FOUND");
    assert.ok(res.headers["x-request-id"]);
  });

  it("reports database outages on the health check", async () => {
    resetDb();
    mockQuery(() => [new Error("ECONNREFUSED"), null]);
    const res = await request(app).get("/api/health");
    assert.equal(res.status, 500);
    assert.equal(res.body.success, false);
  });

  it("marks 4xx AppErrors as fail", () => {
    const err = new AppError("Bad input", 422, "VALIDATION_ERROR");
    assert.equal(err.status, "fail");
    assert.equal(err.isOperational, true);
  });
});
