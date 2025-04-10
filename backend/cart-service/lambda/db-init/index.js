const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

exports.handler = async (event, context) => {
  console.log("Event:", JSON.stringify(event));

  const host = process.env.DB_HOST;
  const port = parseInt(process.env.DB_PORT || "5432");
  const user = process.env.DB_USERNAME;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME;

  console.log("DB_HOST:", process.env.DB_HOST);
  console.log("DB_PORT:", process.env.DB_PORT);
  console.log("DB_USERNAME:", process.env.DB_USERNAME);
  console.log("DB_PASSWORD:", process.env.DB_PASSWORD);
  console.log("DB_NAME:", process.env.DB_NAME);

  // Handle delete event
  if (event.RequestType === "Delete") {
    return {
      PhysicalResourceId: event.PhysicalResourceId,
      Status: "SUCCESS",
    };
  }

  async function createDatabase() {
    // Connecting to the default 'postgres' database
    const client = new Client({
      host,
      port,
      user,
      password,
      database,
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
    // Connecting to the default 'postgres' database
    const client = new Client({
      host,
      port,
      user,
      password,
      database,
      ssl: {
        rejectUnauthorized: false,
      },
    });

    const sql = fs
      .readFileSync(path.join(__dirname, "./create.sql"))
      .toString();
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
        console.error("Error executing SQL script2:", error);
      }
    } catch (error) {
      console.error("Error executing one of the SQL scripts:", error);
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
};
