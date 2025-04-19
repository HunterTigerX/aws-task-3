const AWS = require("aws-sdk");
const { Client } = require("pg");
const docClient = new AWS.DynamoDB.DocumentClient();
const dotenv = require("dotenv");
dotenv.config();

exports.handler = async (event) => {
  function returnResponse(statusCode, body) {
    return {
      statusCode,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body
    };
  }
  async function deleteProduct(productId) {
    const rdsClient = new Client({
      host:
        process.env.DB_HOST ||
        "cartdb.czwk442a8alq.eu-central-1.rds.amazonaws.com",
      port: parseInt(process.env.DB_PORT || "5432"),
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: "cartdb",
      ssl: {
        rejectUnauthorized: false,
      },
    });

    console.log("process.env.DB_USERNAME", process.env.DB_USERNAME);
    try {
      try {
        console.log("connecting to DynamoDB");
        // First check if the product exists
        const getParams = {
          TableName: "products",
          Key: {
            id: productId,
          },
        };

        const existingProduct = await docClient.get(getParams).promise();
        if (!existingProduct.Item) {
          return returnResponse(404, `Product ${productId} not found in database`);
        }

        // Delete from products table
        const deleteParams = {
          TableName: "products",
          Key: {
            id: productId,
          },
        };

        // Delete from stocks table
        const deleteStockParams = {
          TableName: "stocks",
          Key: {
            product_id: productId,
          },
        };

        console.log("deleting products in DynamoDB");
        // Delete both product and its stock
        await Promise.all([
          docClient.delete(deleteParams).promise(),
          docClient.delete(deleteStockParams).promise(),
        ]);
      } catch (error) {
        console.log("error", error);
      }

      try {
        console.log("connecting to RDS");
        // Connect to RDS
        await rdsClient.connect();

        // Start a transaction for RDS operations
        await rdsClient.query("BEGIN");

        // Delete related cart items first
        await rdsClient.query("DELETE FROM cart_items WHERE product_id = $1", [
          productId,
        ]);

        // Delete the product from RDS
        await rdsClient.query("DELETE FROM products WHERE id = $1", [
          productId,
        ]);

        // Commit the transaction
        await rdsClient.query("COMMIT");

      } catch (error) {
        // Rollback the transaction if there's an error
        await rdsClient.query("ROLLBACK");
        throw error;
      }

      return returnResponse(200, JSON.stringify({
        message: `Product ${productId} deleted successfully`
      }))

    } catch (error) {
      console.error(`Error deleting product ${productId}:`, error);
      return returnResponse(500, `Error deleting product: ${error.message}`)

    } finally {
      // Close the RDS connection
      if (rdsClient) {
        await rdsClient.end();
      }
    }
  }
  try {
    const body = JSON.parse(event.body);
    console.log("Received request body:", body);
    return await deleteProduct(body.productId);
  } catch (error) {
    console.error("Error deleting product:", error);
    return returnResponse(500, JSON.stringify({ message: "Error deleting product" }));
  }
};
