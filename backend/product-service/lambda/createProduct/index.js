const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  TransactWriteCommand,
} = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require("uuid");

const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers":"Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
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

  if (event.httpMethod === "OPTIONS") {
    return createResponse(200, "");
  }

  if (!event.body) {
    return createResponse(
      400,
      ({ message: "Request body is required" })
    );
  }

  try {
    let requestBody;
    try {
      requestBody = JSON.parse(event.body);
    } catch (parseError) {
      return createResponse(
        400,
        ({ message: "Invalid JSON in request body" })
      );
    }

    const { title, description, price, count } = requestBody;
    console.log("Parsed body:", { title, description, price, count });

    if (!title || typeof price !== "number" || typeof count !== "number") {
      return createResponse(
        400,
        ({ message: "Invalid product data" })
      );
    }

    const productId = uuidv4();

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

    console.log("Transaction params:", JSON.stringify(transactParams, null, 2));

    try {
      await docClient.send(new TransactWriteCommand(transactParams));
    } catch (dbError) {
      console.error("Database error:", dbError);
      throw new Error("Failed to save to database");
    }
    console.log("Transaction in createProduct is uccessful");
    return createResponse(
      201,
      {
        id: productId,
        title,
        description,
        price,
        count,
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return createResponse(
      500,
      ({ message: "Internal server error" })
    );
  }
};
