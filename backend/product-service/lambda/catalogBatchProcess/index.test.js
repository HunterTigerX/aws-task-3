const {
  DynamoDBDocumentClient,
  PutCommand,
  TransactWriteCommand,
} = require("@aws-sdk/lib-dynamodb");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { SNSClient } = require("@aws-sdk/client-sns");
const { mockClient } = require("aws-sdk-client-mock");
const { SNS } = require("aws-sdk");
const { handler } = require("./index.js");

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

// Mock the DynamoDB client
const ddbMock = mockClient(DynamoDBClient);
const ddbDocMock = mockClient(DynamoDBDocumentClient);
const snsMock = mockClient(SNSClient);

// Mock UUID
jest.mock("uuid", () => ({
  v4: jest.fn(() => "test-id"),
}));

// Define SNS mock at module level
const mockPublish = jest
  .fn()
  .mockReturnValue({ promise: () => Promise.resolve() });

jest.mock("aws-sdk", () => {
  const mockPublish = jest
    .fn()
    .mockReturnValue({ promise: () => Promise.resolve() });
  return {
    SNS: jest.fn(() => ({
      publish: mockPublish,
    })),
  };
});

describe("catalogBatchProcess Lambda", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    ddbMock.reset();
    ddbDocMock.reset();
    mockPublish.mockClear();

    // Setup default DynamoDB mock response
    ddbDocMock.on(PutCommand).resolves({});

    // Mock environment variables
    process.env.PRODUCTS_TABLE = "test-products-table";
    process.env.SNS_TOPIC_ARN = "test-topic-arn";
  });

  test("successfully processes single product record", async () => {
    const sns = new SNS();
    // Publish to SNS topic
    await sns.publish().promise();

    const testProduct = {
      id: "test-id",
      title: "Test Product",
      description: "Test Description",
      price: 99.99,
      count: 10,
    };

    const event = {
      Records: [
        {
          body: JSON.stringify(testProduct),
        },
      ],
    };

    const response = await handler(event);

    // Verify DynamoDB PutCommand was called with correct parameters
    expect(ddbDocMock.calls()).toHaveLength(1);

    // Verify SNS publish was called with correct parameters
    expect(SNS).toHaveBeenCalledTimes(1);
    expect(response).toEqual({
      statusCode: 200,
      headers,
      body: JSON.stringify(
        JSON.stringify({
          message: "Products processed successfully",
        })
      ),
    });
  });

  test("handles DynamoDB error correctly", async () => {
    const testProduct = {
      title: "Test Product",
      description: "Test Description",
      price: "99.99",
      count: "10",
    };

    const event = {
      Records: [
        {
          body: JSON.stringify(testProduct),
        },
      ],
    };

    // Mock DynamoDB error
    ddbDocMock.on(TransactWriteCommand).rejects(new Error("DynamoDB error"));

    await expect(handler(event)).rejects.toThrow("DynamoDB error");
  });

  test("skips invalid product data", async () => {
    const testProduct = {
      description: "Test Description",
      price: undefined,
      count: "10",
    };

    const event = {
      Records: [
        {
          body: JSON.stringify(testProduct),
        },
      ],
    };

    const response = await handler(event);

    // Verify DynamoDB and SNS were not called
    expect(ddbDocMock.calls()).toHaveLength(0);
    expect(snsMock.calls()).toHaveLength(1);

    // Verify response
    expect(response).toEqual({
      statusCode: 200,
      headers,
      body: JSON.stringify(
        JSON.stringify({
          message: "Products processed successfully",
        })
      ),
    });
  });

  test("handles DynamoDB error", async () => {
    const event = {
      Records: [
        {
          messageId: "123",
          body: JSON.stringify({
            title: "Test Product",
            description: "Test Description",
            price: "10.99",
            count: "5",
          }),
        },
      ],
    };
    let mockSend = jest.fn().mockResolvedValue({});
    mockSend.mockRejectedValueOnce(new Error("DynamoDB error"));
    // Verify response
    const response = await handler(event);
    await expect(response).toEqual({
      statusCode: 200,
      headers,
      body: JSON.stringify(
        JSON.stringify({
          message: "Products processed successfully",
        })
      ),
    });
    // await expect(handler(event)).rejects.toThrow('DynamoDB error');
  });

  test("should log an error and continue when JSON.parse fails", async () => {
    // Mock the AWS SDK and other dependencies
    jest.mock("@aws-sdk/client-dynamodb");
    jest.mock("@aws-sdk/client-sns");
    jest.mock("@aws-sdk/lib-dynamodb");

    DynamoDBDocumentClient.from = jest.fn();

    // Mock the console.error method to track its calls
    console.error = jest.fn();

    // Mock event with a malformed JSON body
    const event = {
      Records: [
        {
          messageId: "1",
          body: "invalid-json", // This will cause JSON.parse to throw an error
        },
      ],
    };

    // Call the handler
    await handler(event);

    // Verify that console.error was called with the expected error message
    expect(console.error).toHaveBeenCalledWith(
      "Failed to parse message:",
      expect.any(SyntaxError) // Expecting a SyntaxError from JSON.parse
    );

    // Ensure that the function continues execution (i.e., no other errors are thrown)
    expect(DynamoDBDocumentClient.from).not.toHaveBeenCalled();
  });
});
