const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const { SNS } = require("aws-sdk");

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const sns = new SNS();
const { SNS_TOPIC_ARN } = process.env;

export const handler = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  try {
    const productPromises = event.Records.map(async (record) => {
      const productData = JSON.parse(record.body);

      const params = {
        TableName: process.env.PRODUCTS_TABLE,
        Item: {
          id: productData.id,
          title: productData.title,
          description: productData.description,
          price: productData.price,
          count: productData.count,
        },
      };

      try {
        // Create product in DynamoDB
        await docClient.send(new PutCommand(params));
        console.log(`Successfully created product: ${productData.id}`);

        // Publish to SNS topic
        await sns
          .publish({
            TopicArn: SNS_TOPIC_ARN,
            Message: JSON.stringify({
              message: "Product created successfully",
              product: productData,
            }),
            MessageAttributes: {
              price: {
                DataType: "Number",
                StringValue: productData.price.toString(),
              },
              count: {
                DataType: "Number",
                StringValue: productData.count.toString(),
              },
            },
            Subject: `New Product Created: ${productData.title}`,
          })
          .promise();

        console.log(`SNS notification sent for product: ${productData.id}`);
      } catch (error) {
        console.error(`Error processing product ${productData.id}:`, error);
        throw error;
      }
    });

    await Promise.all(productPromises);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Successfully processed ${event.Records.length} products`,
      }),
    };
  } catch (error) {
    console.error("Error processing batch:", error);
    throw error;
  }
};
