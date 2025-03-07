const AWS = require('aws-sdk');
const csv = require('csv-parser');
const s3Client = new AWS.S3();

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
        // Get bucket and key from the S3 event - Fixed property path
        const bucket = event.Records[0].s3.bucket.name;
        const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));

        // Ensure we're only processing files from the 'uploaded' folder
        if (!key.startsWith('uploaded/')) {
            console.log('File not in uploaded folder. Skipping processing.');
            return;
        }

        // Get the file stream from S3
        const s3Stream = s3Client.getObject({
            Bucket: bucket,
            Key: key
        }).createReadStream();

        // Process the CSV file
        await new Promise((resolve, reject) => {
            s3Stream
                .pipe(csv())
                .on('data', (data) => {
                    console.log('Parsed record:', JSON.stringify(data));
                })
                .on('error', (error) => {
                    console.error('Error parsing CSV:', error);
                    reject(error);
                })
                .on('end', () => {
                    console.log('Finished processing CSV file');
                    resolve();
                });
        });

        return createResponse(
            200,
            { body: "CSV processing completed successfully" }
        );

    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};
