const cdk = require("aws-cdk-lib");
const { Stack } = require("aws-cdk-lib");
const lambda = require("aws-cdk-lib/aws-lambda");
const apigateway = require("aws-cdk-lib/aws-apigateway");
const s3 = require("aws-cdk-lib/aws-s3");
const s3n = require("aws-cdk-lib/aws-s3-notifications");
const s3deploy = require("aws-cdk-lib/aws-s3-deployment");
const iam = require("aws-cdk-lib/aws-iam");
const path = require("path");
const cr = require("aws-cdk-lib/custom-resources");
const sqs = require("aws-cdk-lib/aws-sqs");

const headers = {
  "Access-Control-Allow-Origin": "'*'",
  "Access-Control-Allow-Methods": "'*'",
  "Access-Control-Allow-Headers":
    "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
};

class ImportStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // In your ImportStack class
    const CORS_POLICY = {
      AllowedHeaders: ["*"],
      AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
      AllowedOrigins: ["*"], // CloudFront domain
      ExposeHeaders: ["ETag"],
      MaxAge: 3000,
    };

    // Create a role for the Lambda functions
    const lambdaRole = new iam.Role(this, "LambdaRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });

    // Create a role for the Lambda import functions
    const importRole = new iam.Role(this, "ImportRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });

    // Add basic Lambda execution policy
    lambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaBasicExecutionRole"
      )
    );
    // Add basic Lambda execution policy
    importRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaBasicExecutionRole"
      )
    );

    // Create S3 bucket for uploaded files
    const uploadBucket = this.createWebsiteBucket();

    // After creating your bucket
    new cr.AwsCustomResource(this, "addingCors", {
      onCreate: {
        service: "S3",
        action: "putBucketCors",
        parameters: {
          Bucket: uploadBucket.bucketName,
          CORSConfiguration: {
            CORSRules: [CORS_POLICY],
          },
        },
        physicalResourceId: cr.PhysicalResourceId.of(
          `corsPrefix-${uploadBucket.bucketName}`
        ),
      },
      onUpdate: {
        service: "S3",
        action: "putBucketCors",
        parameters: {
          Bucket: uploadBucket.bucketName,
          CORSConfiguration: {
            CORSRules: [CORS_POLICY],
          },
        },
        physicalResourceId: cr.PhysicalResourceId.of(
          `corsPrefix-${uploadBucket.bucketName}`
        ),
      },
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
        resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
      }),
    });

    // Create IAM policy for Upload S3 access
    const dbPolicies = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket",
        "s3:CopyObject",
        "s3:DeleteObject",
        "s3:HeadObject",
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:GetQueueAttributes",
        "sqs:SendMessage",
        "sqs:SendMessageBatch",
      ],
      resources: [
        uploadBucket.bucketArn, // For bucket-level operations
        `${uploadBucket.bucketArn}/*`, // For object-level operations
        `arn:aws:sqs:${this.region}:${this.account}:catalogItemsQueue`, // For SQS operations
      ],
    });

    // Attach the policy to the Lambda function
    lambdaRole.addToPolicy(dbPolicies);

    // Output the bucket name
    new cdk.CfnOutput(this, "NewUploadBucketName", {
      value: uploadBucket.bucketName,
      description: "Upload bucket name",
    });

    // Deploy upload bucket
    this.deployUploadContent(uploadBucket);

    // Create Lambda functions
    const { importProductsFile, importFileParser } = this.createLambdaFunctions(
      dbPolicies,
      uploadBucket,
      lambdaRole,
      importRole
    );

    // Attach the policy to the Lambda Import function
    importRole.addToPolicy(dbPolicies);

    // Attach the policy to the Lambda function
    importFileParser.addToRolePolicy(dbPolicies);

    // Add S3 notification for the 'uploaded' prefix
    uploadBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(importFileParser),
      {
        prefix: "uploaded/", // Only trigger for objects in 'uploaded' folder
      }
    );

    // Create API Gateway and endpoints
    this.createApiGateway(importProductsFile, importFileParser);
  }

  createWebsiteBucket() {
    return new s3.Bucket(this, "UploadBucket", {
      bucketName: "uploadbuckethtx3",
      allowedHeaders: ["*"],
      allowedMethods: [
        s3.HttpMethods.GET,
        s3.HttpMethods.PUT,
        s3.HttpMethods.PUT,
        s3.HttpMethods.POST,
        s3.HttpMethods.HEAD,
      ],
      allowedOrigins: ["*"], // For production, specify your CloudFront domain
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });
  }

  createLambdaFunctions(dbPolicies, bucketNameUpload, lambdaRole, importRole) {
    // Create importProductsFile Lambda
    const importProductsFile = new lambda.Function(this, "ImportProductsFile", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(
        path.join(__dirname, "../lambda/importProductsFile")
      ),
      environment: {
        BUCKET_NAME: bucketNameUpload.bucketName,
      },
      role: lambdaRole,
    });
    importProductsFile.addToRolePolicy(dbPolicies);

    // Import existing queue by name
    const queue = sqs.Queue.fromQueueArn(
      this,
      "ImportedQueue",
      `arn:aws:sqs:${this.region}:${this.account}:catalogItemsQueue`
    );

    // Create importFileParser Lambda
    const importFileParser = new lambda.Function(this, "ImportFileParser", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(
        path.join(__dirname, "../lambda/importFileParser")
      ),
      environment: {
        BUCKET_NAME: bucketNameUpload.bucketName,
        SQS_QUEUE_URL: queue.queueUrl,
      },
      role: importRole,
    });

    // Granting the necessary permissions to the Lambda function to send messages to SQS
    queue.grantSendMessages(importFileParser);

    importFileParser.addToRolePolicy(dbPolicies);
    return {
      importProductsFile,
      importFileParser,
    };
  }

  createApiGateway(importProductsFile) {
    const api = new apigateway.RestApi(this, "ImportApi", {
      restApiName: "Import Service",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: apigateway.Cors.DEFAULT_HEADERS, // Разрешаем все заголовки
        allowCredentials: true, // Разрешаем передачу учетных данных
      },
    });

    api.addGatewayResponse("UnauthorizedResponse", {
      restApi: api,
      type: apigateway.ResponseType.UNAUTHORIZED,
      responseHeaders: headers,
      statusCode: "401",
    });

    api.addGatewayResponse("AccessDeniedResponse", {
      restApi: api,
      type: apigateway.ResponseType.ACCESS_DENIED,
      responseHeaders: headers,
      statusCode: "403",
    });

    // Import the Lambda function from AuthorizationStack to create Authorizer
    const basicAuthorizer = lambda.Function.fromFunctionArn(
      this,
      "ImportedBasicAuthorizer",
      cdk.Fn.importValue("BasicAuthorizerArn")
    );

    const authorizer = new apigateway.TokenAuthorizer(
      this,
      "ImportAuthorizer",
      {
        identitySource: "method.request.header.Authorization",
        handler: basicAuthorizer,
      }
    );

    // Create /import endpoint
    const importResource = api.root.addResource("import");


    importResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(importProductsFile),
      {
        requestParameters: {
          "method.request.querystring.name": true,
        },
        authorizer: authorizer,
        authorizationType: apigateway.AuthorizationType.CUSTOM,
        methodResponses: [
          {
            statusCode: "200",
            responseParameters: {
              "method.response.header.Access-Control-Allow-Origin": true,
            },
          },
        ],
      }
    );
    // importResource.addMethod(
    //   "GET",
    //   new apigateway.LambdaIntegration(importProductsFile, {
    //     proxy: false,
    //     integrationResponses: [
    //       {
    //         statusCode: "200",
    //         responseParameters: {
    //           'method.response.header.Access-Control-Allow-Origin': "'*'"
    //         }
    //       }
    //     ],
    //   }),
    //   {
    //     requestParameters: {
    //       "method.request.querystring.name": true,
    //     },
    //     methodResponses: [
    //       {
    //         statusCode: "200",
    //         responseParameters: {
    //           "method.response.header.Access-Control-Allow-Origin": true,
    //         },
    //       },
    //     ],
    //   }
    // );
  }

  deployUploadContent(bucket) {
    new s3deploy.BucketDeployment(this, "UploadedFolderDeployment", {
      sources: [s3deploy.Source.data(".keep", "")],
      destinationBucket: bucket,
      destinationKeyPrefix: "uploaded", // This will create the 'uploaded' folder
    });
  }
}

module.exports = { ImportStack };
