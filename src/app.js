
const express = require('express')
const app = new express()



app.use('/hello',(req,res)=>{
    res.send("Hello from DevTinder")
})

app.use('/',(req,res)=>{
    res.send("response from DevTinder")
})

app.listen(3000,()=>{
    console.log("Server is running on port 3000");
})