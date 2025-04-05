const cdk = require("aws-cdk-lib");
const { Stack, CustomResource, CfnOutput } = require("aws-cdk-lib");
const lambda = require("aws-cdk-lib/aws-lambda");
const apigateway = require("aws-cdk-lib/aws-apigateway");
const path = require("path");
const ec2 = require("aws-cdk-lib/aws-ec2");
const cr = require("aws-cdk-lib/custom-resources");

class CartStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const hostName = process.env.DB_HOST || "postgres";
    const port = process.env.DB_PORT || "5432";
    const username = process.env.DB_USERNAME || "postgres";
    const password = process.env.DB_PASSWORD || "postgres";
    const databaseName = process.env.DB_NAME || "cartdb";

    // Create VPC
    const vpc = new ec2.Vpc(this, "CartVPC", {
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: "Public",
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: "Private",
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // Create Security Group for Lambda
    const lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      "LambdaSecurityGroup",
      {
        vpc,
        description: "Security group for Lambda function",
        allowAllOutbound: true,
      }
    );

    // Create Lambda function
    const nestLambda = new lambda.Function(this, "NestJsLambda", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "handler",
      entry: path.join(__dirname, "../../../frontend-cart/src/lambda.ts"),
      code: lambda.Code.fromAsset(
        path.join(__dirname, "../../../frontend-cart/dist")
      ),
      timeout: cdk.Duration.seconds(30),
      memorySize: 1024,
      environment: {
        NODE_ENV: "production",
        DB_HOST: hostName,
        DB_PORT: port,
        DB_USERNAME: username,
        DB_PASSWORD: password,
        DB_NAME: databaseName,
      },
      bundling: {
        minify: true,
        sourceMap: true,
        target: "node18",
        nodeModules: [
          "@nestjs/core",
          "@nestjs/common",
          "@nestjs/platform-express",
          "@codegenie/serverless-express",
        ],
        externalModules: ["@aws-sdk/*", "aws-sdk"],
        vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        securityGroups: [lambdaSecurityGroup],
      },
    });

    // Create API Gateway
    const api = new apigateway.RestApi(this, "NestJsApi", {
      restApiName: "Cart Service",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    // Integrate Lambda with API Gateway
    const lambdaIntegration = new apigateway.LambdaIntegration(nestLambda, {
      proxy: true,
    });

    // Add proxy resource to handle all routes
    api.root.addProxy({
      defaultIntegration: lambdaIntegration,
      anyMethod: true,
    });

    // Reference to existing RDS instance security group
    const dbSG = ec2.SecurityGroup.fromSecurityGroupId(
      this,
      "DBSecurityGroup",
      "vpc-01c02411964bf41ca"
    );

    // Allow Lambda to connect to RDS
    dbSG.connections.allowFrom(
      lambdaSecurityGroup,
      ec2.Port.tcp(5432),
      "Allow Lambda to connect to RDS"
    );

    // Create Lambda function
    const initializerFunction = new lambda.Function(this, "DBFillFunction", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/db-init")),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [lambdaSecurityGroup],
      allowPublicSubnet: true,
      environment: {
        DB_HOST: hostName,
        DB_PORT: port,
        DB_USERNAME: username,
        DB_PASSWORD: password,
        DB_NAME: databaseName,
      },
      timeout: cdk.Duration.minutes(5),
    });

    // Create Custom Resource to trigger Lambda
    const dbInitProvider = new cr.Provider(this, "DBInitProvider", {
      onEventHandler: initializerFunction,
    });

    // Custom Resource that will trigger our Lambda
    new cdk.CustomResource(this, "DBInitResource", {
      serviceToken: dbInitProvider.serviceToken,
      properties: {
        // Add a timestamp to force the custom resource to run on every deployment
        timestamp: new Date().toISOString(),
      },
    });

    // Output API URL
    new cdk.CfnOutput(this, "ApiUrl", {
      value: api.url,
      description: "API Gateway URL",
    });
  }
}

module.exports = { CartStack };
