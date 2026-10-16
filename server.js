import express from 'express'

const PORT = 9000
const app = express()

app.get('/',(req,res)=>{
    res.send('Hi from server')
})

app.listen(PORT,()=>{
    console.log(`Server running at PORT: ${PORT}`)
})