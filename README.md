There is a readme in Russian language in the root of the project, called `README [RU].md`.  

The local application can be launched by entering the command `npm run start` found in the folder `backend\bff-service`, or being in the root of the project, specifying the path in the console using `cd .\backend\bff-service\`.  

It is mandatory to create .env files in `backend\bff-service` and `backend\bff-service\lambda`  
Also here are useful commands to check the FE side.  
localStorage.setItem('authorization_token', 'aHVudGVydGlnZXJ4MzpURVNUX1BBU1NXT1JE')  
localStorage.getItem("authorization_token")  

AUTH REQUESTS  
POST http://localhost:3000/authorization?register registers the user  
```
{
"username": "huntertigerx3",
"password": "TEST_PASSWORD"
}
```  
POST http://localhost:3000/authorization?login returns Bearer Token
```
{
"username": "huntertigerx3",
"password": "TEST_PASSWORD"
}
```  
PRODUCT REQUESTS  
For all requests you must have Basic authorization.  
GET http://localhost:3000/products returns all products  
GET http://localhost:3000/product returns all products  
GET http://localhost:3000/product?available returns all products  
GET http://localhost:3000/products?4b4a7ccb-f566-4527-a129-d9a948cf0aca returns a product by ID  
GET http://localhost:3000/product?4b4a7ccb-f566-4527-a129-d9a948cf0aca returns a product by ID  

PUT http://localhost:3000/product allows you to change product data if the correct product ID is specified. On the site, when changing product data, it allows you to change only the fields `Title`, `Description`, `Price`, `Count`, but using JSON, you can use both  
```
{
"count": 90,
"imgurl": "https://github.com/HunterTigerX/aws-task-3/blob/task-10/assets/Samsung%20Galaxy%20S23.jpg?raw=true",
"price": 799.99,
"description": "Flagship DS Android phone with Snapdragon 8 Gen 145",
"title": "Samsung Galaxy ABS23",
"id": "4b4a7ccb-f566-4527-a129-d9a948cf0aca"
}
```  
And  
```
{
"count": 90,
"price": 799.99,
"description": "Flagship Android phone with Snapdragon 8 Gen 22",
"title": "Samsung Galaxy S23",
"id": "4b4a7ccb-f566-4527-a129-d9a948cf0aca"
}
```  
You can add a new product to the site at `https://d138sljllinulj.cloudfront.net/admin/product-form` using a PUT request to BFF.  

DELETE http://localhost:3000/product?{id}, for example, http://localhost:3000/product?4b4a7ccb-f566-4527-a129-d9a948cf0aca deletes the product from the database. You can find out the products using the GET request http://localhost:3000/products, take the product ID there, then delete the product by id.  
On the product deletion site, it works on the page `https://d138sljllinulj.cloudfront.net/admin/orders`.  

CART REQUESTS  
GET http://localhost:3000/cart returns the products in the cart  
PUT http://localhost:3000/cart adds products to the cart  
When adding a product to the cart, remember that there must be authorization. id may not be valid in the example if I suddenly generate a new database, therefore it is best to first run `http://localhost:3000/product`, take the product id there, then use it when requesting `http://localhost:3000/cart`  
```
{
"product": {
"id": "732891c7-c352-40a4-8c93-6f9bcaaad277"
},
"count": 1
}
```  
GET http://localhost:3000/cart?order returns a list of orders.  
PUT http://localhost:3000/cart?order submits the order  
```
{
"items": [
{
"productId": "1ea0ef3e-23f1-438a-97ca-fe3dd4caf68f",
"count": 2
}
],
"address": {
"comment": "test comment",
"address": "test address",
"lastName": "real last name",
"firstName": "unreal first name"
}
}
```  

PROFILE REQUESTS  
GET http://localhost:3000/profile returns profile data, but remember that authorization must be enabled  

IMPORT REQUESTS  
POST http://localhost:3000/import?name=test.csv imports the .csv file into the bucket and adds the data from the file to the database if the data has the correct structure. The example file is in the root of the project and is called `import example.csv`
It is necessary to have ?name, and =test.csv has a check for the validity of the file name and extension. The file must not contain prohibited words or characters or have an invalid format
Add data to Body - raw, 1 object is allowed  

```
{
"title": "Manual Product Test Import 3",
"price": "799.99",
"description": "Flagship Android phone with Snapdragon 8 Gen 2",
"count": 2,
"imgurl": "https://github.com/HunterTigerX/aws-task-3/blob/task-10/assets/Samsung%20Galaxy%20S23.jpg?raw=true"
}
```  
or an array of objects  
```
[
{
"title": "Manual Product Test Import 0",
"price": "799.99",
"description": "Flagship Android phone with Snapdragon 8 Gen 2",
"count": 2,
"imgurl": "https://github.com/HunterTigerX/aws-task-3/blob/task-10/assets/Samsung%20Galaxy%20S23.jpg?raw=true"
},
{
"title": "Manual Product Test Import 1",
"price": "799.99",
"description": "Flagship Android phone with Snapdragon 8 Gen 2",
"count": 2,
"imgurl": "https://github.com/HunterTigerX/aws-task-3/blob/task-10/assets/Samsung%20Galaxy%20S23.jpg?raw=true"
}
]
```  

How to quickly check an additional task  
1) Run a local application if it was not launched or if it was stopped  
2) Perform a GET request to the http://localhost:3000/products, for example in `Postman`  
3) Open `https://d138sljllinulj.cloudfront.net/admin/product-form`, create a product with any data  
4) Perform a new GET request to http://localhost:3000/product