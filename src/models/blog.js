const mongoose = require("mongoose");


const blogSchema= new mongoose.Schema({
    author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index:true
  },

  title: {
    type: String,
    required: true,
    maxlength: 150,
  },
  content: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String, 
    default: "",
  },
  tags: [String],
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Who liked
    },
  ],
  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
  ],
},{timestamps:true});
 const BlogModel=mongoose.model("Blog", blogSchema)
module.exports = {
    BlogModel
   };