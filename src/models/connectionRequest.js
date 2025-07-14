const mongoose= require("mongoose");
const { required } = require("zod/v4-mini");
const { UserModel } = require("./user");


const connectionRequestSchema=mongoose.Schema({
    fromUserId:{
       type: mongoose.Types.ObjectId,
       required:true,
       ref:"User",
       index:true,
        
    },
    toUserId:{
       type: mongoose.Types.ObjectId,
       required:true,
        ref:"User"
    },
    status:{
            type: String,
    enum: ['interested', 'ignored', 'accept', 'reject'],
     required: true
    }


},{
    timestamps:true
})

connectionRequestSchema.pre('save',async function(next){
    const connection = this;
    console.log("Entered in precheck ",connection.toUserId);

 const user = await UserModel.findOne({ _id: connection.toUserId });
if(connection.fromUserId.equals(connection.toUserId)){
     throw new Error("you are trying to send request yourself")
}
 console.log("user is ",user);
 if(!user){
    throw new Error("request sent to user is invalid (Reciever is invalid)")
 }
 next();
})

module.exports = mongoose.model('ConnectionRequestModel', connectionRequestSchema);