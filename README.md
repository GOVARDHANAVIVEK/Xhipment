# Xhipment


## Get Started

1. Install Dependencies:
        
            npm install 

    - "aws-sdk": "^2.1692.0",
    - "bcryptjs": "^3.0.2",
    - "body-parser": "^1.20.3",
    - "bullmq": "^5.41.7",
    - "cookie-parser": "^1.4.7",
    - "dotenv": "^16.4.7",
    - "express": "^4.21.2",
    - "express-rate-limit": "^7.5.0",
    - "ioredis": "^5.6.0",
    - "jsonwebtoken": "^9.0.2",
    - "mongoose": "^8.12.1",

2. create .env file in ./ with following key:values
                
            PORT = port_number {3000}
            MONGOOSE_URI = your_mongodb_url (cloud_version)
            JWT_SECRET = your_secret_value
            NODE_ENV = dev #set this to production when deploy
            AWS_REGION= set_your_aws_regieon (ex:use-east-1)
            AWS_ACCESS_KEY_ID= your_aws_access_key_id
            AWS_SECRET_ACCESS_KEY= your_aws_secret_access_key
            SQS_QUEUE_URL= your_aws_sqs_queue_url (ex:https://sqs.xxx.amazonaws.com/xxxx/your_queue)
            SenderEmailAddress = configure_sender_email_address

3. start the redis :

           docker run -d --name redis -p 6379:6379 redis

4. Setup SQS with new Queue creation. COpy the Queue URL and and update in the .env file

5. Setup SES in AWS and verify sneder and reciever Email in SES to enable email serveices.

6. run command :

   Server.js
   
           npm run start
   
   Worker.js
   
           node workerQueue.js 



# API Testing collection:

        [Xhimpent.postman_collection.json](https://github.com/user-attachments/files/19147710/Xhimpent.postman_collection.json)


# MongoDb Inventory and Order collection: 



      [Xhipment.inventories.json](https://github.com/user-attachments/files/19145347/Xhipment.inventories.json)
      [Xhipment.orders.json](https://github.com/user-attachments/files/19145349/Xhipment.orders.json)

