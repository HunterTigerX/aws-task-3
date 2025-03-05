const AWS = require("aws-sdk");

const { products } = require("./mockData");

AWS.config.update({ region: "eu-central-1" }); // Update region if required

const dynamodb = new AWS.DynamoDB();
const docClient = new AWS.DynamoDB.DocumentClient();

async function createTables() {
  const productsTableParams = {
    TableName: "products",
    KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
    AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
    BillingMode: "PAY_PER_REQUEST",
  };

  const stocksTableParams = {
    TableName: "stocks",
    KeySchema: [{ AttributeName: "product_id", KeyType: "HASH" }],
    AttributeDefinitions: [{ AttributeName: "product_id", AttributeType: "S" }],
    BillingMode: "PAY_PER_REQUEST",
  };

  try {
    // Check if tables exist
    const existingTables = await dynamodb.listTables().promise();

    if (!existingTables.TableNames.includes("products")) {
      await dynamodb.createTable(productsTableParams).promise();
      console.log("Products table created successfully");
    } else {
      console.log("Products table already exists");
    }

    if (!existingTables.TableNames.includes("stocks")) {
      await dynamodb.createTable(stocksTableParams).promise();
      console.log("Stocks table created successfully");
    } else {
      console.log("Stocks table already exists");
    }
  } catch (error) {
    console.error("Error creating tables:", error);
    throw error;
  }
}

async function seedData() {
  const stocks = [];

  async function fillStocks() {
    for (let i = 0; i < products.length; i++) {
      stocks.push({
        product_id: products[i].id,
        count: Math.floor(Math.random() * 100) + 1,
      });
    }
    return Promise.resolve();
  }

  await fillStocks();

  try {
    console.log(stocks[0], "Stonks");
    console.log("Starting to seed data...");

    for (const product of products) {
      await docClient
        .put({
          TableName: "products",
          Item: product,
        })
        .promise();
      // console.log(`Added product: ${product.title}`);
    }

    for (const stock of stocks) {
      await docClient
        .put({
          TableName: "stocks",
          Item: stock,
        })
        .promise();
      // console.log(`Added stock for product: ${stock.product_id}`);
    }

    console.log("Data seeded successfully");
  } catch (error) {
    console.error("Error seeding data:", error);
    throw error;
  }
}

async function waitForTableActive(tableName) {
  console.log(`Waiting for table ${tableName} to become active...`);
  while (true) {
    const { Table } = await dynamodb
      .describeTable({ TableName: tableName })
      .promise();
    if (Table.TableStatus === "ACTIVE") {
      console.log(`Table ${tableName} is now active`);
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

async function main() {
  try {
    await createTables();
    // Wait for both tables to be active
    await Promise.all([
      waitForTableActive("products"),
      waitForTableActive("stocks"),
    ]);
    await seedData();
    console.log("Setup completed successfully");
  } catch (error) {
    console.error("Setup failed:", error);
    process.exit(1);
  }
}

main();
