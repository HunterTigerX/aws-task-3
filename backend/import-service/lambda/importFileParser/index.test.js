const AWS = require("aws-sdk");
const sinon = require("sinon");
const { Readable } = require("stream");
const { handler } = require("./index.js");
const awsMock = require("aws-sdk-mock");

const event = {
  Records: [
    {
      eventSource: "aws:s3",
      awsRegion: "eu-central-1",
      s3: {
        bucket: {
          name: "test-bucket",
        },
        object: {
          key: "uploaded/test.csv",
        },
      },
    },
  ],
};

process.env.SQS_QUEUE_URL = "test-queueUrl";
process.env.SNS_TOPIC_ARN = "test-topic-arn";

// Mocking AWS.S3
jest.mock("aws-sdk", () => {
  const mockS3 = {
    getObject: jest.fn().mockReturnThis(),
    headObject: jest.fn().mockReturnThis(),
    copyObject: jest.fn().mockReturnThis(),
    deleteObject: jest.fn().mockReturnThis(),
    createReadStream: jest.fn().mockReturnThis(),
    promise: jest.fn(),
  };
  return {
    S3: jest.fn(() => mockS3),
    SQS: jest.fn(() => ({
      promise: jest.fn(),
      sendMessageBatch: jest.fn().mockReturnThis(),
    })),
  };
});

// Mocking csv-parser
jest.mock("csv-parser", () => {
  let mockS3Client;
  let mockSQS;
  let mockReadStream;

  return jest.fn(() => ({
    on: jest.fn().mockImplementation((event, callback) => {
      if (event === "data") {
        callback({ column1: "value1", column2: "value2" });
        callback({ column1: "value3", column2: "value4" });
      }
      if (event === "end") {
        callback();
      }
      return {
        on: jest.fn(),
      };
    }),
  }));
});

describe("importFileParser", () => {
  afterEach(() => {
    awsMock.restore("S3");
    awsMock.restore("SQS");
    jest.clearAllMocks();
    jest.resetModules()
  });

  

  it("should process CSV file correctly", async () => {
    s3Client = new AWS.S3();

    const mockStream = {
      pipe: jest.fn().mockReturnThis(),
      on: jest.fn().mockImplementation((event, callback) => {
        if (event === "data") {
          callback({ column1: "value1", column2: "value2" });
          callback({ column1: "value3", column2: "value4" });
        }
        if (event === "end") {
          callback();
        }
        return mockStream;
      }),
    };
    s3Client.createReadStream.mockReturnValue(mockStream);

    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body).body).toBe(
      "CSV processing completed successfully and file moved to parsed folder"
    );
  });
  
  it("should skip processing if file is not in uploaded folder", async () => {
    const event = {
      Records: [
        {
          s3: {
            bucket: { name: "test-bucket" },
            object: { key: "other/test.csv" },
          },
        },
      ],
    };

    const consoleSpy = sinon.spy(console, "log");
    await handler(event);

    expect(
      consoleSpy.calledWith("File not in uploaded folder. Skipping processing.")
    ).toBeTruthy();
  });
 
  
  it("should handle errors during CSV processing", async () => {
    // Mocking createReadStream to throw
    const mockStream = {
      pipe: jest.fn().mockReturnThis(),
      on: jest.fn().mockImplementation((event, callback) => {
        if (event === "error") {
          callback(new Error("Failed to read file"));
        }
        return mockStream;
      }),
    };
    s3Client.createReadStream.mockReturnValue(mockStream);

    await expect(handler(event)).rejects.toThrow("Failed to read file");
  });

  it("should throw an error if SQS_QUEUE_URL is not set", async () => {
    // Delete the environment variable to simulate it not being set
    delete process.env.SQS_QUEUE_URL;

    // Ensure the handler throws the expected error
    await expect(handler(event)).rejects.toThrow(
      "SQS_QUEUE_URL environment variable is not set"
    );
    process.env.SQS_QUEUE_URL = "test-queueUrl";
  });

  it("should handle errors when sending the final batch to SQS fails", async () => {
    const s3Client = new AWS.S3();
    const sqs = new AWS.SQS();

    sqs.sendMessageBatch.mockImplementation(() => ({
      promise: jest
        .fn()
        .mockResolvedValueOnce({}) // Первый вызов (если есть) успешен
        .mockRejectedValue(new Error("Error sending batch to SQS")),
    }));

    const mockStream = {
      pipe: jest.fn().mockReturnThis(),
      on: jest.fn().mockImplementation((event, callback) => {
        if (event === "data") {
          callback({ title: "Product1", price: 100 });
          callback({ title: "Product2", price: 200 });
        }
        if (event === "end") {
          callback();
        }
        return mockStream;
      }),
    };

    s3Client.createReadStream.mockReturnValue(mockStream);

    s3Client.copyObject.mockImplementation(() => ({
      promise: jest
        .fn()
        .mockRejectedValue(new Error("Error sending batch to SQS")),
    }));

    await expect(handler(event)).rejects.toThrow("Error sending batch to SQS");
  });

  it("should reject when batch of 10 messages fails (lines 80-84)", async () => {
    const sqs = new AWS.SQS();
    const s3Client = new AWS.S3();

    const mockStream = {
      pipe: jest.fn().mockReturnThis(),
      on: jest.fn().mockImplementation((event, callback) => {
        if (event === "data") {
          for (let i = 0; i < 11; i++) {
            callback({ id: i, title: `Product${i}` });
          }
        }
        if (event === "end") {
          callback();
        }
        return mockStream;
      }),
    };

    sqs.sendMessageBatch.mockImplementation(() => ({
      promise: jest
        .fn()
        .mockRejectedValueOnce(new Error("Error sending batch to SQS"))
        .mockResolvedValue({}),
    }));

    s3Client.createReadStream.mockReturnValue(mockStream);

    await expect(handler(event)).rejects.toThrow("Error sending batch to SQS");
  });

  it("should reject when final batch fails with return", async () => {
    const sqs = new AWS.SQS();
    const s3Client = new AWS.S3();

    const mockStream = {
      pipe: jest.fn().mockReturnThis(),
      on: jest.fn().mockImplementation((event, callback) => {
        if (event === "data") {
          callback({ id: 1, title: "Product1" });
          callback({ id: 2, title: "Product2" });
        }
        if (event === "end") {
          callback();
        }
        return mockStream;
      }),
    };

    sqs.sendMessageBatch.mockImplementation(() => ({
      promise: jest.fn().mockRejectedValue(new Error("Final batch failed")),
    }));

    s3Client.createReadStream.mockReturnValue(mockStream);

    s3Client.copyObject.mockImplementation(() => ({
      promise: jest.fn().mockRejectedValue(new Error("Final batch failed")),
    }));

    await expect(handler(event)).rejects.toThrow("Final batch failed");
  });

  it("should handle errors when file does not exist in the bucket", async () => {
    const s3Client = new AWS.S3();
    s3Client.headObject.mockImplementation(() => ({
      promise: jest.fn().mockRejectedValue(new Error("File not found")),
    }));

    await expect(handler(event)).rejects.toThrow(
      "File uploaded/test.csv does not exist in bucket test-bucket"
    );
    jest.clearAllMocks();
  });
});
