Run npx jest --coverage to check the coverage
1. Task: https://github.com/rolling-scopes-school/aws/blob/main/aws-developer/03_serverless_api/task.md
2. Screenshot:
3. Deploy: https://driww1sq5lcii.cloudfront.net
4. Done 20.02.2025 / deadline 22.02.2025
5. Score: 100 / 100
- Basic Scope
- [x] **+0** Product Service contains configuration for 2 lambda functions, API is working, configuration is correct
- [x] **+0** The getProductsList OR getProductsById lambda function returns a correct response (POINT1)
- [x] **+0** The getProductsById AND getProductsList lambda functions return a correct response code (POINT2)
- [x] **+70** Frontend application is integrated with Product Service (/products API) and products from Product Service are represented on Frontend. AND POINT1 and POINT2 are done.
- Additional (optional) tasks
- [x] **+7.5** Swagger documentation is created for Product Service. This can be, for example, openapi.(json|yaml) added to the repository, that can be rendered by https://editor.swagger.io/
- [x] **+7.5** Lambda handlers are covered by basic UNIT tests (NO infrastructure logic is needed to be covered)
- [x] **+7.5** Lambda handlers (getProductsList, getProductsById) code is written not in 1 single module (file) and separated in codebase.
- [x] **+7.5** Main error scenarios are handled by API ("Product not found" error).