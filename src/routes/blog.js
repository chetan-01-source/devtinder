const express = require('express');
const blogRouter = express.Router();
const {BlogModel} = require('../models/blog.js')
const {BlogSchema}= require('../utils/blogSchema.js')
const userAuth = require('../middlewares/userAuth.js')
const cloudinary = require("../config/cloudinary.js");
const upload = require("../config/multerConfig.js");
const streamifier = require("streamifier");
const {sendMessage} = require('../utils/kafka.js');
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


});

blogRouter.get('/:userId',userAuth,async(req,res)=>{
   const loggedInUser= req.user;
   try{
      const userId = req.params.userId;
      console.log("user id is",userId);
      if(!userId){
         return res.send("Please enter the user id")
      }
      const userBlogs= await BlogModel.find({
         author:userId
      });
      res.send({
         message:"Blog for user successfully",
         data:userBlogs
      });   
   }
   catch(e){
      res.status(400).send("Internal error"+e)
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
        const loggedInUser= req.user;
         blogData.author=loggedInUser._id;
        
         const blog= new BlogModel({
            author:blogData.author,
            title:blogData.title,
            content:blogData.content,
            tags:blogData.tags
         });


         await blog.save();

         const populatedBlog = await BlogModel.findOne({
            _id:blog._id
         }).populate("author",["firstName","lastName","about","age","photoUrl"]);
         await sendMessage('blog_created', populatedBlog);
         
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

blogRouter.post('/upload-blog-image/:blogId',upload.single("blogImage"),async (req, res) => {
  try {
    const file = req.file;
      const blogId = req.params.blogId;

    if (!file) {
      return res.status(400).json({ message: "No image file uploaded" });
    }

    const streamUpload = (buffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "blog_images" },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );
        streamifier.createReadStream(buffer).pipe(stream);
      });
    };

    const result = await streamUpload(file.buffer);
      const blog = await BlogModel.findByIdAndUpdate(
         blogId,
         { imageUrl: result.secure_url },
         { new: true }
      );
     
    res.status(200).json({
      success: true,
      imageUrl: result.secure_url, // 👈 return this to frontend
    });
  } catch (err) {
    console.error("Blog image upload error:", err);
    res.status(500).json({ message: "Upload failed" });
  }
});
const blog=blogRouter.delete('/:blogId',userAuth,async(req,res)=>{

   try{
       const loggedInUser= req.user;
   const blogId= req.params.blogId;
   const deletedBlog= await BlogModel.deleteOne({
      _id:blogId
   });

   res.send({
      message:"Blog deleted successfully",
      data:deletedBlog
   })
   }
   catch(e){
      res.status(400).send("Internal server error",e)
   }
  
})


module.exports={
    blogRouter
}