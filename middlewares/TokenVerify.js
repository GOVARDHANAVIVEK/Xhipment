const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    // console.log("token:::::", token)
    if (!token || !token.startsWith('Bearer ')) {
        return res.status(403).send("Access denied, no token provided");
    }

    const actualToken = token.split(' ')[1];  // Extract the token
    try {
        const decoded = jwt.verify(actualToken, process.env.JWT_secret);  // Verify the token
         // Attach the decoded payload to the request
        req.user = decoded;
        // console.log("user------>"+JSON.stringify(req.user)) 
        next(); 
    } catch (error) {
        return res.status(401).json({
            message:"Invalid token: ",error
        })
    }
};

module.exports = verifyToken;