const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "ocr_ktp",
  password: "pakepake",
  port: 5432,
});

module.exports = pool;
