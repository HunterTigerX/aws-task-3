const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers":"Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
  "Content-Type": "application/json",
};

const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log(
    "getProductsAll lambda invoked with event:",
    JSON.stringify(event)
  );

  const createResponse = (statusCode, body) => ({
    statusCode,
    headers,
    body: JSON.stringify(body),
  });

  try {
    const [productData, stockData] = await Promise.all([
      docClient.send(
        new ScanCommand({
          TableName: process.env.PRODUCTS_TABLE,
        })
      ),
      docClient.send(
        new ScanCommand({
          TableName: process.env.STOCKS_TABLE,
        })
      ),
    ]);

    const product = productData.Items.map((product) => ({
      ...product,
      count:
        stockData.Items.find((stock) => stock.product_id === product.id)
          ?.count || 0,
    }));

    // Input validation
    if (!Array.isArray(product)) {
      throw new Error("Products data is not properly formatted");
    }

    // Log request details
    console.log("Request received:", {
      requestId: event?.requestContext?.requestId,
      timestamp: new Date().toISOString(),
    });

    // Return products list
    return createResponse(200, product);
  } catch (error) {
    // Enhanced error logging
    console.error("Error in getProductsList:", {
      error: error.message,
      stack: error.stack,
      requestId: event?.requestContext?.requestId,
    });

    return createResponse(500, {
      message: "Internal server error at get product list",
      requestId: event?.requestContext?.requestId,
    });
  }
};
