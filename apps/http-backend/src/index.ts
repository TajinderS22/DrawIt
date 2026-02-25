import express from "express";
import { Router } from "express";
import {userRouter} from './user/user'
import cors from 'cors'

const app=express();
const port =3030;

app.use(cors())

app.use(express.json())

app.get("/",(req,res)=>{
    res.send("Heartbeat")
})

app.use('/user',userRouter)


app.listen(port,()=>{
    console.log(`server is running on port ${port}`)
})