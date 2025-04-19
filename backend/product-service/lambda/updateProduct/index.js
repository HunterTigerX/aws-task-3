const { DynamoDB } = require("@aws-sdk/client-dynamodb");
const {
    DynamoDBDocument,
    TransactWriteCommand,
  } = require("@aws-sdk/lib-dynamodb");
const dotenv = require("dotenv");
const { Client } = require("pg");
dotenv.config();

const docClient = DynamoDBDocument.from(new DynamoDB());
  
async function updateProductInRDS(productId, updatedData) {
    const rdsClient = new Client({
      host: process.env.DB_HOST || "cartdb.czwk442a8alq.eu-central-1.rds.amazonaws.com",
      port: parseInt(process.env.DB_PORT || "5432"),
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: "cartdb",
      ssl: {
        rejectUnauthorized: false,
      },
    });
  
    const { title, description, price, imgurl } = updatedData;
  
    // Dynamically build UPDATE query based on presence of imgurl
    let updateFields = ['title = $2', 'description = $3', 'price = $4'];
    let queryValues = [productId, title, description, price];
  
    if (imgurl !== undefined) {
      updateFields.push('imgurl = $5');
      queryValues.push(imgurl);
    }
  
    // PostgreSQL Update Query
    const pgQuery = {
      text: `UPDATE products 
             SET ${updateFields.join(', ')} 
             WHERE id = $1`,
      values: queryValues,
    };
  
    try {
      await rdsClient.connect();
      await rdsClient.query("BEGIN");
  
      const result = await rdsClient.query(pgQuery);
  
      if (result.rowCount === 0) {
        throw new Error("Product not found in RDS");
      }
  
      await rdsClient.query("COMMIT");
    } catch (error) {
      console.error("Error updating product in RDS:", error);
      await rdsClient.query("ROLLBACK");
      throw error;
    } finally {
      await rdsClient.end();
    }
  }

exports.handler = async (event) => {
    console.log('Entering updateProduct')
  try {
    const body = JSON.parse(event.body);
    const productId = body.id;

    // Validate input
    if (!body.title || !body.description || !body.price || !body.count) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ message: "Missing required fields" }),
      };
    }

    // Update both products and stocks tables in a transaction
    const transactParams = {
        TransactItems: [
          {
            Update: {
              TableName: process.env.PRODUCTS_TABLE,
              Key: { id: productId },
              UpdateExpression: body.imgurl 
                ? "set title = :title, description = :description, price = :price, imgurl = :imgurl"
                : "set title = :title, description = :description, price = :price",
              ExpressionAttributeValues: {
                ":title": body.title,
                ":description": body.description,
                ":price": body.price,
                ...(body.imgurl && { ":imgurl": body.imgurl })
              },
              ConditionExpression: "attribute_exists(id)",
            },
          },
          {
            Update: {
              TableName: process.env.STOCKS_TABLE,
              Key: { product_id: productId },
              UpdateExpression: "set #count = :count",
              ExpressionAttributeNames: {
                "#count": "count",
              },
              ExpressionAttributeValues: {
                ":count": body.count,
              },
              ConditionExpression: "attribute_exists(product_id)",
            },
          },
        ],
      };

    await docClient.send(new TransactWriteCommand(transactParams));

    // Update RDS
    try {
      await updateProductInRDS(productId, {
        title: body.title,
        description: body.description,
        price: body.price,
        imgurl: body.imgurl,
      });
    } catch (rdsError) {
      console.error("Failed to update RDS:", rdsError);
    }

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        body
      }),
    };
  } catch (error) {
    console.error("Error:", error);

    if (error.name === "ConditionalCheckFailedException") {
      return {
        statusCode: 404,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ message: "Product not found" }),
      };
    }

    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ message: "Internal server error at update product" }),
    };
  }
};
