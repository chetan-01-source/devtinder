const mongoose = require("mongoose");
const slugify = require("slugify");

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
  slug: {
      type: String,
     
      unique: true
    },  
  imageUrl: {
    type: String, 
    default: "",
  },
  tags:{
type: [String],
index:true
  } ,
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

blogSchema.index({ title: "text", content: "text" });



blogSchema.pre("save", async function (next) {

  console.log("HEre hu maiii")
  if (!this.isModified("title")) return next();

  let baseSlug = slugify(this.title, { lower: true, strict: true });
  let slug = baseSlug;
  let count = 1;

  while (await mongoose.models.Blog.findOne({ slug })) {
    slug = `${baseSlug}-${count++}`;
  }

  this.slug = slug;
  next();
});

 const BlogModel=mongoose.model("Blog", blogSchema)

 
module.exports = {
    BlogModel
   };