const mongoose = require('mongoose');
const { createClient } = require("redis");

const connectDB= async () => {
       await mongoose.connect(process.env.DB_URI);
}


module.exports = {connectDB};
