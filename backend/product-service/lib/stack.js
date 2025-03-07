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

    // Import existing DynamoDB tables
    const productsTable = dynamodb.Table.fromTableName(
      this,
      "ExistingProductsTable",
      "products"
    );

    const stocksTable = dynamodb.Table.fromTableName(
      this,
      "ExistingStocksTable",
      "stocks"
    );

    // // Create DynamoDB tables
    // const productsTable = new dynamodb.Table(this, "ProductsTable", {
    //   tableName: "products",
    //   partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
    //   removalPolicy: cdk.RemovalPolicy.RETAIN,
    // });

    // const stocksTable = new dynamodb.Table(this, "StocksTable", {
    //   tableName: "stocks",
    //   partitionKey: { name: "product_id", type: dynamodb.AttributeType.STRING },
    //   removalPolicy: cdk.RemovalPolicy.RETAIN,
    // });

    const dbPolicies = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
      ],
      resources: [productsTable.tableArn, stocksTable.tableArn],
    });

    lambdaRole.addToPolicy(dbPolicies);

    // Create S3 bucket for website hosting
    const websiteBucket = this.createWebsiteBucket();

    // Create CloudFront distribution
    const distribution = this.createCloudFrontDistribution(websiteBucket);

    // Deploy website content
    this.deployWebsiteContent(websiteBucket, distribution);

    // Create Lambda functions
    const { getProductsListLambda, getProductByIdLambda, createProductLambda } =
      this.createLambdaFunctions(productsTable, stocksTable, dbPolicies);

    // Create API Gateway and endpoints
    this.createApiGateway(
      getProductsListLambda,
      getProductByIdLambda,
      createProductLambda
    );
  }

  createWebsiteBucket() {
    return new s3.Bucket(this, "WebsiteBucket", {
      bucketName: "websitebuckethtx2",
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED, // Adding encryption
    });
  }

  createCloudFrontDistribution(websiteBucket) {
    const distribution = new cloudfront.Distribution(this, "Distribution", {
      defaultBehavior: {
        origin: new origins.S3Origin(websiteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: new cloudfront.CachePolicy(this, "CustomCachePolicy", {
          minTtl: cdk.Duration.seconds(1),
          maxTtl: cdk.Duration.days(365),
          defaultTtl: cdk.Duration.days(1),
          enableAcceptEncodingGzip: true,
          enableAcceptEncodingBrotli: true,
        }),
      },
      defaultRootObject: "index.html",
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
          ttl: cdk.Duration.minutes(30),
        },
      ],
    });

    new cdk.CfnOutput(this, "DistributionDomainName", {
      value: distribution.distributionDomainName,
    });

    new cdk.CfnOutput(this, "DistributionId", {
      value: distribution.distributionId,
    });

    return distribution;
  }

  createLambdaFunctions(productsTable, stocksTable, dbPolicies) {
    const getProductsListLambda = new lambda.Function(this, "getProductsList", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(
        path.join(__dirname, "../lambda/getProductsList")
      ),
      environment: {
        PRODUCTS_TABLE: productsTable.tableName,
        STOCKS_TABLE: stocksTable.tableName,
      },
    });
    getProductsListLambda.addToRolePolicy(dbPolicies);

    const getProductByIdLambda = new lambda.Function(this, "getProductById", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(
        path.join(__dirname, "../lambda/getProductById")
      ),
      environment: {
        PRODUCTS_TABLE: productsTable.tableName,
        STOCKS_TABLE: stocksTable.tableName,
      },
    });
    getProductByIdLambda.addToRolePolicy(dbPolicies);

    const createProductLambda = new lambda.Function(this, "createProduct", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(
        path.join(__dirname, "../lambda/createProduct")
      ),
      environment: {
        PRODUCTS_TABLE: productsTable.tableName,
        STOCKS_TABLE: stocksTable.tableName,
      },
    });
    createProductLambda.addToRolePolicy(dbPolicies);

    return { getProductsListLambda, getProductByIdLambda, createProductLambda };
  }

  createApiGateway(
    getProductsListLambda,
    getProductByIdLambda,
    createProductLambda
  ) {
    const api = new apigateway.RestApi(this, "ProductsApi", {
      restApiName: "Products Service",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    // Create /products endpoint
    const products = api.root.addResource("products");

    products.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getProductsListLambda)
    );

    products.addMethod(
      "POST",
      new apigateway.LambdaIntegration(createProductLambda)
    );

    // Create /products/{productId} endpoint
    const product = products.addResource("{productId}");
    product.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getProductByIdLambda)
    );
  }

  deployWebsiteContent(websiteBucket, distribution) {
    new s3deploy.BucketDeployment(this, "WebsiteDeployment", {
      sources: [
        s3deploy.Source.asset(path.join(__dirname, "../../../frontend/dist")),
      ],
      destinationBucket: websiteBucket,
      distribution,
      distributionPaths: ["/*"],
    });
  }
}

module.exports = { WebsiteStack };
