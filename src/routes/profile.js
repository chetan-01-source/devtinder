const express = require('express');
const profileRouter = express.Router();
const {UserModel} = require("../models/user.js");
const userAuth = require('../middlewares/userAuth.js');
const e = require('express');
//get a profile

profileRouter.get('/view',userAuth,async (req,res)=>{
    res.send(req.user);         
});

profileRouter.patch('/edit',userAuth,async(req,res)=>{
    const user=req.user;
    const data = req.body;
    try{
        const isAllowed= Object.keys(data).every((key) => {
            return ['firstName','emailId' ,'lastName', 'age', 'skills', 'about', 'photoUrl'].includes(key);
        });
        
        if(!isAllowed){
            return res.status(400).send("Invalid fields to update");
        }   
        const objUser = await UserModel.findByIdAndUpdate(user._id,data,{
            runValidators:true,
            new: true // Return the updated document
        }   )
        await objUser.save();
        res.send(objUser);
    }
catch(e){
    return res.status(400).send("Invalid fields to update");
    }       

})

profileRouter.delete('/delete',async (req,res)=>{
    try{
       const userId=req.body.userId;
        const user = await UserModel.findByIdAndDelete(userId);
        res.send("user deleted successfully ");
    }
    catch(e){
        res.status(400).send("something went wrong")
    }
})
module.exports = profileRouter;