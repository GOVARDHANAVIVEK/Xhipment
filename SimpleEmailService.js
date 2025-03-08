const AWS = require('aws-sdk');
const redis = require('./redis')
// Configure SES
const ses = new AWS.SES({ region: 'us-east-1' });

async function sendEmail({order,userId}) {
    if (!order || !order.Items || !order._id || !order.TotalAmount) {
        console.error('Invalid order object:', order);
        return;
    }
    const recieverEmail = await redis.hget(`user:${userId}`, "email")
   
    const statusColor = order.Status === "Processed" ? "green" : "red";

    const orderItemsHtml = order.Items.map(item => `
        <tr>
            <td>${item.productId}</td>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>₹${item.price}</td>
        </tr>
    `).join("");

    const bodyTemplate = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
                .container { width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; background: #fff; }
                .header { background-color: #4CAF50; color: white; text-align: center; padding: 10px; font-size: 20px; }
                .content { padding: 20px; }
                .order-details { width: 100%; border-collapse: collapse; margin-top: 20px; }
                .order-details th, .order-details td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                .footer { text-align: center; font-size: 12px; color: #666; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">Order Confirmation</div>
                <div class="content">
                    <p>Dear Customer,</p>
                    <p>Thank you for your order! Below are the details:</p>
                    <p><strong>Order ID:</strong> ${order._id}</p>
                    <p><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${order.Status}</span></p>
                    <table class="order-details">
                        <tr>
                            <th>Product ID</th>
                            <th>Product Name</th>
                            <th>Quantity</th>
                            <th>Price</th>
                        </tr>
                        ${orderItemsHtml}
                    </table>
                    <p><strong>Total Amount:</strong> ₹${order.TotalAmount.toFixed(2)}</p>
                    <p>We appreciate your business!</p>
                </div>
                <div class="footer">
                    &copy; 2025 YourCompany. All rights reserved.
                </div>
            </div>
        </body>
        </html>`;

    // Plain text version for email clients that don't support HTML
    const plainTextBody = `
        Order Confirmation

        Dear Customer,

        Thank you for your order! Below are the details:

        Order ID: ${order._id}
        Status: ${order.Status}

        Items:
        ${order.Items.map(item => `${item.productId} | ${item.name} | ${item.quantity} | ₹${item.price}`).join("\n")}

        Total Amount: ₹${order.TotalAmount.toFixed(2)}

        We appreciate your business!`;
    
    
    const params = {
        Source: process.env.SenderEmailAddress, // Must be a verified SES email
        Destination: {
            ToAddresses: [recieverEmail],
        },
        Message: {
            Subject: { Data: `Your Order - ${order._id} Details` },
            Body: {
                Html: { Data: bodyTemplate },
                Text: { Data: plainTextBody },
            },
        },
         // or your configuration set name
    };

    try {
        const result = await ses.sendEmail(params).promise();
        console.log('✅ Email sent successfully:', result);
    } catch (error) {
        console.error('❌ Error sending email:', error);
    }
}

module.exports = sendEmail;
