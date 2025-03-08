const router = require('express').Router();
const OrdersModel = require('../models/order');
const UserModel = require('../models/user')
const config = require('../config');
const verifyToken = require('../middlewares/TokenVerify')
const InventoryModel = require('../models/inventory')
const mongoose = require('mongoose')

const addOrderToQueue= require('../OrderQueue')

const redis = require('../redis'); 



// create order route
router.post("/", verifyToken, async (req, res) => {
    const { userId, items = [], status } = req.body;
    let totalAmount =0
    if (userId === "" || userId === undefined) return res.status(400).json({
        message: config.userId
    });
    if (items.length === 0 || items == []) return res.status(400).json({
        message: config.items
    });
    // if (totalAmount === 0) return res.status(400).json({
    //     message: config.totalAmount
    // });

    const productIds = items.map(product => product.productId);
    const quantityMap = items.reduce((acc, product) => {
        totalAmount += product.price * product.quantity
        acc[product.productId] = parseInt(product.quantity) || 0;
        return acc;
    }, {});

    const inventoryItems = await InventoryModel.find(
        { ProductId: { $in: productIds } },
        { _id: 0, ProductId: 1, StockLeft: 1}
    );
    let stock =[]
    console.log("inventoryItems",inventoryItems)
    inventoryItems.map(item => {
        if(quantityMap[item.ProductId] > item.StockLeft ){
            stock.push(item.ProductId)
        }
       
    });    

    if(stock.length>0){
        console.log("some products are outof stock..")
        return res.status(400).json({
            message:"Order rejected due to insufficient stock.."
        });
    }
    console.log("In Stock.")

    try {
        const newOrder = new OrdersModel({
            UserId:userId,
            Items:items,
            TotalAmount:totalAmount,
            Status:status
        });
        console.log("newOrder",newOrder)
        await newOrder.save();
        addOrderToQueue({id:newOrder._id,status:newOrder.Status,userId:newOrder.UserId})
        return res.status(200).json({
            succes:true,
            message:"Order Placed Successfully",
            result:newOrder
        });
    } catch (error) {
        return res.status(500).json({
            succes:false,
            message:"Internal Server Error: ",error
        });
    }
});

// get order route
router.get('/:orderid', verifyToken, async (req, res) => {

    const { orderid } = req.params;

    try {
        const exists = await redis.exists(orderid);
        if (exists) { // Corrected: Check if it exists
            console.log("from redis.....")
            const data = await redis.get(orderid);
            const parsedData = JSON.parse(data); // Parse JSON from Redis
            return res.status(200).json({
                success: true,
                result: parsedData,
            });
        }
        console.log("from api.....")
        // If the order is not in Redis, query MongoDB
        const order = await OrdersModel.findById(orderid);
    
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "No order found.",
            });
        }
    
        console.log("Stringified Order:", JSON.stringify(order)); // Add this line
        await redis.set(orderid, JSON.stringify(order), 'EX', 60);
    
        return res.status(200).json({
            success: true,
            result: order,
        });
    
    } catch (error) {
        console.error("Error during Redis or MongoDB operation:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
    


});


module.exports = router