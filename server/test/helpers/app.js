// Loads the Express app with the MySQL pool replaced by an in-memory stub,
// so API tests run without a database.
const path = require("path");

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret";
process.env.LOG_LEVEL = "error";
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "sk_test_dummy";

// Each test pushes handlers; the stub answers queries in order.
const handlers = [];
const queries = [];

const dbStub = {
  query(sql, params, callback) {
    if (typeof params === "function") {
      callback = params;
      params = [];
    }
    queries.push({ sql, params });
    const handler = handlers.shift();
    const [err, rows] = handler ? handler(sql, params) : [null, []];
    if (callback) setImmediate(() => callback(err, rows));
  },
  config: {},
};

const dbPath = require.resolve(path.join(__dirname, "../../config/database.js"));
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: dbStub };

const app = require("../../app");

function mockQuery(handler) {
  handlers.push(handler);
}

function resetDb() {
  handlers.length = 0;
  queries.length = 0;
}

module.exports = { app, mockQuery, resetDb, queries };
