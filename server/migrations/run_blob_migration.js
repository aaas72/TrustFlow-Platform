const fs = require("fs");
const path = require("path");
const mysql = require("mysql2");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

// Create connection
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME,
  multipleStatements: true,
});

const migrationFile = path.join(__dirname, "2025-12-12-add-file-data-blob.sql");

fs.readFile(migrationFile, "utf8", (err, data) => {
  if (err) {
    console.error("Error reading migration file:", err);
    process.exit(1);
  }

  console.log("Running migration...");

  connection.connect((error) => {
    if (error) {
      console.error("Error connecting to database:", error);
      process.exit(1);
    }

    connection.query(data, (err, results) => {
      if (err) {
        console.error("Error executing migration:", err);
        connection.end();
        process.exit(1);
      }

      console.log("Migration executed successfully.");
      connection.end();
    });
  });
});
