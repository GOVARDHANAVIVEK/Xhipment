require("dotenv").config();

//amazon web services 
const AWS = require("aws-sdk");
AWS.config.update({ region: process.env.AWS_REGION });

const sqs = new AWS.SQS(); // create new SQS instance
const queueUrl = process.env.SQS_QUEUE_URL; // SQS Queue URL

async function addOrderToQueue(order) {
    if (!order.id || !["Pending", "Processed", "Failed"].includes(order.status)) {
        console.error("Invalid order data:", order);
        return;
    }

    //send order status and order ID as payload 
    const params = {
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(order)
    };

    try {
        await sqs.sendMessage(params).promise();
        console.log("Order added to queue:", order.id);
    } catch (error) {
        console.error("Error adding order to queue:", error);
    }
}

module.exports = addOrderToQueue;
