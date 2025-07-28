const express = require('express');
const userRouter = express.Router();
const cloudinary = require("../config/cloudinary.js");
const upload = require("../config/multerConfig.js");
const streamifier = require("streamifier");
const {UserModel} = require("../models/user.js");
const userAuth = require('../middlewares/userAuth.js');
const ConnectionRequestModel = require('../models/connectionRequest.js');
const { isObjectIdOrHexString, default: mongoose } = require('mongoose');
const { sendMessage } = require('../utils/kafka.js');
userRouter.patch("/update/:userId",userAuth, async (req,res)=>{
     console.log("Update user called");
    const userObj=req.body;
    console.log("userObj",userObj);
   
    try{
        const {userId} = req.params;
        const isAllowedUpdates=["gender","age","skills","photoUrl","about"];
       Object.keys(userObj).forEach((k)=>{
      if(!isAllowedUpdates.includes(k)){
        throw new Error("Update not allowed");
      }
       })
        
       const objuser= await UserModel.findByIdAndUpdate(userId,userObj,{
        runValidators:true
       });
       await objuser.save();    
        res.send(objuser);
    }
    catch(e){
        res.send("something went wrong"+e)
    }

})
userRouter.delete('/',userAuth,async (req,res)=>{
    console.log("Delete user called");
    try{
       const userId=req.body.userId;
        const user = await UserModel.findByIdAndDelete(userId);
        res.send("user deleted successfully ",user);
    }
    catch(e){
        res.status(400).send("something went wrong")
    }
})
userRouter.post("/upload-profile/:userId", upload.single("profile"), async (req, res) => {
  try {
    const file = req.file;
    const { userId } = req.params;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }


    const streamUpload = (buffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "profiles" },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );
        streamifier.createReadStream(buffer).pipe(stream);
      });
    };

    const result = await streamUpload(file.buffer);


    const user = await UserModel.findByIdAndUpdate(
      userId,
      { photoUrl: result.secure_url },
      { new: true }
    );
    await sendMessage('profile-updates', {
      updatedUser: user
    });
    res.json({ success: true, imageUrl: result.secure_url });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ message: "Image upload failed" });
  }
});


userRouter.get('/connections',userAuth, async(req,res)=>{
    try{
        const loggedInUser=req.user;
    const requests= await ConnectionRequestModel.find({
       $or: [
              {  toUserId:loggedInUser._id,
    status:"accept" },
              {  fromUserId:loggedInUser._id,
    status:"accept" }
            ]
   
}).populate("fromUserId",["firstName","lastName","photoUrl","about"]).populate("toUserId",["firstName","lastName","photoUrl","about"]);
const data = requests.map((re)=>{

  console.log("from",re.fromUserId._id);
  console.log("logged",loggedInUser._id)
  if((re.fromUserId._id).equals((loggedInUser._id))){
      console.log("Entered here")
      return {
       id: re._id,
       friend: re.toUserId
      } 
  }
  else{
    return {
       id: re._id,
       friend: re.fromUserId
      } 
  }

})

res.status(200).send({message:"Friend fetched successfully",data:data});
      
    }
    catch(e){
        res.status(400).send("Server error"+ e);
    }

})

userRouter.get('/feed',userAuth,async (req,res)=>{
    console.log("Feed called");
    try{
      console.log("Feed called");
           let limit = parseInt(req.query.limit) || 10; // Convert to number safely
    const page = parseInt(req.query.page) || 1;
       limit= limit>30?30:limit;
       let skip=(page-1)* limit;
        const loggedInUser= req.user;
        console.log("Logged in user",loggedInUser);
        const requests= await ConnectionRequestModel.find({
          $or:[
            {fromUserId:loggedInUser._id},
            {toUserId:loggedInUser._id}
          ]
        }).select(["fromUserId","toUserId"]);


        let hideUsersFromFeed= new Set();
        requests.map((req)=>{
           hideUsersFromFeed.add(req.fromUserId._id.toString());
           hideUsersFromFeed.add(req.toUserId._id.toString())
        })
        hideUsersFromFeed.add(loggedInUser._id.toString());

        const feed= await UserModel.find({
          _id:{
            $nin:Array.from(hideUsersFromFeed),
          }
        }).skip(skip).limit(limit);;
        res.send({
          data:feed
        });
    }
    catch(e){
      console.log("Error in feed:", e);
        res.status(400).send("something went wrong"+ e)
    }
   
  
})
userRouter.get('/:id',userAuth,async (req,res)=>{
  
    try{
        const userId = req.params.id;
     
const objectId = new mongoose.Types.ObjectId(userId);

        const user = await UserModel.findOne({_id:objectId});
      if(!user){
        res.send("user not found")
      }
      else{
        res.send(user)
      }
    }
    catch(e){
        res.status(400).send("something went wong")
    }
})
module.exports = userRouter;