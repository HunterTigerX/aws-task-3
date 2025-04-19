const AWS = require("aws-sdk");
const { Client } = require("pg");
const docClient = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
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

  async function deleteProduct(productId) {
    try {
      // First check if the product exists
      const getParams = {
        TableName: "products",
        Key: {
          id: productId,
        },
      };

      const existingProduct = await docClient.get(getParams).promise();

      if (!existingProduct.Item) {
        return {
          success: false,
          message: `Product ${productId} not found in database`,
          statusCode: 404,
        };
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

      // Delete both product and its stock
      await Promise.all([
        docClient.delete(deleteParams).promise(),
        docClient.delete(deleteStockParams).promise(),
      ]);

      try {
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

        // Delete from DynamoDB products table
        const deleteParams = {
          TableName: "products",
          Key: {
            id: productId,
          },
        };

        // Delete from DynamoDB stocks table
        const deleteStockParams = {
          TableName: "stocks",
          Key: {
            product_id: productId,
          },
        };

        // Delete both product and its stock from DynamoDB
        await Promise.all([
          docClient.delete(deleteParams).promise(),
          docClient.delete(deleteStockParams).promise(),
        ]);

        return {
          success: true,
          message: `Product ${productId} deleted successfully`,
          statusCode: 200,
        };
      } catch (error) {
        // Rollback the transaction if there's an error
        await rdsClient.query("ROLLBACK");
        throw error;
      }
    } catch (error) {
      console.error(`Error deleting product ${productId}:`, error);
      return {
        success: false,
        message: `Error deleting product: ${error.message}`,
        statusCode: 500,
      };
    } finally {
      // Close the RDS connection
      if (rdsClient) {
        await rdsClient.end();
      }
    }
  }
  try {
    const body = JSON.parse(event.body);

    return await deleteProduct(body.productId);
  } catch (error) {
    console.error("Error deleting product:", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ message: "Error deleting product" }),
    };
  }
};
