const express = require('express');
const mongoose = require('mongoose');
const ConnectionRequestModel = require('../models/connectionRequest.js');
const connectionRequestRouter = express.Router();
const userAuth = require('../middlewares/userAuth.js');
const { z } = require('zod'); // Assuming you're using Zod



//

connectionRequestRouter.post('/send/:status/:toUserId', userAuth, async (req, res) => {
  try {
    const fromUser = req.user;
    const fromUserId = req.user._id;
    const toUserId = req.params.toUserId;
    const status = req.params.status;

    const isAllowed = ['interested', 'ignored'];

    if (!toUserId) {
      return res.status(400).send('The receiver ID is missing');
    }
     

    if (!isAllowed.includes(status)) {
      return res.status(400).send('Request status is invalid');
    }

    const existingRequest = await ConnectionRequestModel.findOne({
      $or: [
        { fromUserId: fromUserId, toUserId: new mongoose.Types.ObjectId(toUserId) },
        { fromUserId: new mongoose.Types.ObjectId(toUserId), toUserId: fromUserId }
      ]
    });

    if (existingRequest) {
      return res.status(400).send('Request already exists');
    }

    const connectionRequest = new ConnectionRequestModel({
      fromUserId: fromUserId,
      toUserId: new mongoose.Types.ObjectId(toUserId),
      status: status
    });

    await connectionRequest.save();

    return res.status(200).send({
      message: 'Connection Request Sent',
      data: { connectionRequest }
    });

  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: err.errors
      });
    }
    console.error(err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

connectionRequestRouter.delete('/remove/:requestId',userAuth,async(req,res)=>{
  try{
     
    const requestId= req.params.requestId;
    const request = ConnectionRequestModel.findOne({
      _id:requestId
    })
    if(!request._id){
      return res.status(400).send("Invalid request or request not found")
    }
  const deletedRequest=  await ConnectionRequestModel.deleteOne({
      _id:requestId,
    },);
   res.status(200).send({
    message:"connection request removed",
    data:deletedRequest
   })  }
  catch(e){
    res.status(400).send("Internal server error: "+e);
  }
})

connectionRequestRouter.post('/review/:status/:requestId',userAuth,async(req,res)=>{
    try{
        const loggedInUser= req.user;
        const {status,requestId}= req.params;
   if(!requestId){
    throw new Error("Request ID is Missing");
   }
   const isAllowed=["accept","reject"];
   if(!isAllowed.includes(status)){
    throw new Error("Status is invalid")
   }
   const request = await ConnectionRequestModel.findOne({
      _id:requestId,
      toUserId:loggedInUser._id,
      status:"interested"
   }).populate("toUserId",["firstName","lastName","about","photoUrl","age"]).populate("fromUserId",["firstName","lastName","about","photoUrl","age"]);
   if(!request){
    throw new Error("request not found")
   }
   request.status=status;
   await request.save();
 
   res.status(200).send({
        message:"request "+status+"ed "+"Successfully",
        data:request
   })
    }
    catch(e){
        res.status(400).send("Server Error"+ e);
    }
   
})

connectionRequestRouter.get('/review',userAuth, async(req,res)=>{

    try{
        const loggedInUser=req.user;
       
    const requests= await ConnectionRequestModel.find({
    toUserId:loggedInUser._id,
    status:"interested"
}).populate("toUserId",["firstName","lastName","about","photoUrl","age"]).populate("fromUserId",["firstName","lastName","about","photoUrl","age"]);
console.log(requests)
res.status(200).send(requests);

    }
    catch(e){
        res.status(400).send("Server error"+ e);
    }

})

module.exports = {
  connectionRequestRouter
};
