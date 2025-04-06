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
    database: "cartdb", // Connect to default database
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

  try {
    await client.connect();

    // try {
    // const destroy = fs
    // .readFileSync(path.join(__dirname, "../lambda/db-init/delete.sql"))
    // .toString();
    //   await client.query(destroy);
    //   console.log("SQL script 1 executed successfully");
    // } catch (error) {
    //   console.error("Error executing SQL script to destroy db:", error);
    // }

    try {
      const create = fs
        .readFileSync(path.join(__dirname, "../lambda/db-init/create.sql"))
        .toString();

      await client.query(create);
      console.log("SQL script 1 executed successfully");
    } catch (error) {
      console.error("Error executing SQL script 1:", error);
    }

    try {
      const fill = fs
        .readFileSync(path.join(__dirname, "../lambda/db-init/fill.sql"))
        .toString();
      await client.query(fill);
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
