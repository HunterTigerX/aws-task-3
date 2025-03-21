const cdk = require("aws-cdk-lib");
const lambda = require("aws-cdk-lib/aws-lambda");
const path = require("path");
require('dotenv').config();

const login = process.env.ENV_LOGIN;
const password = process.env.ENV_PASSWORD;
const key = process.env.ENV_SECRET_KEY;
console.log('login 1', login, 'password 1', password, 'key 1', key)

if (!login || !password || !key) {
  throw new Error('Required environment variables are missing');
}

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

    basicAuthorizer.addPermission('APIGatewayInvoke', {
      principal: new cdk.aws_iam.ServicePrincipal('apigateway.amazonaws.com'),
      action: 'lambda:InvokeFunction',
   });

    // Export the Lambda ARN
    new cdk.CfnOutput(this, "BasicAuthorizerArn", {
      value: basicAuthorizer.functionArn,
      exportName: "BasicAuthorizerArn",
    });
  }
}

module.exports = { AuthorizationStack };
