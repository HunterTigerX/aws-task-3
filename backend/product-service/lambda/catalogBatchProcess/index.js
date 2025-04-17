const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns"); // Make sure this package is in your dependencies
const {
  DynamoDBDocumentClient,
  TransactWriteCommand,
} = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require("uuid");

const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);
const snsClient = new SNSClient(); // This should work now

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

  console.log("Starting Processing");
  try {
    // Process each message from SQS
    for (const record of event.Records) {
      console.log("Processing record:", record.messageId);
      console.log("Raw message body:", record.body);
      console.log("Processing SQS record:", record);
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
      console.log('product description', product.description)
      console.log('product title', product.title)
      console.log('product count', product.count)
      console.log('product price', product.price)
      
      const { title, description, price, count, imgurl } = product;

      if (!title || typeof price !== "number" || typeof count !== "number" || !imgurl) {
        console.error("Invalid product data:", product);
        continue;
      }

      const productId = uuidv4();
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
                imgurl
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
              imgurl
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
