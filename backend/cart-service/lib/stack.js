const cdk = require("aws-cdk-lib");
const { Stack } = require("aws-cdk-lib");
const lambda = require("aws-cdk-lib/aws-lambda");
const apigateway = require("aws-cdk-lib/aws-apigateway");
const path = require("path");

class CartStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Create Lambda function
    const nestLambda = new lambda.Function(this, "NestJsLambda", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "lambda.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda")),
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
  }
}

module.exports = { CartStack };
