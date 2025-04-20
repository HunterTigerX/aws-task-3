const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns"); 
const {
  DynamoDBDocumentClient,
  TransactWriteCommand,
} = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require("uuid");
const { Client } = require("pg");
const dotenv = require("dotenv");
dotenv.config();

const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);
const snsClient = new SNSClient(); // This should work now



async function createProduct(body, productId) {
  const rdsClient = new Client({
    host:
      process.env.DB_HOST || "cartdb.czwk442a8alq.eu-central-1.rds.amazonaws.com",
    port: parseInt(process.env.DB_PORT || "5432"),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: "cartdb",
    ssl: {
      rejectUnauthorized: false,
    },
  });

  if (typeof body === 'string') {
    body = JSON.parse(body);
  }
  const title = body["title"];
  const description = body["description"];
  const price = body["price"];
  const imgurl = body["imgurl"];

  // PostgreSQL Query
  const pgQuery = {
    text: `INSERT INTO products(id, title, description, price, imgurl) 
           VALUES($1, $2, $3, $4, $5)`,
    values: [productId, title, description, price, imgurl],
  };

  try {
    // Connect to PostgreSQL
    await rdsClient.connect();

    // Start transaction
    await rdsClient.query("BEGIN");
    
    // Execute PostgreSQL query
    await rdsClient.query(pgQuery);
    
    // Commit transaction if both succeed
    await rdsClient.query("COMMIT");
    return productId;
  } catch (error) {
    // Rollback on error
    console.error("Error creating product:", error);
    await rdsClient.query("ROLLBACK");
    await rdsClient.end();
    throw error;
  } finally {
    // Close connection
    console.log("success");
    await rdsClient.end();
  }
}

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
  "Content-Type": "application/json",
};

exports.handler = async (event) => {
  console.log(
    "createProduct lambda invoked with event:",
    JSON.stringify(event)
  );

  const createResponse = (statusCode, body) => ({
    statusCode,
    headers,
    body: JSON.stringify(body),
  });

  console.log("Starting Processing");
  try {
    // Process each message from SQS
    for (const record of event.Records) {
      console.log("Processing record:", record.messageId);
      console.log("Raw message body:", record.body);
      console.log("Processing SQS record:", record);
      const productId = uuidv4();

      try {
        await createProduct(record.body, productId);
      } catch (error) {
        console.log("error adding record to the RDS", error);
      }
      let product;
      try {
        product = JSON.parse(record.body);
      } catch (parseError) {
        console.error("Failed to parse message:", parseError);
        continue;
      }

      // Converting price and count to numbers
      product.price = Number(product.price);
      product.count = Number(product.count);

      const { title, description, price, count, imgurl } = product;

      if (
        !title ||
        typeof price !== "number" ||
        typeof count !== "number" ||
        !imgurl
      ) {
        console.error("Invalid product data:", product);
        continue;
      }

      console.log("Generated product ID:", productId);

      const transactParams = {
        TransactItems: [
          {
            Put: {
              TableName: process.env.PRODUCTS_TABLE,
              Item: {
                id: productId,
                title,
                description,
                price,
                imgurl,
              },
            },
          },
          {
            Put: {
              TableName: process.env.STOCKS_TABLE,
              Item: {
                product_id: productId,
                count,
              },
            },
          },
        ],
      };

      try {
        // Save to database
        await docClient.send(new TransactWriteCommand(transactParams));

        // Send SNS notification
        await snsClient.send(
          new PublishCommand({
            TopicArn: process.env.SNS_TOPIC_ARN,
            Message: JSON.stringify({
              id: productId,
              title,
              description,
              price,
              count,
              imgurl,
            }),
            MessageAttributes: {
              price: {
                DataType: "Number",
                StringValue: price.toString(),
              },
            },
          })
        );
      } catch (error) {
        console.error("Error processing product:", error);
        throw error; // This will cause SQS to retry the message
      }
    }
    console.log("Product in catalogBatchProcess processed successfully:");
    return createResponse(
      200,
      JSON.stringify({ message: "Products processed successfully" })
    );
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};
