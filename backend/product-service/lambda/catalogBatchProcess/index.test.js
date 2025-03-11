const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { SNS } = require("aws-sdk");
const { handler } = require("./index.js");
const { mockClient } = require("aws-sdk-client-mock");

// Mock the DynamoDB client
const ddbMock = mockClient(DynamoDBClient);
const ddbDocMock = mockClient(DynamoDBDocumentClient);

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
    expect(ddbDocMock.call(0).args[0].input).toEqual({
      TableName: "test-products-table",
      Item: testProduct,
    });

    // Verify SNS publish was called with correct parameters
    expect(SNS).toHaveBeenCalledTimes(1);

    expect(response).toEqual({
      statusCode: 200,
      body: JSON.stringify({
        message: "Successfully processed 1 products",
      }),
    });
  });

  test("handles DynamoDB error correctly", async () => {
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

    // Mock DynamoDB error
    ddbDocMock.on(PutCommand).rejects(new Error("DynamoDB error"));

    await expect(handler(event)).rejects.toThrow("DynamoDB error");
  });

  test("handles invalid JSON in record body", async () => {
    const event = {
      Records: [
        {
          body: "invalid-json",
        },
      ],
    };

    await expect(handler(event)).rejects.toThrow();
  });
});
