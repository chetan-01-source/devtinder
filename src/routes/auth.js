const express = require('express');
const authRouter = express.Router();
const bcrypt = require('bcrypt');
const {SignUpSchema} = require('../utils/SignUpSchema.js');
const validator = require('validator');
const {UserModel} = require("../models/user.js");
const {LoginSchema} = require('../utils/LoginSchema.js');
const userAuth = require('../middlewares/userAuth.js');
const twilio = require("twilio");
const redisClient = require('../config/redisClient.js')
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

const twilioClient = twilio(accountSid, authToken); 



authRouter.post("/requestOtp", async (req,res)=>{

    const { phoneNumber } = req.body;

    try{
             if (!phoneNumber || !/^\d{10}$/.test(phoneNumber)) {
    return res.status(400).json({ message: "Invalid phone number" });
  }
  const fullNumber = "+91" + phoneNumber; // or adjust country code as needed
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
   await twilioClient.messages.create({
      body: `: ${otp} is your one time password to proceed on DevTinder. It is valid for 2 minutes. Do not share OTP with anyone.`,
      from: fromNumber,
      to: fullNumber,
    });
     await redisClient.setEx(`otp:${fullNumber}`, 120, JSON.stringify({
      phoneNumber,
      otp,
      verified: false,
    }));

    res.json({ message: "OTP sent successfully" });
    }
    catch(e){
            console.error("❌ Twilio Error:", e);
    res.status(500).json({ message: "Failed to send OTP", error: e.message });
    }
    
})


authRouter.post("/verifyOtp",async(req,res)=>{
      const { phoneNumber, otp } = req.body;
      if (!phoneNumber || !otp || otp.length !== 6) {
    return res.status(400).json({ message: "Phone number and OTP are required" });
  }
     const fullNumber = "+91" + phoneNumber;

     try{
          const value = await redisClient.get(`otp:${fullNumber}`);
    if (!value) {
      return res.status(400).json({ message: "OTP expired or invalid" });
    }
        const otpData = JSON.parse(value);
        if (otpData.otp !== otp) {
      return res.status(400).json({ message: "Incorrect OTP" });
    }
       await redisClient.set(`otp:${fullNumber}`, JSON.stringify({
      verified: true
    }));
    res.status(200).json({ message: "Phone number verified successfully" });


     }
     catch(e){
        console.error("❌ OTP Verification Error:", err);
        res.status(500).json({ message: "Something went wrong", error: err.message });
     }
})
authRouter.post("/signup",async (req,res)=>{
    const userObj=req.body;

    // Validate the user object against the schema

    
  
    try{
         const result = SignUpSchema.safeParse(userObj); 
         if(!result.success){
            console.log("Validation failed:", result.error.errors);
         throw new Error(result.error.errors.map(e => e.message).join(', '));

         }
         console.log("userObj",userObj);
          if(!validator.isStrongPassword(userObj.password, {
            minLength: 6,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1
          })){
            throw new Error("Password is not strong enough");
          }
     const hashPassword = await bcrypt.hash(userObj.password, 10);
        
        console.log(hashPassword)
            const user = new UserModel({
                firstName: userObj.firstName,
                lastName: userObj.lastName,
                emailId: userObj.emailId,
                age: userObj.age,   
                skills: userObj.skills,
                phoneNumber:userObj.phoneNumber,
                about: userObj.about,
                password: hashPassword,
                photoUrl: userObj.photoUrl,
            });
            const fullNumber = "+91" + user.phoneNumber;

              const value = await redisClient.get(`verified:${fullNumber}`);
              if(!value){
                return res.status(400).send("Internal server error: Mobile number verification failed");
              }

           await user.save();
    res.send("user added successfully",user);
    }
    catch(e){
        if(e instanceof Object ){
            console.log("error occred", JSON.stringify(e, null, 2));
             res.status(500).send("Internal error occured: "+e);
        }
        else{
            res.status(500).send("Error: "+e.message);
        }
        
       
    }  
 

})

authRouter.post('/login',async (req,res)=>{
    const {emailId, password} = req.body;
    
    try{
        if(!emailId || !password){
            throw new Error("Email and password are required");
        }   
        
       const result= LoginSchema.safeParse({emailId});
       if(!result.success){
        throw new Error("Invalid credentials");
       } // Validate the input against the schema
        const user = await UserModel.findOne({emailId});
        if(!user){
            throw new Error("Invalid credentials");
        }
        const isMatch = await user.validatePassword(password);
        if(!isMatch){
            throw new Error("Invalid credentials");
        }
        let restoken = '';
        await  user.getJwtToken().then((token)=>{
     console.log("Token generated successfully",token);
            restoken=token;
         });    
        let refstoken = '';
        await user.getrefreshToken().then((token)=>{
            console.log("Refresh Token generated successfully",token);
            refstoken=token;
        });

            user.refreshToken = refstoken;
              await user.save();
              res.cookie('refreshToken', refstoken);
              res.cookie('token',restoken) ;
      
        res.send("Login successful");
    }
    catch(e){
        res.status(400).send("Error: "+e.message);
    }
})
authRouter.post('/logout',userAuth,async(req,res)=>{
    const user= req.user;
    res.clearCookie('token');
    res.cookie('token', '', { expires: new Date(0) }); // Clear the token cookie
    res.cookie('refreshToken', '', { expires: new Date(0) }); // Clear the refresh token cookie
    res.clearCookie('refreshToken');
    user.refreshToken = '';
    await user.save();
    res.send("Logout successful");
})
module.exports = authRouter;