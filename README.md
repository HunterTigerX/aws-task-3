P.S. After I made screenshots I changed AWS account so the URL in PR to cloudfront was changed, but everything is working the same.  
1. Task: https://github.com/rolling-scopes-school/aws/blob/main/aws-developer/06_async_microservices_communication/task.md
2. Screenshot:  
At first I created a JSON data
![image](https://github.com/user-attachments/assets/7bc9aba8-7422-4388-b45b-cbf48f02795f)
Then I converted it to CSV and uploaded at the front-end side
![image](https://github.com/user-attachments/assets/ad388590-2a62-4beb-a0e2-e10c405ccb4a)
catalogBatchProcess cloudwatch logs
![image](https://github.com/user-attachments/assets/dcd7a989-fa26-47c4-8541-64c67c824b8c)
![image](https://github.com/user-attachments/assets/b3ff271e-c30a-4ecf-b25b-efee16da29fb)
ImportProductsFile cloudwatch logs
![image](https://github.com/user-attachments/assets/b7c3f9ec-c82b-45cf-884b-2037a4fba71f)
ImportFileParser cloudwatch logs
![image](https://github.com/user-attachments/assets/ee83158d-bb9a-48c2-84eb-3488e1a6a0bd)
Amazon SNS Topic was created and subscriptions were added
![image](https://github.com/user-attachments/assets/4200e3e5-f84d-43be-a97d-851c9c2afcde)
Amazon SQS queue was created and working fine
![image](https://github.com/user-attachments/assets/754a6aa8-6696-4807-bca2-c62853faa7d0)
Email subscription is working fine
![image](https://github.com/user-attachments/assets/7dce6b45-c030-4b18-b5db-c466dff63f7a)
![image](https://github.com/user-attachments/assets/76a2988a-dd19-448d-953e-093812837ce3)
The new records are now shown on our FE app.
![image](https://github.com/user-attachments/assets/f8bd9957-8e09-4db1-ba28-03440fcb0307)
![image](https://github.com/user-attachments/assets/0c15bfca-5d77-4e6f-a0d5-1bd59223786d)
Tests have almost 100% coverage
![image](https://github.com/user-attachments/assets/dab1199c-598e-482b-834d-eb5087706c9a)
![image](https://github.com/user-attachments/assets/9f9a6cf4-d40c-4583-a7fc-bcdccbc90a31)
![image](https://github.com/user-attachments/assets/b06ac401-d46f-4340-b76c-2dada052c454)
3. Deploy: https://d138sljllinulj.cloudfront.net
4. Done 15.03.2025 / deadline 16.03.2025
5. Score: 100 / 100
- Basic Scope
- [x] **+0** AWS CDK Stack contains configuration for catalogBatchProcess function
- [x] **+0** AWS CDK Stack contains policies to allow lambda catalogBatchProcess function to interact with SNS and SQS
- [x] **+0** AWS CDK Stack contains configuration for SQS catalogItemsQueue
- [x] **+70** AWS CDK Stack contains configuration for SNS Topic createProductTopic and email subscription
- Additional (optional) tasks
- [x] **+15** catalogBatchProcess lambda is covered by unit tests
- [x] **+15** set a Filter Policy for SNS createProductTopic in AWS CDK Stack and create an additional email subscription to distribute messages to different emails depending on the filter for any product attribute