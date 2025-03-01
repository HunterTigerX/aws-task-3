const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  GetCommand,
  ScanCommand,
} = require("@aws-sdk/lib-dynamodb");

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Credentials": true,
  "Content-Type": "application/json",
};

const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log(
    "getProductById lambda invoked with event:",
    JSON.stringify(event)
  );

  const createResponse = (statusCode, body) => ({
    statusCode,
    headers,
    body: JSON.stringify(body),
  });

  if (event.httpMethod === "OPTIONS") {
    return createResponse(200, "");
  }

  try {
    const productId = event.pathParameters?.productId;
    console.log("productId", productId);
    
    if (!productId) {
      return createResponse(400, { message: "Product ID is required" });
    }

    // Get specific product
    const productResult = await docClient.send(
      new GetCommand({
        TableName: process.env.PRODUCTS_TABLE,
        Key: {
          id: productId
        }
      })
    );

    // Get stock for the product
    const stockResult = await docClient.send(
      new GetCommand({
        TableName: process.env.STOCKS_TABLE,
        Key: {
          product_id: productId
        }
      })
    );

    if (!productResult.Item) {
      return createResponse(404, { message: "Product not found" });
    }

    // Combine product with its stock
    const product = {
      ...productResult.Item,
      count: stockResult.Item?.count || 0
    };

    return createResponse(200, product);
  } catch (error) {
    console.error("Error:", error);
    return createResponse(500, { message: "Internal server error" });
  }
};
