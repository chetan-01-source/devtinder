const express = require('express');
const blogRouter = express.Router();
const {BlogModel} = require('../models/blog.js')
const {BlogSchema}= require('../utils/blogSchema.js')
const userAuth = require('../middlewares/userAuth.js')

//create a new blog
blogRouter.post('/',userAuth,async(req,res)=>{
     try{
        const blogData = req.body;
        BlogSchema.safeParse(blogData);
        const loggedInUser= req.user;
         blogData.author=loggedInUser._id;
        
         const Blog= new BlogModel({
            author:blogData.author,
            title:blogData.title,
            imageUrl:blogData.imageUrl,
            content:blogData.content,
            tags:blogData.tags
         });


         await Blog.save();

         const populatedBlog = await BlogModel.findOne({
            _id:Blog._id
         }).populate("author").select(["firstName","lastName","about","age","photoUrl"]);
         res.send({
            message:"Blog saved successfully",
            data: populatedBlog
         });
     }
     catch(e){
        console.log(e);
        if(e instanceof Object ){
          
             res.status(500).send("Internal error occured: "+e);
        }
        else{
            res.status(500).send("Error: "+e.message);
        }
     }
})
module.exports={
    blogRouter
}