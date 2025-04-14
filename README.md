1. Task: https://github.com/rolling-scopes-school/aws/blob/main/aws-developer/09_containerization/task.md
2. Screenshot:  
![image](https://github.com/user-attachments/assets/47a5d807-347b-4585-bd0e-e7a9ea30cfe3)
RDS Database
![image](https://github.com/user-attachments/assets/fa2f7d4b-798b-4ed9-ba4e-f06ecd7c4797)
Registering a user
![image](https://github.com/user-attachments/assets/ff102164-8aae-4ea5-8f4f-21d9b6091d73)
If we try to register the user with the same username
![image](https://github.com/user-attachments/assets/b39de191-b69c-4e00-a762-8b7855248ca9)
Logging in
![image](https://github.com/user-attachments/assets/e233bc02-497c-4602-8460-cf5dde01be2e)
Getting profile info
![image](https://github.com/user-attachments/assets/8e8d5658-192c-4a11-b488-f79953e968ed)
Getting profile info with a wrong password
![image](https://github.com/user-attachments/assets/75e22e6c-cc35-4483-b0c3-3a5cf56de81b)
Putting item in the cart
![image](https://github.com/user-attachments/assets/ecf1deb4-0f34-43e4-bff5-4d11074d26dc)
Getting cart info
![image](https://github.com/user-attachments/assets/8aa0777f-dea7-462d-bec9-28bdc049df66)
Getting order info
![image](https://github.com/user-attachments/assets/170ccf55-6f27-49ff-9f2f-dc896979c132)
Putting the order
![image](https://github.com/user-attachments/assets/e3ce8eba-c8e0-4762-a5bd-3be6451e8e10)
Opening Checkout on the FE side
huntertigerx3:TEST_PASSWORD equals aHVudGVydGlnZXJ4MzpURVNUX1BBU1NXT1JE
![image](https://github.com/user-attachments/assets/eee2cab7-1269-4e2b-90eb-63908652479a)
Docker size (Docker was created using the command `docker build -t cart-service .`)
![image](https://github.com/user-attachments/assets/62976975-b2ea-4817-b81f-0d994acdc075)
![image](https://github.com/user-attachments/assets/5fe6068b-44bf-41bc-b084-a246c5503089)
![image](https://github.com/user-attachments/assets/2c9aa9b1-8cf3-4917-9d45-595632c152f7)
EC2 and EBS data
The deployment was made using commands
`eb init -p "Docker running on 64bit Amazon Linux 2023" --region eu-central-1 huntertigerx-cart-api`
`eb create develop --cname huntertigerx-cart-api-dev --single --keyname eb-https-key --envvars DB_HOST=cartdb.czwk442a8alq.eu-central-1.rds.amazonaws.com,DB_PORT=5432,DB_USER=postgres,DB_PASSWORD=postgres,DB_NAME=cartdb`
![image](https://github.com/user-attachments/assets/4c497be7-e8df-46cc-a08f-0dd2df9c6fac)
On the FE side we are using PROXY from  `https://d3i4i6d65bcscf.cloudfront.net` to `http://huntertigerx-cart-api-dev.eu-central-1.elasticbeanstalk.com/`, because of the mixed requests, since we need to use single instance and to manually add SSL key we need to either use Route 53 or own a host. Keys made by user did not work.
4.1 Deploy FE: https://d138sljllinulj.cloudfront.net
4.2 Deploy BS: http://huntertigerx-cart-api-dev.eu-central-1.elasticbeanstalk.com
4.2 Deploy Lambda: https://wu9umi35c8.execute-api.eu-central-1.amazonaws.com/prod
5. Done 12.04.2025 / deadline 13.04.2025
6. Score: 100 / 100
- Basic Scope
- [x] **+0** Dockerfile is prepared, image is building. Image size is minimized to be less than 500 MB.
- [x] **+0** Dockerfile is optimized. Files that change more often and commands that depend on them should be included later, files and commands that change less should be at the top.
- [x] **+70** Folders are added to .dockerignore, with explanations. At least 2 big directories should be excluded from build context. Elastic Beanstalk application is initialized.
- Additional (optional) tasks
- [x] **+15** Environment is created and the app is deployed to the AWS cloud. You must provide a link to your GitHub repo with Cart Service API or PR with created Dockerfile and related configurations.
- [x] **+15** FE application is updated with Cart API endpoint. You must provide a PR with updates in your FE repository and OPTIONALLY link to deployed front-end app which makes proper API calls to your Cart Service.

Example's body 1
```
{
  "username": "huntertigerx3",
  "password": "TEST_PASSWORD"
}
```
Example's body 2
```
{
    "product": {
      "id": "906a2bc0-1c03-4c47-ac55-c95299981ee8"
    },
    "count": 1
  }
```
 Example's body 3
 ```
 {
    "items": [
        {
            "productId": "906a2bc0-1c03-4c47-ac55-c95299981ee8",
            "count": 2
        },
    ],
    "address": {
        "comment": "test comment",
        "address": "test address",
        "lastName": "real last name",
        "firstName": "unreal first name"
    }
}
```