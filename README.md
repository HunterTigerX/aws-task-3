To get 401 error, you need to run in the console in your browser  
localStorage.removeItem("authorization_token");
To get 403 error, you need to run in the console in your browser  
localStorage.setItem("authorization_token", "anything")
To get 200 and a successful import, you need to run in the console in your browser  
localStorage.setItem("authorization_token", "aHVudGVydGlnZXJ4PVRFU1RfUEFTU1dPUkQ=")
This command will show you the current value of the token in your browser
localStorage.getItem("authorization_token")
Test authorizer in AWS both work with `Basic aHVudGVydGlnZXJ4PVRFU1RfUEFTU1dPUkQ= `and `aHVudGVydGlnZXJ4PVRFU1RfUEFTU1dPUkQ=` for testing purposes.

1. Task: https://github.com/rolling-scopes-school/aws/blob/main/aws-developer/07_authorization/task.md
2. Screenshot:  
This is our encoded example  
![image](https://github.com/user-attachments/assets/bfb01b6b-a94e-4588-95a2-479a55413a03)
This is 401 error if the header is empty on FE side
![image](https://github.com/user-attachments/assets/8bbbb4bb-5eb0-48da-943b-47f75515a9f1)
This is 403 error if the token is invalid on FE side
![image](https://github.com/user-attachments/assets/829e922f-1a39-42a0-87ab-327a0c6b445d)
This is 200 success, if the token is valid on FE side
![image](https://github.com/user-attachments/assets/6de0085b-edf0-4299-a3de-1dfda3a16002)
This is 200 success, if the token is valid in AWS
![image](https://github.com/user-attachments/assets/d70c04e6-7e86-41f3-83e8-b66256cf7e0a)
This is 403 error if the token is invalid in AWS
![image](https://github.com/user-attachments/assets/7b2b1e3b-43a0-4e08-be83-23da88d48b68)
This is 401 error if the header is empty in AWS
![image](https://github.com/user-attachments/assets/a707011f-1c2a-4f85-9332-4abc09d630b8)
3. Deploy: https://d138sljllinulj.cloudfront.net
4. Done 21.03.2025 / deadline 23.03.2025
5. Score: 100 / 100
- Basic Scope
- [x] **+0** authorization-service is added to the repo, has correct basicAuthorizer lambda and correct AWS CDK Stack
- [x] **+0** Import Service AWS CDK Stack has authorizer configuration for the importProductsFile lambda. Request to the importProductsFile lambda should work only with correct authorization_token being decoded and checked by basicAuthorizer lambda. Response should be in 403 HTTP status if access is denied for this user (invalid authorization_token) and in 401 HTTP status if Authorization header is not provided.
- [x] **+70** Client application is updated to send "Authorization: Basic authorization_token" header on import. Client should get authorization_token value from browser localStorage
- Additional (optional) tasks
- [x] **+30** Client application should display alerts for the responses in 401 and 403 HTTP statuses. This behavior should be added to the nodejs-aws-fe-main/src/index.tsx file.