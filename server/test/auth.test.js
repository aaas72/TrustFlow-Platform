const { describe, it, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const request = require("supertest");
const { app, mockQuery, resetDb, queries } = require("./helpers/app");

const validUser = {
  full_name: "Ayşe Yılmaz",
  email: "  Ayse@Example.com ",
  password: "secret123",
  user_type: "freelancer",
};

describe("POST /api/auth/register", () => {
  beforeEach(resetDb);

  it("rejects missing fields", async () => {
    const res = await request(app).post("/api/auth/register").send({ email: "a@b.co" });
    assert.equal(res.status, 400);
    assert.equal(queries.length, 0);
  });

  it("rejects an invalid email", async () => {
    const res = await request(app).post("/api/auth/register").send({ ...validUser, email: "not-an-email" });
    assert.equal(res.status, 400);
  });

  it("does not allow signing up as admin", async () => {
    const res = await request(app).post("/api/auth/register").send({ ...validUser, user_type: "admin" });
    assert.equal(res.status, 400);
    assert.equal(queries.length, 0, "no database access for rejected sign-ups");
  });

  it("returns 409 when the email is already registered", async () => {
    mockQuery(() => [null, [{ id: 1 }]]);
    const res = await request(app).post("/api/auth/register").send(validUser);
    assert.equal(res.status, 409);
  });

  it("creates the user with a normalized email and a hashed password", async () => {
    mockQuery(() => [null, []]);
    mockQuery(() => [null, { insertId: 42 }]);

    const res = await request(app).post("/api/auth/register").send(validUser);

    assert.equal(res.status, 201);
    assert.equal(res.body.user_id, 42);
    const [, email, hash, type] = queries[1].params;
    assert.equal(email, "ayse@example.com");
    assert.equal(type, "freelancer");
    assert.notEqual(hash, validUser.password);
    assert.ok(bcrypt.compareSync(validUser.password, hash));

    const payload = jwt.verify(res.body.token, "test-secret");
    assert.deepEqual([payload.id, payload.user_type], [42, "freelancer"]);
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(resetDb);
  const stored = {
    id: 7,
    full_name: "Ali Kaya",
    email: "ali@example.com",
    user_type: "client",
    password: bcrypt.hashSync("correct-horse", 4),
  };

  it("requires email and password", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "ali@example.com" });
    assert.equal(res.status, 400);
  });

  it("returns 401 for an unknown email", async () => {
    mockQuery(() => [null, []]);
    const res = await request(app).post("/api/auth/login").send({ email: "nobody@example.com", password: "x" });
    assert.equal(res.status, 401);
  });

  it("returns 401 for a wrong password", async () => {
    mockQuery(() => [null, [stored]]);
    const res = await request(app).post("/api/auth/login").send({ email: stored.email, password: "wrong" });
    assert.equal(res.status, 401);
  });

  it("returns a token and never the password hash", async () => {
    mockQuery(() => [null, [stored]]);
    const res = await request(app).post("/api/auth/login").send({ email: "ALI@example.com", password: "correct-horse" });
    assert.equal(res.status, 200);
    assert.equal(res.body.user.id, 7);
    assert.equal(res.body.user.password, undefined);
    assert.equal(jwt.verify(res.body.token, "test-secret").id, 7);
  });
});
