const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

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
          count: productData.count
        }
      };

      try {
        await docClient.send(new PutCommand(params));
        console.log(`Successfully created product: ${productData.id}`);
      } catch (error) {
        console.error(`Error creating product ${productData.id}:`, error);
        throw error;
      }
    });

    await Promise.all(productPromises);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Successfully processed ${event.Records.length} products`
      })
    };
  } catch (error) {
    console.error('Error processing batch:', error);
    throw error;
  }
};
