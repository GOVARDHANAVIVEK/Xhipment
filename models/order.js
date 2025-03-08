const mongoose=require('mongoose')
const orderSchema = new mongoose.Schema({
    UserId:{
            type:mongoose.Schema.Types.ObjectId,
            required:true,
            default:undefined
    },
    Items:{
            type:[
                {
                    productId: { type: String, required: true},
                    name: { type: String, required: true },
                    price: { type: Number, required: true },
                    quantity: { type: Number, required: true }
                }
            ],
            required:true,
            default:[]
    },
    TotalAmount:{
            type:Number,
            required:true,
            default:0
    },
    Status:{
            type:String,
            enum: ["Pending", "Processed", "Failed"], 
    default: "Pending"
    }
},{ timestamps: true });

const Orders = mongoose.model('Orders',orderSchema)
module.exports = Orders