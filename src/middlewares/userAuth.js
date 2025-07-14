const {UserModel} = require('../models/user');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');


const verifyTokenAsync = (token, secret) => {
  return new Promise((resolve, reject) => {
        jwt.verify(token, secret, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded);
    });
  });
};

   const RefreshTokenHere=async (req,res,next)=>{
        const refreshToken = req.cookies.refreshToken;
          console.log("Refresh Token:", refreshToken);
             const decodedrefresh = await verifyTokenAsync(refreshToken, "Cometchat");
                const id= decodedrefresh.id;
                const refrenceuser = await UserModel.findById({_id:id});
                if(refrenceuser){
                    const refresh= await refrenceuser.refreshToken;
                    let newtoken = '';
                    if(refresh === refreshToken){
                         await  refrenceuser.getJwtToken().then((token)=>{
                    console.log("Token generated successfully",token);
                          newtoken=token;
                            res.clearCookie('token');
                            res.cookie('token',newtoken);
         });    
                 req.user = refrenceuser
                    }
                }

      
        next();
   }
 const userAuth= async (req, res, next) => {

    console.log("User Auth Middleware called");
const token = req.cookies.token;
        if (!token) {   

        return res.status(401).send("Access denied. No token provided.");
    }

   try {
    console.log("Token:", token);
  const decodedObj = await verifyTokenAsync(token, "Cometchat");
  console.log("Decoded Object:", decodedObj);
   const user = await UserModel.findById({_id:decodedObj.id});
    req.user = user;
  next();
} catch (err) {
  if (err.name === 'TokenExpiredError') {
      console.log("Token expired, checking for refresh token");
    if (req.cookies.refreshToken) {
      return RefreshTokenHere(req, res, next); // This will get a new token and attach the user
    }
  }
  return res.sendStatus(403); // invalid or missing token
}
}
module.exports = userAuth;