const mongoose= require('mongoose')
const validator = require('validator');
const { required } = require('zod/v4-mini');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const userSchema= new mongoose.Schema({
    firstName:{
        type:String,
        required:true,
        minLength:4
    },
    lastName:{
        type:String
    },
    phoneNumber:{
        type:String,
        required:true,
        unique:true,
         trim:true,
         validate(value){
            if(!validator.isMobilePhone(value)){
               throw new Error("Invalid Phone Number:"+value);
            }
         }
    },
    emailId:
{
    type:String,
    required:true,
    unique:true,
    trim:true,
    lowercase:true,
    validate(value){
        if(!validator.isEmail(value)){
            throw new Error("invalid email:"+value);
        }
    }

},
age:{
    type:Number,
    min:18
},
gender:{
    type:String,
    validate(value){
        if(!["male","female","other"].includes(value)){
            throw new Error("gender data is not valid")
        }
    }
},
password:{
    type:String,    
    required:true,
    trim:true,
    
    minLength:6,
    validate(value){
        if(value.toLowerCase().includes("password")){
            throw new Error("password cannot contain password")
        }
    }
},
skills:{
    type:[String]
},
about:{
    type: String,
    default:"this is my description i am a developer"
},
photoUrl:{
    
    type:String,
    default:"https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.rawpixel.com%2Fsearch%2Fuser%2520icon&psig=AOvVaw0TKLeEdnVvGMXrsUokDANX&ust=1751082698663000&source=images&cd=vfe&opi=89978449&ved=0CBEQjRxqFwoTCLjW3orakI4DFQAAAAAdAAAAABAL",
     validate(value){
        if(!validator.isURL(value)){
            throw new Error("invalid email:"+value);
        }
    }
},
refreshToken:{
    type:String,
    default:""
}
},{timestamps:true,optimisticConcurrency:true});
userSchema.methods.getrefreshToken= async function(){
    const user = this;
    const restoken = await jwt.sign({id: user._id},"Cometchat");
  console.log("Refresh Token in schema file is ", restoken);
            return restoken;
}   

userSchema.methods.getJwtToken= async function(){
    const user = this;
    const token = await jwt.sign({id: user._id},"Cometchat",{
                expiresIn:"24h"
  });

  
  console.log("Token in schema file is ", token);

            return token;
}
userSchema.methods.validatePassword= async function (password){
    const user = this;
   return await bcrypt.compare(password, user.password);
}
const UserModel = mongoose.model("User",userSchema);
module.exports={
    UserModel
}