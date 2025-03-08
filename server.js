const express = require('express')
const app = express() 
require('dotenv').config()
const PORT = process.env.PORT || 3381

const rateLimiter= require('express-rate-limit')
const bodyParser = require('body-parser')
const authRoute = require('./routes/auth');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser')
const orderRoute = require('./routes/order')

const connectToDatabase = require('./middlewares/connectDB')
const limiter = rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, 
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true, 
    legacyHeaders: false

}
)




// middlewares
app.use(bodyParser.json()) // json parser
app.use(limiter) // rate limiter
app.use(cookieParser())


//route handlers
app.use('/api/auth',authRoute)
app.use("/api/orders",orderRoute)

//initialize mongoose


const startServer = async () => {
    try {
        await connectToDatabase()
        
        app.listen(PORT, () => {
            console.log(`Server running on: http://localhost:${PORT}`);
        });
        
    } catch (error) {
        console.error("Failed to connect server:", error);
        process.exit(1); 
    }
};

startServer();


