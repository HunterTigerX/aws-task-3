// const AWSMock = require("aws-sdk-mock");
// const AWS = require("aws-sdk");
// // Set up the mock before tests
// AWSMock.setSDKInstance(AWS);

// const { handler } = require("./index");

// describe("Lambda function", () => {
//   const defaultHeaders = {
//     "Access-Control-Allow-Origin": "*",
//     "Access-Control-Allow-Methods": "GET",
//     "Access-Control-Allow-Headers": "Content-Type",
//     "Content-Type": "application/json",
//   };

//   test("should handle", async () => {
//     // Mock specific S3 operations
//     AWSMock.mock("S3", "getObject", (params, callback) => {
//       // Mock implementation
//       callback(null, {
//         Body: "mocked data",
//         // other properties as needed
//       });
//     });

//     // For streaming operations
//     AWSMock.mock("S3", "getObject", (params, callback) => {
//       const { Readable } = require("stream");
//       const mockStream = new Readable();
//       mockStream._read = () => {};

//       callback(null, {
//         createReadStream: () => mockStream,
//       });
//     });

//     // Example of mocking putObject
//     AWSMock.mock("S3", "putObject", (params, callback) => {
//       callback(null, { ETag: "mockETag" });
//     });

//     const event = { httpMethod: 'OPTIONS' };
//     const response = await handler(event);
//     console.log('response', response)
//     // const bucket = event.Records[0].s3Client.bucket.name;
//     // const key = decodeURIComponent(event.Records[0].s3Client.object.key.replace(/\+/g, ' '));


//     console.log(bucket, key)
//     expect("").toBe("");

//     // Restore mocks after test
//     AWSMock.restore();
//     // const event = { httpMethod: "OPTIONS" };
//     // const response = await handler(event);

//     // expect(response.statusCode).toBe(200);
//     // expect(response.headers).toEqual(defaultHeaders);
//   });
// });

const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

// Mock the AWS SDK modules
jest.mock("@aws-sdk/client-s3");
jest.mock("@aws-sdk/s3-request-presigner");

const { handler } = require("./index");

describe("importProductsFile Lambda", () => {
  // Setup environment variable
  beforeEach(() => {
    process.env.BUCKET_NAME = "XXXXXXXXXXX";
  });

  // Clear all mocks after each test
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return signed URL when valid filename is provided", async () => {
    // Mock implementation
    getSignedUrl.mockResolvedValue("https://fake-signed-url.com");

    const event = {
      queryStringParameters: {
        name: "test.csv"
      }
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toBe("https://fake-signed-url.com");
    expect(PutObjectCommand).toHaveBeenCalledWith({
      Bucket: "XXXXXXXXXXX",
      Key: "uploaded/test.csv",
      ContentType: "text/csv"
    });
  });

  it("should return 400 when filename is missing", async () => {
    const event = {
      queryStringParameters: {}
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toEqual({ error: "Filename is required" });
  });

  it("should return 500 when S3 operation fails", async () => {
    getSignedUrl.mockRejectedValue(new Error("S3 Error"));

    const event = {
      queryStringParameters: {
        name: "test.csv"
      }
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(500);
    expect(response.body).toEqual(JSON.stringify({ error: "Failed to generate signed URL" }));
  });

  it("should include correct CORS headers in response", async () => {
    getSignedUrl.mockResolvedValue("https://fake-signed-url.com");

    const event = {
      queryStringParameters: {
        name: "test.csv"
      }
    };

    const response = await handler(event);

    expect(response.headers).toEqual({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json"
    });
  });
});
