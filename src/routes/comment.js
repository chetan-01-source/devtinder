const express = require('express');
const commentRouter= express.Router();
const {CommentModel }= require('../models/comment');
const authRouter = require('./auth');
const userAuth = require('../middlewares/userAuth')
const {BlogModel}= require('../models/blog');

commentRouter.post('/:blogId',userAuth,async (req,res)=>{
    try{
        const loggedInUser=req.user;
        const body= req.body;
    const blogId= req.params.blogId;
    if(!blogId){
        res.status(400).send("Please enter BlogId")
    }
    const blog= await BlogModel.findOne({
        _id:blogId
    });
    if(!blog){
        res.status(400).send("Invalid BlogID")
    }
    if(!body.text){
         res.status(400).send("Invalid text comment")
    }

    const comment = new CommentModel({
        blogId:blogId,
        userId:loggedInUser._id,
        text:body.text

    })
    await comment.save();
 await BlogModel.updateOne(
  { _id: blogId },
  { $push: { comments:comment._id } },
 
);
    res.send({
        message:"Comment Added successfully",
        data:comment
    })
    }
    catch(e){
        res.status(400).send("Internal serer error"+e)
    }    
    
});

commentRouter.get('/blog/:blogId',async(req,res)=>{

    try{
        const blogId=req.params.blogId;
    if(!blogId){
        res.status(400).send("BlogID not found ")
    }
const blog = await BlogModel.findOne({ _id: blogId })
            .populate({
                path: "comments",
                select: ["text","userId"], // Select only the fields you need from Comment
                populate: {
                    path: "userId",
                    select: ["firstName", "lastName", "photoUrl"] // Fields from User
                }
            });
    if(!blog){
        res.status(400).send("Invalid BlogId");
    }
    const comments =blog.comments;
    res.send({
        message:"Comment for blog retrieved successfully",
        data:comments
    });
    }
    catch(e){
        res.status(400).send("Internal error"+e);
    }
    
})
commentRouter.delete('/:commentId',userAuth,async(req,res)=>{

    try{
        const loggedInUser = req.user;
    const commentId=req.params.commentId;
    const comment = await CommentModel.findById({
        _id:commentId
    });
    if(!comment){
        res.status(400).send("Invalid comment ID")
    }
    if(!comment.userId.equals(loggedInUser._id)){
        return res.status(400).send("You are not authorized to delete a comment");
    }
    const blogId = comment.blogId;
    
    await BlogModel.updateOne(
  { _id: blogId },
  { $pull: { comments:commentId } },
 
);
await CommentModel.deleteOne({
        _id:commentId
    })
     

    res.send({
        message:"Comment deleted successfully",
    });
    }
    catch(e){
        res.status(400).send("Internal error"+e)
    }
    
})
commentRouter.patch('/:commentId',userAuth,async(req,res)=>{
    try{
          const loggedInUser = req.user;
    const body = req.body;
    const commentId= req.params.commentId;
        if(!commentId){
            return res.status(400).send("Comment ID not found");
        }
        const comment= await CommentModel.findById({
            _id:commentId
        });
        if(!comment){
        return res.status(400).send("Invalid Comment");
        }
        if(!comment.userId.equals(loggedInUser._id)){
            return res.status(400).send("You are not authorized user to update the comment ");
        }
   const updatedComment = await CommentModel.findOneAndUpdate(
  { _id: commentId },
  { $set: { text: body.text } },
  { new: true }
);
 res.send({
    message:"Comment updated successffully",
    data:updatedComment
 })

    }
    catch(e){
        res.status(400).send("Internal Error occured"+e);
    }
  
});

module.exports={
    commentRouter
}