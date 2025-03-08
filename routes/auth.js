const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User  = require('../models/user')
const config = require('../config')
require('dotenv').config()
const redis = require('../redis'); 


router.post('/login', async (req, res) => {
    const {email,password}= req.body;

    if(email ===undefined || email === "") return res.status(400).json({
        message:config.email_empty
    });
   
    if(password ===undefined || password === "") return res.status(400).json({
        message:config.password
    });
   
    try {
        const existinguser = await User.findOne({Email:email});
        if(!existinguser) return res.status(400).json({message:"Email does not exists."})
        
        const match = await bcrypt.compare(password, existinguser.Password)
       
        if(match){
            const accessToken = jwt.sign({email,user_id:existinguser._id,username:existinguser.FullName},(process.env.JWT_SECRET || "SECRECT_KEY"),{expiresIn:"1h"});
            const refreshToken = jwt.sign({email,username:existinguser.FullName,user_id:existinguser._id},(process.env.JWT_SECRET || "SECRECT_KEY"),{expiresIn:"7d"});
         
            res.cookie('refreshToken', refreshToken,
                {
                    httpOnly: true,       // Makes the cookie inaccessible to JavaScript in the client to prevent XSS attacks
                    secure: process.env.NODE_ENV ==="production",         // Ensures the cookie is sent over HTTPS only (useful in production)
                    sameSite: 'Strict',   // Helps prevent CSRF attacks
                    path: '/refresh',     // The path where the cookie is available, e.g., only on /refresh
                    maxAge: 7 * 24 * 60 * 60 * 1000 // Sets expiration 7 days
                }
            );
            if (!(await redis.exists(`user:${existinguser._id}`))) {
                await redis.hset(`user:${existinguser._id}`, "email", email, "username", existinguser.FullName);
                await redis.expire(`user:${existinguser._id}`, 3600);
            }
            return res.status(200).json({
                ok:true,
                message:"User Login Successfull!",
                accessToken,
                userId: existinguser._id
            });
        }
        return res.status(400).json({
            message:"Incorrect password.",
        });   
    } catch (error) {
        return res.status(500).json({
            ok:false,
            message:"Internal Server Error"||error           
        });
    }
});


router.post('/register',async(req,res)=>{
    const {email,fullName,phoneNumber,password,confirmPassword,address}= req.body;

    if(email ===undefined || email === "") return res.status(400).json({
        message:config.email_empty
    });
    if(fullName ===undefined || fullName === "") return res.status(400).json({
        message:config.fullName_empty
    });
    if(phoneNumber ===undefined || phoneNumber === "") return res.status(400).json({
        message:config.phonenumber
    });
    if(password ===undefined || password === "") return res.status(400).json({
        message:config.password
    });
    if(confirmPassword ===undefined || confirmPassword === "") return res.status(400).json({
        message:config.confirmPassword
    });
    if(address ===undefined || address === "") return res.status(400).json({
        message:config.address
    });

    if(password !== confirmPassword ) return res.status(400).json({
            message:"password does not match. Please try again.."
    });

    const hashedPassword = await bcrypt.hash(password,10);
    try {
        const existinguser = await User.findOne(
            {$or:[{Email:email},{PhoneNumber:phoneNumber}]}
        );
        if(existinguser) return res.status(400).json({message:"Email/Phone already exists."})
        const newUser  = new User({
            Email:email,
            FullName : fullName,
            Password:hashedPassword,
            PhoneNumber:phoneNumber,
            Address:address
        });

        newUser.save()
        const accessToken = jwt.sign({email,username:fullName,user_id:newUser._id},(process.env.JWT_SECRET || "SECRECT_KEY"),{expiresIn:"1h"});
        const refreshToken = jwt.sign({email,username:fullName,user_id:newUser._id},(process.env.JWT_SECRET || "SECRECT_KEY"),{expiresIn:"7d"});
        res.cookie('refreshToken', refreshToken,
            {
                httpOnly: true,       // Makes the cookie inaccessible to JavaScript in the client to prevent XSS attacks
                secure: process.env.NODE_ENV ==="production",        // Ensures the cookie is sent over HTTPS only (useful in production)
                sameSite: 'Strict',   // Helps prevent CSRF attacks
                path: '/refresh',     // The path where the cookie is available, e.g., only on /refresh
                maxAge: 7 * 24 * 60 * 60 * 1000 // Sets expiration 7 days
            }
        );
        if (!(await redis.exists(`user:${newUser._id}`))) {
            await redis.hset(`user:${newUser._id}`, "email", email, "username", fullName);
            await redis.expire(`user:${newUser._id}`, 3600);
        }
        return res.status(201).json({
            ok:true,
            message:"User Registered Successfully!",
            accessToken,
            userId:newUser._id
        });
    } catch (error) {
        return res.status(500).json({
            ok:false,
            message:"Internal Server Error"||error           
        });
    }
})


router.post("/refresh", async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({ message: "Refresh token is required." });
        }

        // Verify the refresh token
        jwt.verify(refreshToken, (process.env.JWT_SECRET || "SECRECT_KEY"), async (err, decoded) => {
            if (err) {
                return res.status(403).json({ message: "Invalid or expired refresh token." });
            }

            // Check if the user exists
            const user = await User.findById(decoded.user_id);
            if (!user) {
                return res.status(404).json({ message: "User not found." });
            }

            // Generate a new access token
            const newAccessToken = jwt.sign(
                { email: user.Email, username: user.FullName, user_id: user._id },
                process.env.JWT_SECRET,
                { expiresIn: "1h" } // Access token expires in 15 minutes
            );
            if (!(await redis.exists(`user:${user._id}`))) {
                await redis.hset(`user:${user._id}`, "email", user.Email, "username", user.FullName);
                await redis.expire(`user:${user._id}`, 3600);
            }
            
            return res.status(200).json({
                ok: true,
                accessToken: newAccessToken,
            });
        });

    } catch (error) {
        console.error("Error in refresh token:", error);
        res.status(500).json({ message: "Internal server error." });
    }
});


module.exports = router;





