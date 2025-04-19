const cdk = require("aws-cdk-lib");
const { Stack } = require("aws-cdk-lib");
const lambda = require("aws-cdk-lib/aws-lambda");
const sqs = require("aws-cdk-lib/aws-sqs");
const sns = require("aws-cdk-lib/aws-sns");
const subscriptions = require("aws-cdk-lib/aws-sns-subscriptions");
const lambdaEventSources = require("aws-cdk-lib/aws-lambda-event-sources");
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

    // Create SNS Topic
    const createProductTopic = new sns.Topic(this, "CreateProductTopic", {
      displayName: "Create Product Topic",
      topicName: "createProductTopic",
    });

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

    // Create S3 bucket for website hosting
    const websiteBucket = this.createWebsiteBucket();

    // Create CloudFront distribution
    const distribution = this.createCloudFrontDistribution(websiteBucket);

    // Deploy website content
    this.deployWebsiteContent(websiteBucket, distribution);

    // Create SQS Queue
    const catalogItemsQueue = new sqs.Queue(this, "CatalogItemsQueue", {
      queueName: "catalogItemsQueue",
      visibilityTimeout: cdk.Duration.seconds(30),
    });

    const dbPolicies = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:TransactWriteItems",
      ],
      resources: [productsTable.tableArn, stocksTable.tableArn],
    });

    lambdaRole.addToPolicy(dbPolicies);

    // Add SQS permissions
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes",
          "sqs:SendMessage",
          "sqs:SendMessageBatch",
        ],
        resources: [catalogItemsQueue.queueArn],
      })
    );

    // Add SNS permissions
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["sns:Publish"],
        resources: [createProductTopic.topicArn],
      })
    );

    // Create Lambda functions
    const {
      getProductsListLambda,
      getProductByIdLambda,
      createProductLambda,
      catalogBatchProcessLambda,
      updateProductLambda,
      deleteProductLambda
    } = this.createLambdaFunctions(productsTable, stocksTable, dbPolicies);

    // Configure SQS as event source for Lambda
    catalogBatchProcessLambda.addEventSource(
      new lambdaEventSources.SqsEventSource(catalogItemsQueue, {
        batchSize: 5,
        enabled: true,
      })
    );

    // We are granting Lambda permission to publish to SNS
    createProductTopic.grantPublish(catalogBatchProcessLambda);

    // Add email subscription
    createProductTopic.addSubscription(
      new subscriptions.EmailSubscription("HunterTigerX@gmail.com")
    );

    // Email subscription for expensive products (price >= 100)
    createProductTopic.addSubscription(
      new subscriptions.EmailSubscription("expensive-products@example.com", {
        filterPolicy: {
          price: sns.SubscriptionFilter.numericFilter({
            greaterThanOrEqualTo: 100,
          }),
        },
      })
    );

    // Email subscription for inexpensive products (price < 100)
    createProductTopic.addSubscription(
      new subscriptions.EmailSubscription("inexpensive-products@example.com", {
        filterPolicy: {
          price: sns.SubscriptionFilter.numericFilter({
            lessThan: 100,
          }),
        },
      })
    );

    // Email subscription for specific product category
    createProductTopic.addSubscription(
      new subscriptions.EmailSubscription("count@example.com", {
        filterPolicy: {
          count: sns.SubscriptionFilter.numericFilter({
            lessThan: 100,
          }),
        },
      })
    );

    // Pass the SNS topic ARN to Lambda as environment variable
    catalogBatchProcessLambda.addEnvironment(
      "SNS_TOPIC_ARN",
      createProductTopic.topicArn
    );

    productsTable.grantWriteData(catalogBatchProcessLambda);

    // Create API Gateway and endpoints
    this.createApiGateway(
      getProductsListLambda,
      getProductByIdLambda,
      createProductLambda,
      catalogBatchProcessLambda,
      updateProductLambda,
      deleteProductLambda
    );

    // Creating CloudFront distribution for API
    const apiDistribution = this.createApiCloudFrontDistribution();
  
  new cdk.CfnOutput(this, "ApiDistributionDomainName", {
    value: apiDistribution.distributionDomainName,
  });
  }

  createWebsiteBucket() {
    return new s3.Bucket(this, "WebsiteBucket", {
      bucketName: "websitebuckethtx3",
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
        {
          httpStatus: 403,
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
    const deleteProductLambda = new lambda.Function(this, "deleteProduct", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(
        path.join(__dirname, "../lambda/deleteProduct")
      ),
      environment: {
        PRODUCTS_TABLE: productsTable.tableName,
        STOCKS_TABLE: stocksTable.tableName,
      },
    });
    deleteProductLambda.addToRolePolicy(dbPolicies);

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

    const catalogBatchProcessLambda = new lambda.Function(
      this,
      "catalogBatchProcess",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: "index.handler",
        code: lambda.Code.fromAsset(
          path.join(__dirname, "../lambda/catalogBatchProcess")
        ),
        timeout: cdk.Duration.seconds(30),
        environment: {
          PRODUCTS_TABLE: productsTable.tableName,
          STOCKS_TABLE: stocksTable.tableName,
        },
      }
    );
    catalogBatchProcessLambda.addToRolePolicy(dbPolicies);

    const updateProductLambda = new lambda.Function(this, "updateProduct", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(
        path.join(__dirname, "../lambda/updateProduct")
      ),
      environment: {
        PRODUCTS_TABLE: productsTable.tableName,
        STOCKS_TABLE: stocksTable.tableName,
      },
    });
    updateProductLambda.addToRolePolicy(dbPolicies);

    return {
      getProductsListLambda,
      getProductByIdLambda,
      createProductLambda,
      catalogBatchProcessLambda,
      updateProductLambda,
      deleteProductLambda
    };
  }

  createApiGateway(
    getProductsListLambda,
    getProductByIdLambda,
    createProductLambda,
    catalogBatchProcessLambda,
    updateProductLambda,
    deleteProductLambda
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

    const productPath = api.root.addResource("product");
    productPath.addMethod(
      "PUT",
      new apigateway.LambdaIntegration(updateProductLambda)
    );
    productPath.addMethod(
      "DELETE",
      new apigateway.LambdaIntegration(deleteProductLambda)
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

  createApiCloudFrontDistribution() {
    return new cloudfront.Distribution(this, 'CartApiDistribution', {
      defaultBehavior: {
        origin: new origins.HttpOrigin(
          'huntertigerx-cart-api-dev.eu-central-1.elasticbeanstalk.com',
          {
            protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
            originSslProtocols: [cloudfront.OriginSslPolicy.TLS_V1_2],
          }
        ),
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
      },
    });
  }
}

module.exports = { WebsiteStack };
