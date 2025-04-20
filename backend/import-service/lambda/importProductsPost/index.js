const axios = require("axios");
const { json2csv } = require("json-2-csv");

exports.handler = async (event) => {
  console.log("POST request received:", JSON.stringify(event));

  try {
    const getSignedUrl = async (csvKey, csvFileName, cleanHeaders) => {
      try {
        const response = await axios({
          method: "GET",
          url: `https://tnj6bqz37j.execute-api.eu-central-1.amazonaws.com/prod/import?${csvKey}=${csvFileName}`,
          headers: cleanHeaders,
        });
        return response.data; // This is the signed URL
      } catch (error) {
        console.error("Error getting signed URL:", error);
        throw error;
      }
    };

    // Then upload the file using the signed URL
    const uploadToS3 = async (signedUrl, csvContent) => {
      try {
        await axios({
          method: "PUT",
          url: signedUrl,
          data: csvContent,
        });
        console.log("File uploaded successfully");
      } catch (error) {
        console.error("Error uploading file:", error);
        throw error;
      }
    };

    try {
      const data = JSON.parse(event.body);
      // Get signed URL
      const signedUrl = await getSignedUrl(
        data.csvKey,
        data.csvFileName,
        data.cleanHeaders
      );
      await uploadToS3(signedUrl, data.csv);
      return {
        status: 200,
        data: { message: "File uploaded successfully" },
      };
    } catch (error) {
      console.error("Upload failed:");
    }
  } catch (error) {
    console.error("Error:", error);

    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        message: "Error processing POST request",
        error: error.message,
      }),
    };
  }
};
