const cdk = require("aws-cdk-lib");
const { Stack } = require("aws-cdk-lib");
const lambda = require("aws-cdk-lib/aws-lambda");
const apigateway = require("aws-cdk-lib/aws-apigateway");
const s3 = require("aws-cdk-lib/aws-s3");
const cloudfront = require("aws-cdk-lib/aws-cloudfront");
const origins = require("aws-cdk-lib/aws-cloudfront-origins");
const s3deploy = require("aws-cdk-lib/aws-s3-deployment");
const iam = require("aws-cdk-lib/aws-iam");
const path = require("path");
const dynamodb = require("aws-cdk-lib/aws-dynamodb");

class WebsiteStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Create a role for the Lambda functions
    const lambdaRole = new iam.Role(this, "LambdaRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });

    // Add basic Lambda execution policy
    lambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaBasicExecutionRole"
      )
    );

    // Create S3 bucket for uploaded files
    const uploadBucket = this.createBucket(
      "uploadBucket",
      "huntertigerxuploadbucket"
    );

    const dbPolicies = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["s3:PutObject", "s3:GetObject"],
      resources: [`${uploadBucket.bucketArn}/*`],
    });

    lambdaRole.addToPolicy(dbPolicies);

    // Output the bucket name
    new cdk.CfnOutput(this, "NewUploadBucketName", {
      value: uploadBucket.bucketName,
      description: "Upload bucket name",
    });

    // Deploy upload bucket
    this.deployUploadContent(uploadBucket);

    // Create Lambda functions
    const { importProductsFileLambda } = this.createLambdaFunctions(
      dbPolicies,
      uploadBucket,
      lambdaRole
    );

    // Create API Gateway and endpoints
    this.createApiGateway(importProductsFileLambda);
  }

  createBucket(customName, bucketName) {
    return new s3.Bucket(this, customName, {
      bucketName,
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED, // Adding encryption
    });
  }

  createLambdaFunctions(dbPolicies, bucketNameUpload, lambdaRole) {
    // Create importProductsFile Lambda
    const importProductsFileLambda = new lambda.Function(
      this,
      "ImportProductsFile",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: "index.handler",
        code: lambda.Code.fromAsset(
          path.join(__dirname, "../lambda/importProductsFile")
        ),
        environment: {
          BUCKET_NAME: bucketNameUpload.bucketName,
        },
        role: lambdaRole,
      }
    );
    importProductsFileLambda.addToRolePolicy(dbPolicies);

    return {
      importProductsFileLambda,
    };
  }

  createApiGateway(importProductsFileLambda) {
    const api = new apigateway.RestApi(this, "ImportApi", {
      restApiName: "Import Service",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    // Create /import endpoint
    const importResource = api.root.addResource("import");

    importResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(importProductsFileLambda),
      {
        requestParameters: {
          "method.request.querystring.name": true,
        },
      }
    );
  }

  deployUploadContent(bucket) {
    new s3deploy.BucketDeployment(this, "UploadedFolderDeployment", {
      sources: [s3deploy.Source.data("uploaded/.keep", "")],
      destinationBucket: bucket,
      destinationKeyPrefix: "uploaded", // This will create the 'uploaded' folder
    });
  }
}

module.exports = { WebsiteStack };
