import { Request, Response, Router } from "express";
import {prisma} from '@repo/db/dist/index.js'
import bcrypt from 'bcrypt'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import {CreateRoomSchema, JWT_USER_PASSWORD, UserSchemaZod} from '@repo/backend-common'
import { userMiddleware ,AuthedRequest} from "../middleware/user";


dotenv.config()

export const userRouter: Router = Router()




const saltRounds=12

type UserType={
    id?:number,
    email:string,
    password:string,
    firstname:string,
    lastname?:string,
    username?:string
}



userRouter.post('/signup',async(req ,res)=>{
    const data=req.body;
    console.log(data)
    const existingUser=await prisma.users.findFirst({
        where:{
            email:data.email,
            username:data.username
        }
    })
    try{
        if(existingUser){
            res.status(301).json({
                message :"User Already registered"
            })
            return;
        }
        const plainPassword=data.password;

        const hashedPassword=await bcrypt.hash(plainPassword,saltRounds)
        data.password=hashedPassword
        const parsed = UserSchemaZod.safeParse(data)
        if (!parsed.success) {
            return res.status(400).json({ message: "Invalid inputs", errors: parsed.error })
        }
        const createUser=await  prisma.users.create({
            data
        })
        if(createUser){
            res.status(200).json({
                message:"User Successfully Registered."
            })
        }

    }catch(err){
        console.log(err)
        res.status(500).json({
            message:"Internal Server Error.  Please Try later......"
        })
    }
})

console.log(JWT_USER_PASSWORD)
userRouter.post("/signin",async(req,res)=>{
    const data = req.body
    try {
        const user= await prisma.users.findFirst({
            where:{
                email:data.email
            }
        })
        if(!user){
            res.status(404).json({
                message:"User not registered Please Signup"
            })
            return
        }
        const passwordCheck:Boolean=await bcrypt.compare(data.password,user.password)
        if(!passwordCheck){
            res.status(401).json({
                message:"Password is invalid"
            })
            return;
        }
        if(!process.env.JWT_USER_PASSWORD){
            res.status(500).json({
                message:"Internal server Error Junior Dev briked your app"
            })
            return
        }
        const token=jwt.sign({id:user.id},JWT_USER_PASSWORD)
        res.status(200).json({
            message :"User Logged in succussfully.",
            jwt:token
        })

    } catch (error) {
        console.log(error);

        res.status(500).json({
            message:"Internal Server Error (ISE)"
        })
    }

})


userRouter.post('/room',userMiddleware,async(req:AuthedRequest,res)=>{
    const userId=req.userId;
    const data=CreateRoomSchema.safeParse(req.body)
    if(!data.success||!userId){
        res.json({
            message:"Incorrect inputs"
        })
        return;
    }
    try {
        const room = await prisma.room.create({
            data:{
                slug:data.data.name,
                adminId:userId
            }
        })
        res.status(200).json({
            roomId:room?.id
        })
    } catch (error) {
        console.log(error)
        res.status(400).json({
            message:"Name already exist please choose some other name."
        })
    }
})


userRouter.get("/chats/:roomId",async(req,res)=>{
    const roomId= Number(req.params.roomId);
    console.log(roomId)
    try {
        const messages= await prisma.chat.findMany({
            where:{
                roomId
            },
            orderBy:{
                id:"desc"
            },
            take:50 
        })



        res.status(200).json({
            messages
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            message:"Internal Server Error"
        })
    }
})


userRouter.get('/room/:slug',async(req,res)=>{
    const slug=req.params.slug;
    const roomId=await prisma.room.findFirst({
        where:{
            slug:slug
        }
    })
    if(!roomId){
        res.status(404).json({
            message:"Room not found"
        })
        return;
    }
    res.status(200).json({
        roomId:roomId?.id
    })
})