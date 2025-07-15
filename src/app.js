
const express = require('express')
const app = new express()
require('dotenv').config();
const {connectDB}= require('./config/database.js')
const {UserModel} = require("./models/user.js");
const {connectionRequestRouter} = require('./routes/connectionRequest.js')
const cookieParser = require('cookie-parser');
const redisClient = require('./config/redisClient.js')
app.use(express.json())
app.use(cookieParser())
//get all users

const authRouter= require('./routes/auth.js');
const profileRouter = require('./routes/profile.js');
const userRouter = require('./routes/user.js');
const {blogRouter}= require('./routes/blog.js')
const {commentRouter}= require('./routes/comment.js')

app.use('/auth',authRouter);
app.use('/profile',profileRouter);
app.use('/user',userRouter);
app.use('/comment',commentRouter);
app.use('/blog',blogRouter);
app.use('/request',connectionRequestRouter);
app.get('/feed',async (req,res)=>{
    try{
         const users= await UserModel.find({});
         if(users.length==0){
            res.send("user is not availaible")
         }
         else{
            res.send(users);
         }
    }
    catch(e){
        res.status(400).send("something went wrong")
    }
   
  
})
connectDB().then(async () => {

    console.log('Database connection established');
    
    await redisClient.connect();
     console.log("✅ Connected to Redis Cloud");
    app.listen(3000,()=>{
    console.log("Server is running on port 3000");
})
}).catch((error) => {
    console.error('Database connection error:', error);
    process.exit(1); // Exit the process with failure
});
