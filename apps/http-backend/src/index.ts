import express from "express";
import { Router } from "express";
import {userRouter} from './user/user'

const app=express();
const port =3030;

app.use(express.json())

app.use('/user',userRouter)


app.listen(port,()=>{
    console.log(`server is running on port ${port}`)
})