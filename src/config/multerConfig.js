// multerConfig.js
const multer = require("multer");

// Use memory storage (doesn't save to disk, useful for cloud uploads)
const storage = multer.memoryStorage();
const upload = multer({ storage });

module.exports = upload;
