const cloudfront = require("aws-cdk-lib/aws-cloudfront");
const origins = require("aws-cdk-lib/aws-cloudfront-origins");
const lambda = require("aws-cdk-lib/aws-lambda");
const apigateway = require("aws-cdk-lib/aws-apigateway");
const cdk = require("aws-cdk-lib");
const { Stack } = require("aws-cdk-lib");
const path = require("path");

class bffStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Create API Gateway to handle requests
    const api = new apigateway.RestApi(this, 'BffApi', {
      defaultCorsPreflightOptions: {
        allowOrigins: ['*'],
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key', 'X-Amz-Security-Token'],
      }
    });

    // Create Lambda function for BFF logic
    const bffLambda = new lambda.Function(this, "forwardBff", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/")),
      environment: {
        CART_SERVICE_URL: process.env.CART_SERVICE_URL,
        PRODUCT_SERVICE_URL: process.env.PRODUCT_SERVICE_URL,
        IMPORT_SERVICE_URL: process.env.IMPORT_SERVICE_URL,
        AUTHORIZATION_SERVICE_URL: process.env.AUTHORIZATION_SERVICE_URL
      }
    });

    // Integrate Lambda with API Gateway
    const bffIntegration = new apigateway.LambdaIntegration(bffLambda);
    api.root.addProxy({
      defaultIntegration: bffIntegration,
      anyMethod: true
    });
    

    // Create CloudFront distribution
    const distribution = new cloudfront.Distribution(this, "bffDistribution", {
      defaultBehavior: {
        origin: new origins.RestApiOrigin(api),
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        cachePolicy: new cloudfront.CachePolicy(this, "CustomCachePolicy", {
          minTtl: cdk.Duration.seconds(0),
          maxTtl: cdk.Duration.seconds(120),
          defaultTtl: cdk.Duration.seconds(0),
          enableAcceptEncodingGzip: true,
          enableAcceptEncodingBrotli: true,
          headerBehavior: cloudfront.CacheHeaderBehavior.allowList('X-Cache'),
        }),
      }
    });

    // Output the CloudFront URL
    new cdk.CfnOutput(this, "DistributionDomainName", {
      value: distribution.distributionDomainName,
    });
  }
}

module.exports = { bffStack };
