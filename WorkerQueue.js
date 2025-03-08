require("dotenv").config();
const AWS = require("aws-sdk");
const mongoose = require("mongoose");
const OrdersModel = require("./models/order"); // Ensure this points to the correct file
const sendEmail = require('./SimpleEmailService')
AWS.config.update({ region: process.env.AWS_REGION });
const sqs = new AWS.SQS();
const queueUrl = process.env.SQS_QUEUE_URL;
const connectToDatabase = require('./middlewares/connectDB')



async function processOrders() {
    if (mongoose.connection.readyState !== 1) {
        console.log("MongoDB not ready, waiting...");
        return;
    }

    const params = {
        QueueUrl: queueUrl,
        MaxNumberOfMessages: 5,
        WaitTimeSeconds: 10
    };

    try {
        const data = await sqs.receiveMessage(params).promise();
        if (!data.Messages || data.Messages.length === 0) {
            console.log("No orders to process.");
            return;
        }

        for (const message of data.Messages) {
            const orderData = JSON.parse(message.Body);
            console.log("Processing Order:", orderData);

            // Validate Order ID
            if (!mongoose.Types.ObjectId.isValid(orderData.id)) {
                console.error("Invalid Order ID:", orderData.id);
                continue;
            }

            // Fetch Order from DB
            const order = await OrdersModel.findById(orderData.id);
            if (!order) {
                console.log("Order not found:", orderData.id);
                continue;
            }

            // Process Order
            const isSuccess = Math.random() > 0.2; // 80% success rate
            const newStatus = isSuccess ? "Processed" : "Failed";

            // Ensure status update is valid
            if (!["Pending", "Processed", "Failed"].includes(newStatus)) {
                console.error("Invalid status:", newStatus);
                continue;
            }

            order.Status = newStatus;
            await order.save();
            console.log(`Order ${order._id} updated to ${order.Status}`);
            console.log("calling mail service SE")
            sendEmail({order,userId:order.UserId})
            // Delete Message from Queue
            await sqs.deleteMessage({
                QueueUrl: queueUrl,
                ReceiptHandle: message.ReceiptHandle
            }).promise();

            console.log(`🗑 Message deleted from queue: ${message.MessageId}`);
        }
    } catch (error) {
        console.error("Error processing orders:", error);
    }
}
connectToDatabase().then(()=>{
    console.log("Worker started, waiting for orders...");
    setInterval(processOrders, 5000);
}) // Process orders every 5 seconds)