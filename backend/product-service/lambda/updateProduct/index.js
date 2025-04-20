const { DynamoDB } = require("@aws-sdk/client-dynamodb");
const {
    DynamoDBDocument,
    TransactWriteCommand,
  } = require("@aws-sdk/lib-dynamodb");
const dotenv = require("dotenv");
const { v4: uuidv4 } = require("uuid");
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

  async function createProduct(productId, updatedData) {
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
  
    const { title, description, price, imgurl } = updatedData;

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

  exports.handler = async (event) => {
    console.log('Entering updateProduct')
  try {
    const body = JSON.parse(event.body);
    console.log('event', event);
    console.log('body', body);
    let productId = body.id;


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

    if (productId) {
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



    } else {

      productId = uuidv4();

      const transactParams = {
        TransactItems: [
          {
            Put: {
              TableName: process.env.PRODUCTS_TABLE,
              Item: {
                id: productId,
                title: body.title,
                description: body.description,
                price: body.price,
                imgurl: 'https://raw.githubusercontent.com/HunterTigerX/aws-task-3/75ad6a45ec4ecec2e1a96992f488b9820df71862/assets/tempimg.jpg'
              },
            },
          },
          {
            Put: {
              TableName: process.env.STOCKS_TABLE,
              Item: {
                product_id: productId,
                count: body.count,
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



    // Update RDS
    try {
      await createProduct(productId, {
        title: body.title,
        description: body.description,
        price: body.price,
        imgurl: body.imgurl,
      });
    } catch (rdsError) {
      console.error("Failed to update RDS:", rdsError);
    }
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
