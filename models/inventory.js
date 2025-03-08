const mongoose=require('mongoose')
const inventorySchema = new mongoose.Schema({
    ProductId: { type: String, required: true},
    Name: { type: String, required: true },
    PriceOfEach: { type: Number, required: true },
    StockLeft: { type: Number, required: true }
},{ timestamps: true });

const Inventory = mongoose.model('Inventory',inventorySchema)
module.exports = Inventory