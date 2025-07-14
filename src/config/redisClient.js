// redisClient.js
const { createClient } = require("redis");

const redisClient = createClient({
  url: "redis://default:trdk4ORzTImHLMY4nkmBjZ8796h1Ljsz@redis-11459.crce179.ap-south-1-1.ec2.redns.redis-cloud.com:11459"
});

redisClient.on("error", (err) => {
  console.error("❌ Redis Client Error", err);
});

// ✅ Make sure to export the client
module.exports = redisClient;
