const express = require('express');
const userRouter = express.Router();

const {UserModel} = require("../models/user.js");
const userAuth = require('../middlewares/userAuth.js');
const ConnectionRequestModel = require('../models/connectionRequest.js')
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
userRouter.get('/',userAuth,async (req,res)=>{
    console.log("Get user called");
    try{
        const email = req.body.emailId;
      const user= await UserModel.findOne({emailId:email});
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
    try{

        let limit=req.query.limit;
        const page=req.query.page || 1;
       limit= limit>30?30:limit;
       let skip=(page-1)* limit;
        const loggedInUser= req.user;
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
        res.status(400).send("something went wrong"+ e)
    }
   
  
})
module.exports = userRouter;