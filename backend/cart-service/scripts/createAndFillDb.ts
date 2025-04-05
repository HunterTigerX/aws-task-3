const { Client } = require("pg");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");
dotenv.config();

async function createDatabase() {
  // First connect to the default 'postgres' database
  const client = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || "5432"),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: "postgres", // Connect to default database
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();
    // Check if database exists
    const checkDb = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      ["cartdb"]
    );

    if (checkDb.rows.length === 0) {
      // Create the database if it doesn't exist
      await client.query("CREATE DATABASE cartdb");
      console.log("Database 'cartdb' created successfully");
    }
  } catch (error) {
    console.error("Error creating database:", error);
  } finally {
    await client.end();
  }
}

async function runSql() {
  // Now connect to the cartdb database
  const client = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || "5432"),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: "cartdb", // Connect to cartdb
    ssl: {
      rejectUnauthorized: false,
    },
  });

  const sql = fs.readFileSync(path.join(__dirname, "./create.sql")).toString();
  const sql2 = fs.readFileSync(path.join(__dirname, "./fill.sql")).toString();

  try {
    await client.connect();

    try {
      await client.query(sql);
      console.log("SQL script 1 executed successfully");
    } catch (error) {
      console.error("Error executing SQL script 1:", error);
    }

    try {
      await client.query(sql2);
      console.log("SQL script 2 executed successfully");
    } catch (error) {
      console.error("Error executing SQL script 2:", error);
    }
  } catch (error) {
    console.error("Error executing SQL scripts:", error);
  } finally {
    await client.end();
  }
}

// Run the scripts
async function initialize() {
  await createDatabase();
  await runSql();
}

initialize();
