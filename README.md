1. Task: https://github.com/rolling-scopes-school/aws/blob/main/aws-developer/05_integration_with_s3/task.md
2. Screenshot:  
We created CSV file
![image](https://github.com/user-attachments/assets/18849b8d-f8d5-4934-9e61-95aad284b005)
We added it on the website
![image](https://github.com/user-attachments/assets/b5e27767-7d20-493c-a8ec-de0639c72ee5)
We uploaded it
![image](https://github.com/user-attachments/assets/2205bc7e-6851-498a-91c8-f88ff3f1490c)
We checked CloudWatch event
![image](https://github.com/user-attachments/assets/0d8c5fd1-ea47-485b-b7d2-972708285726)
We checked Bucket folders
![image](https://github.com/user-attachments/assets/4cdc7e25-c9f5-4d49-8703-c42584efe52f)
There are no tableConvert.com_3.csv in uploaded, only old files, because I just implemented last requirement
![image](https://github.com/user-attachments/assets/2ab8d872-64c8-4eb6-bac0-c8248500714c)
And tableConvert.com_3.csv only exists in parsed
![image](https://github.com/user-attachments/assets/ac5f75d9-9e17-466d-811f-5d7d47a74bf2)
Tests have 100% coverage
![image](https://github.com/user-attachments/assets/c9b451bb-c5f9-43e6-9e73-18f57e99fed0)
3. Deploy: https://ducodo879x8ic.cloudfront.net
4. Done 08.03.2025 / deadline 09.03.2025
5. Score: 100 / 100
- Basic Scope
- [x] **+0** AWS CDK Stack contains configuration for importProductsFile function
- [x] **+0** The importProductsFile lambda function returns a correct response which can be used to upload a file into the S3 bucket
- [x] **+0** Frontend application is integrated with importProductsFile lambda
- [x] **+70** The importFileParser lambda function is implemented and AWS CDK Stack contains configuration for the lambda
- Additional (optional) tasks
- [x] **+10** importProductsFile lambda is covered by unit tests. S3 and AWS SDK methods are mocked so actual AWS services are not trigger while unit testing.
- [x] **+10** importFileParser lambda is covered by unit tests.
- [x] **+10** At the end of the stream the lambda function should move the file from the uploaded folder into the parsed folder (move the file means that file should be copied into a new folder in the same bucket called parsed, and then deleted from uploaded folder)

P.S. Swagger was not updated for this task because there were no requriments to do so. All requests can be done by postman at https://web.postman.co.