Here are the AWS CLI commands to create both Products table and Stocks table with the required schemas:

# Create Products table
aws dynamodb create-table \
    --table-name products \
    --attribute-definitions \
        AttributeName=id,AttributeType=S \
    --key-schema \
        AttributeName=id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST

# Create Stocks table
aws dynamodb create-table \
    --table-name stocks \
    --attribute-definitions \
        AttributeName=product_id,AttributeType=S \
    --key-schema \
        AttributeName=product_id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST

Also execute("node createTables.js", path.join(__dirname, "../dynamoDB")) at .\backend\scripts\deploy.js creates tables and fills them with data;

1. Task: https://github.com/rolling-scopes-school/aws/blob/main/aws-developer/04_integration_with_nosql_database/task.md
2. Screenshot:  
![image](https://github.com/user-attachments/assets/69c1848c-7491-405c-9021-4eb362530e10)
![image](https://github.com/user-attachments/assets/26017984-2288-4f54-8cb6-418460685902)
![image](https://github.com/user-attachments/assets/3ab222f9-3d1b-46e3-a163-ea339e3e18e4)
![image](https://github.com/user-attachments/assets/ffaef37f-96f5-4eed-a28d-ab306e03e32c)
![image](https://github.com/user-attachments/assets/67f85313-090c-440c-98ef-b4d490edb8f1)
![image](https://github.com/user-attachments/assets/e8c33dc0-4d53-4c2d-b253-7f03e4e4beb2)
3. Deploy: https://driww1sq5lcii.cloudfront.net
3. API for POST requests https://dixi2cp20f.execute-api.eu-central-1.amazonaws.com/prod/products
3. API for GET requests https://dixi2cp20f.execute-api.eu-central-1.amazonaws.com/prod/products
3. API for GET requests https://dixi2cp20f.execute-api.eu-central-1.amazonaws.com/prod/products/1
4. Done 01.03.2025 / deadline 02.03.2025
5. Score: 100 / 100
- Basic Scope
- [x] **+0** Task 4.1 is implemented
- [x] **+0** Task 4.2 is implemented lambda links are provided and returns data
- [x] **+0** Task 4.3 is implemented lambda links are provided and products is stored in DB (call Task 4.2 to see the product)
- [x] **+70** Your own Frontend application is integrated with Product Service (/products API) and products from Product Service are represented on Frontend. Link to a working Frontend application is provided for cross-check reviewer.
- Additional (optional) tasks
- [x] **+7.5** POST /products lambda functions returns error 400 status code if product data is invalid
- [x] **+7.5** All lambdas return error 500 status code on any error (DB connection, any unhandled error in code)
- [x] **+7.5** All lambdas do console.log for each incoming requests and their arguments
- [x] **+7.5** Transaction based creation of product (in case stock creation is failed then related to this stock product is not created and not ready to be used by the end user and vice versa) 

P.S. Swagger was not updated for this task because there were no requriments to do so. All requests can be done by postman at https://web.postman.co.