const express = require('express');
const blogRouter = express.Router();
const {BlogModel} = require('../models/blog.js')
const {BlogSchema}= require('../utils/blogSchema.js')
const userAuth = require('../middlewares/userAuth.js')

//create a new blog

blogRouter.get('/feed',userAuth,async(req,res)=>{

   console.log("data here")
const { tags, sort, page = 1, limit = 30, search } = req.query;
   const skip = (page-1) * limit 
   const loggedInUser = req.user;
   
   const filter = {};

    const sortOptions = sort==="latest"? {createdAt: -1} : {createdAt: 1};
    if (search) {
    filter.$text = { $search: search };
  }
 if (tags){
   const tagList=tags.split(',');
    filter.tags={$in:tagList};
 }
   try{
      console.log("filter is",filter);
      const feedblogs= await BlogModel.find(filter).sort(sortOptions)
      .populate("author",["firstName","lastName","about","age","photoUrl","skills"]).limit(limit).skip(skip);
      res.status(200).send({
         message:"Blog feed fetched successfully",
         data:{
            feedblogs
         }
      })

   }
   catch(e){
      res.status(400).send("Internal server error"+ e)

   }


})
blogRouter.patch("/:id",userAuth,async(req,res)=>{

   try{
      const body = req.body;
   const blogId= req.params.id;
const allowedFields=["title","content","imageUrl","tags"];

const notAllowedUpdate = Object.keys(body).filter(key => !allowedFields.includes(key));

if(notAllowedUpdate.length>0){
  return res.status(400).send("Fields are invalid");
};
const updatedBlog = await BlogModel.findByIdAndUpdate(
      blogId,
      { $set: body },
      { new: true, runValidators: true }
    ).populate("author", ["firstName", "lastName", "about", "age", "photoUrl"]);

    if (!updatedBlog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    res.status(200).json({
      message: "Blog updated successfully",
      data: updatedBlog
    });

   }
   catch(e){
      res.status(400).send("Internal error occurs"+e);
   }


});
blogRouter.get("/:slug",async (req, res) => {
  const blog = await BlogModel.findOne({ slug: req.params.slug }).populate("author",["firstName","lastName","age","photoUurl","skills"]);
  if (!blog) return res.status(404).json({ message: "Blog not found" });
  res.json(blog);
});

blogRouter.post('/',userAuth,async(req,res)=>{
     try{
        const blogData = req.body;
        BlogSchema.safeParse(blogData);
        console.log(" aa. gayaaa")
        const loggedInUser= req.user;
         blogData.author=loggedInUser._id;
        
         const blog= new BlogModel({
            author:blogData.author,
            title:blogData.title,
            imageUrl:blogData.imageUrl,
            content:blogData.content,
            tags:blogData.tags
         });


         await blog.save();

         const populatedBlog = await BlogModel.findOne({
            _id:blog._id
         }).populate("author",["firstName","lastName","about","age","photoUrl"]);
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