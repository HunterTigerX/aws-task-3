const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3Client = new S3Client({ region: "eu-central-1" }); // Change region if needed

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

exports.handler = async (event) => {
  console.log(
    "importProductsFile lambda invoked with event:",
    JSON.stringify(event)
  );

  const createResponse = (statusCode, body) => ({
    statusCode,
    headers,
    body: JSON.stringify(body),
  });

  try {
    // Get the filename from query parameters
    const fileName = event.queryStringParameters?.name;

    if (!fileName) {
      return createResponse(
        400,
        JSON.stringify({ error: "Filename is required" })
      );
    }

    // Create command for S3 PutObject
    const command = new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: `uploaded/${fileName}`,
      ContentType: "text/csv",
    });

    // Generate signed URL
    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600, // URL expires in 1 hour
    });
    return createResponse(200, signedUrl);
  } catch (error) {
    console.error("Error:", error);
    return createResponse(
      500,
      JSON.stringify({ error: "Failed to generate signed URL" })
    );
  }
};
