const mongoose = require('mongoose');
const { createClient } = require("redis");

const connectDB= async () => {
       await mongoose.connect("mongodb+srv://chetan0412:Chetan%40123@crm.2wmjl.mongodb.net/devTinder");
}


module.exports = {connectDB};
