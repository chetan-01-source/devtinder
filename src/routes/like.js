const express = require("express");
const { BlogModel } = require("../models/blog");
const userAuth = require("../middlewares/userAuth");
const likeRouter = express.Router();

likeRouter.get("/:blogId", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const blogId = req.params.blogId;
    if (!blogId) {
      return res.status(400).send("BlogId is missing");
    }
    const blog= await BlogModel.findById({
        _id:blogId
    }).populate("likes",["firstName","lastName","photoUrl","age"]);
    if(!blog){
              return res.status(400).send("BlogId is Invalid");
    }
    
    res.send( 
    {
        message:"Likes fetched successfully",
        data:blog.likes
    })
  } catch (e) {
    res.status(400).send("Internal server error" + e);
  }

}); 
likeRouter.post("/:blogId", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const blogId = req.params.blogId;
    if (!blogId) {
      return res.status(400).send("BlogId is missing");
    }
    const blog = await BlogModel.findOne({
      _id: blogId,
    });
    if (!blog) {
      return res.status(400).send("BlogId is Invalid");
    }
  const likes = blog.likes.includes(loggedInUser._id);
  if(likes){
    return res.status(400).send("You have already liked this blog");
  }
    const newBlog = await BlogModel.updateOne(
      { _id: blogId },
      { $push: { likes: loggedInUser._id } },
      { new: true }
    );
    res.send({
      message: "Like added successfully",
      data: newBlog,
    });
  } catch (e) {
    res.status(400).send("Internal server error" + e);
  }
});
likeRouter.delete("/:blogId", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const blogId = req.params.blogId;
    if (!blogId) {
      return res.status(400).send("BlogId is missing");
    }
    const blog = await BlogModel.findOne({
      _id: blogId,
    });
    if(!blog.likes.includes(loggedInUser._id)){
      return res.status(400).send("You have not liked this blog");
    }
    if (!blog) {
      return res.status(400).send("BlogId is Invalid");
    }
    const newBlog = await BlogModel.updateOne(
      { _id: blogId },
      { $pull: { likes: loggedInUser._id } },
      { new: true }
    );
    res.send({
      message: "Like removed successfully",
      data: newBlog,
    });
  } catch (e) {
    res.status(400).send("Internal server error" + e);
  }
});



module.exports = {
  likeRouter,
};
