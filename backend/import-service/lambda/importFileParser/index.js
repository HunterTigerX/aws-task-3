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
        const bucket = event.Records[0].s3.bucket.name;
        const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));

        if (!key.startsWith('uploaded/')) {
            console.log('File not in uploaded folder. Skipping processing.');
            return;
        }

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

        // Move file to parsed folder
        const newKey = key.replace('uploaded/', 'parsed/');
        
        // Copy the file to the new location
        await s3Client.copyObject({
            Bucket: bucket,
            CopySource: `${bucket}/${key}`,
            Key: newKey
        }).promise();

        // Delete the original file
        await s3Client.deleteObject({
            Bucket: bucket,
            Key: key
        }).promise();

        console.log(`Successfully moved file from ${key} to ${newKey}`);

        return createResponse(
            200,
            { body: "CSV processing completed successfully and file moved to parsed folder" }
        );

    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};
