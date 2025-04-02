const cdk = require("aws-cdk-lib");
const { Stack, CustomResource, CfnOutput } = require("aws-cdk-lib");
const lambda = require("aws-cdk-lib/aws-lambda");
const apigateway = require("aws-cdk-lib/aws-apigateway");
const path = require("path");
const ec2 = require("aws-cdk-lib/aws-ec2");
const rds = require("aws-cdk-lib/aws-rds");
const cr = require("aws-cdk-lib/custom-resources");

class CartStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Create Lambda function
    const nestLambda = new lambda.Function(this, "NestJsLambda", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "lambda.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/nest")),
      timeout: cdk.Duration.seconds(30),
      memorySize: 1024,
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
    const lambdaIntegration = new apigateway.LambdaIntegration(nestLambda);

    // Add proxy resource to handle all routes
    api.root.addProxy({
      defaultIntegration: lambdaIntegration,
      anyMethod: true,
    });

    // Create VPC
    const vpc = new ec2.Vpc(this, "CartVPC", {
      maxAzs: 2,
      natGateways: 1,
    });

    // Add VPC Endpoints
    vpc.addInterfaceEndpoint("SecretsManagerEndpoint", {
      service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
    });

    // Create RDS Instance
    const dbInstance = new rds.DatabaseInstance(this, "CartDatabase", {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15,
      }),
      vpc,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      databaseName: "cartdb",
      credentials: rds.Credentials.fromGeneratedSecret("postgres"),
      allocatedStorage: 20,
      publiclyAccessible: true, // For development only. Remove in production,
      maxAllocatedStorage: 25,
      deletionProtection: false,
    });

    // Add initialization script
    const initializerFunction = new lambda.Function(this, "DBInitFunction", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/db-init")),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      environment: {
        DB_HOST: dbInstance.dbInstanceEndpointAddress,
        DB_PORT: dbInstance.dbInstanceEndpointPort,
        DB_SECRET_ARN: dbInstance.secret.secretArn,
        DB_NAME: "cartdb",
      },
      timeout: cdk.Duration.minutes(5),
    });

    // Grant permissions to read the secret
    dbInstance.secret.grantRead(initializerFunction);

    // Allow the Lambda to connect to RDS
    dbInstance.connections.allowFrom(
      initializerFunction,
      ec2.Port.tcp(5432),
      "Allow Lambda to connect to RDS"
    );

    /*
    // Allow Lambda to access RDS
    dbInstance.connections.allowDefaultPortFromAnyIpv4();
    */

    // Create a custom resource provider
    const provider = new cr.Provider(this, "DBInitProvider", {
      onEventHandler: initializerFunction,
      logRetention: cdk.aws_logs.RetentionDays.ONE_DAY,
    });

    // Create a custom resource to trigger the initialization
    new cdk.CustomResource(this, "DBInit", {
      serviceToken: provider.serviceToken,
      properties: {
        timestamp: Date.now(),
      },
    });

    // Output the DB endpoint
    new CfnOutput(this, "DbEndpoint", {
      value: dbInstance.instanceEndpoint.hostname,
    });
  }
}

module.exports = { CartStack };
