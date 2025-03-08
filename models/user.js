const mongoose=require('mongoose')
const userSchema = new mongoose.Schema({
    Email:{
            type:String,
            required:true,
            unique:true,
            default:undefined
    },
    PhoneNumber:{
            type:Number,
            required:true,
            unique:true,
            default:undefined
    },
    FullName:{
            type:String,
            required:true,
            default:undefined
    },
    Address:{
            type:String,
            required:true,
            default:undefined
    },
    Password:{
            type:String,
            required:true,
            default:undefined
    },
    ConfirmPassword:{
            type:String,
            
    }
},{ timestamps: true });

const User = mongoose.model('user',userSchema)
module.exports = User