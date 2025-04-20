const AWS = require("aws-sdk");
const { Client } = require('pg');  // Change to PostgreSQL client

AWS.config.update({ region: "eu-central-1" });

const dynamodb = new AWS.DynamoDB();
const docClient = new AWS.DynamoDB.DocumentClient();

// Configure PostgreSQL client
const dbConfig = {
  host: "cartdb.czwk442a8alq.eu-central-1.rds.amazonaws.com",
  user: "postgres",
  password: "postgres",
  database: "cartdb",
  port: 5432,
  ssl: {
    rejectUnauthorized: false
  }
};

async function fetchProductsFromRDS() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('Successfully connected to PostgreSQL');
    
    const result = await client.query('SELECT * FROM products');
    
    // Transform the data to match DynamoDB structure
    return result.rows.map(row => ({
      id: row.id.toString(),
      title: row.title,
      description: row.description,
      price: row.price,
      imgurl: row.imgurl
    }));
  } catch (error) {
    console.error('Error fetching products from RDS:', error);
    throw error;
  } finally {
    await client.end();
  }
}

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


async function clearTable(tableName) {
  try {
    console.log(`Clearing table ${tableName}...`);

    const scanParams = { TableName: tableName };
    const scanResult = await docClient.scan(scanParams).promise();

    if (scanResult.Items.length === 0) {
      console.log(`Table ${tableName} is already empty.`);
      return;
    }

    const batchSize = 25;
    const batches = [];
    for (let i = 0; i < scanResult.Items.length; i += batchSize) {
      batches.push(scanResult.Items.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      const deleteRequests = batch.map(item => ({
        DeleteRequest: { 
          Key: tableName === 'products' 
            ? { id: item.id } 
            : { product_id: item.product_id } 
        }
      }));

      await docClient.batchWrite({
        RequestItems: { [tableName]: deleteRequests }
      }).promise();
    }

    console.log(`Table ${tableName} cleared successfully.`);
  } catch (error) {
    console.error(`Error clearing table ${tableName}:`, error);
    throw error;
  }
}

async function seedData() {
  await clearTable('products');
  await clearTable('stocks');

  try {
    console.log("Starting to fetch and seed data...");
    
    // Fetch products from RDS
    const products = await fetchProductsFromRDS();
    
    // Generate stocks data based on products
    const stocks = products.map(product => ({
      product_id: product.id,
      count: Math.floor(Math.random() * 100) + 1,
    }));

    // Write products to DynamoDB
    for (const product of products) {
      await docClient.put({
        TableName: "products",
        Item: product,
      }).promise();
    }

    // Write stocks to DynamoDB
    for (const stock of stocks) {
      await docClient.put({
        TableName: "stocks",
        Item: stock,
      }).promise();
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

// Add error handling for database connection
async function main() {
  try {
    await createTables();
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
