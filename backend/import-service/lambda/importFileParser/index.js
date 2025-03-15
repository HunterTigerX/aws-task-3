const AWS = require("aws-sdk");
const csv = require("csv-parser");
const s3Client = new AWS.S3();
const sqs = new AWS.SQS();

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

exports.handler = async (event) => {
  console.log(
    "importFileParser lambda invoked with event:",
    JSON.stringify(event)
  );

  const createResponse = (statusCode, body) => ({
    statusCode,
    headers,
    body: JSON.stringify(body),
  });

  try {
    const bucket = event.Records[0].s3.bucket.name;
    let key = decodeURIComponent(
      event.Records[0].s3.object.key.replace("%20", " ").replace(/\+/g, " ")
    );

    // Add debug logging
    console.log(`Attempting to access bucket: ${bucket}, key: ${key}`);

    if (!key.startsWith("uploaded/")) {
      console.log("File not in uploaded folder. Skipping processing.");
      return;
    }

    // Verifying the file exists before attempting to read it
    try {
      await s3Client
        .headObject({
          Bucket: bucket,
          Key: key,
        })
        .promise();
    } catch (headErr) {
      console.log(`File check failed: ${headErr.message}`);
      throw new Error(`File ${key} does not exist in bucket ${bucket}`);
    }

    const s3Stream = s3Client
      .getObject({
        Bucket: bucket,
        Key: key,
      })
      .createReadStream();

    const queueUrl = process.env.SQS_QUEUE_URL;
    if (!queueUrl) {
      throw new Error("SQS_QUEUE_URL environment variable is not set");
    }

    let messagesBatch = [];
    let batchId = 0;

    // Process the CSV file
    await new Promise((resolve, reject) => {
      s3Stream
        .pipe(csv())
        .on("data", async (data) => {
          console.log("Parsed CSV data:", data);
          messagesBatch.push({
            Id: `${batchId++}`,
            MessageBody: JSON.stringify(data),
          });

          // Send in batches of 10 (SQS batch limit)
          if (messagesBatch.length === 10) {
            await sendBatchToSQS(queueUrl, messagesBatch);
            messagesBatch = [];
          }
        })
        .on("error", (error) => {
          reject(error);
        })
        .on("end", async () => {
          // Send any remaining messages
          if (messagesBatch.length > 0) {
            await sendBatchToSQS(queueUrl, messagesBatch);
          }
          resolve();
        });
    });

    // Move file to parsed folder
    const newKey = key.replace("uploaded/", "parsed/");

    // Copy the file to the new location
    await s3Client
      .copyObject({
        Bucket: bucket,
        CopySource: `${bucket}/${encodeURIComponent(key)}`,
        Key: newKey,
      })
      .promise();

    // Delete the original file
    await s3Client
      .deleteObject({
        Bucket: bucket,
        Key: key,
      })
      .promise();

    console.log(
      `Execution of importFileParser was successful. Successfully moved file from ${key} to ${newKey}`
    );

    return createResponse(200, {
      body: "CSV processing completed successfully and file moved to parsed folder",
    });
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

async function sendBatchToSQS(queueUrl, messages) {
  console.log("Sending batch to SQS:", queueUrl);
  const result = await sqs
    .sendMessageBatch({
      QueueUrl: queueUrl,
      Entries: messages,
    })
    .promise();
  console.log("Batch sent successfully:", result);
  return result;
}
