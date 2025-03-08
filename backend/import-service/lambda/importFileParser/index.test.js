const AWS = require('aws-sdk');
const sinon = require('sinon');
const { handler } = require('./index.js');

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

  // Mocking AWS.S3
jest.mock('aws-sdk', () => {
    const mockS3 = {
        getObject: jest.fn().mockReturnThis(),
        copyObject: jest.fn().mockReturnThis(),
        deleteObject: jest.fn().mockReturnThis(),
        createReadStream: jest.fn().mockReturnThis(),
        promise: jest.fn(),
    };
    return {
        S3: jest.fn(() => mockS3),
    };
});

// Mocking csv-parser
jest.mock('csv-parser', () => {
    return jest.fn(() => ({
        on: jest.fn().mockImplementation((event, callback) => {
            if (event === 'data') {
                callback({ column1: 'value1', column2: 'value2' });
                callback({ column1: 'value3', column2: 'value4' });
            }
            if (event === 'end') {
                callback();
            }
            return {
                on: jest.fn(),
            };
        }),
    }));
});


describe('importFileParser', () => {


    it('should process CSV file correctly', async () => {
        s3Client = new AWS.S3();

        const mockStream = {
            pipe: jest.fn().mockReturnThis(),
            on: jest.fn().mockImplementation((event, callback) => {
                if (event === 'data') {
                    callback({ column1: 'value1', column2: 'value2' });
                    callback({ column1: 'value3', column2: 'value4' });
                }
                if (event === 'end') {
                    callback();
                }
                return mockStream;
            }),
        };
        s3Client.createReadStream.mockReturnValue(mockStream);

        const response = await handler(event);

        expect(response.statusCode).toBe(200);
        expect(JSON.parse(response.body).body).toBe('CSV processing completed successfully and file moved to parsed folder');
    });

    it('should skip processing if file is not in uploaded folder', async () => {
        const event = {
            Records: [{
                s3: {
                    bucket: { name: 'test-bucket' },
                    object: { key: 'other/test.csv' }
                }
            }]
        };

        const consoleSpy = sinon.spy(console, 'log');
        await handler(event);

        expect(consoleSpy.calledWith('File not in uploaded folder. Skipping processing.')).toBeTruthy();
    });

    it('should handle errors during CSV processing', async () => {
        // Mocking createReadStream to throw
        const mockStream = {
            pipe: jest.fn().mockReturnThis(),
            on: jest.fn().mockImplementation((event, callback) => {
                if (event === 'error') {
                    callback(new Error('Failed to read file'));
                }
                return mockStream;
            }),
        };
        s3Client.createReadStream.mockReturnValue(mockStream);

        await expect(handler(event)).rejects.toThrow('Failed to read file');
    });
});