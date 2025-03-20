const cdk = require("aws-cdk-lib");
const lambda = require("aws-cdk-lib/aws-lambda");
const path = require("path");
require("dotenv").config();

const login = process.env.ENV_LOGIN;
const password = process.env.ENV_PASSWORD;
const key = process.env.ENV_SECRET_KEY;

class AuthorizationStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const basicAuthorizer = new lambda.Function(this, "BasicAuthorizer", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda")),
      environment: {
        CREDENTIALS: `${login}=${password}`,
        login: key,
      },
    });

    // Export the Lambda ARN
    new cdk.CfnOutput(this, "BasicAuthorizerArn", {
      value: basicAuthorizer.functionArn,
      exportName: "BasicAuthorizerArn",
    });
  }
}

module.exports = { AuthorizationStack };
