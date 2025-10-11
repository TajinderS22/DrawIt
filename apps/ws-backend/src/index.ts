import {WebSocketServer,WebSocket} from 'ws'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { JWT_USER_PASSWORD } from '@repo/backend-common'
import { prisma } from '@repo/db/dist'

const wss= new WebSocketServer({
    port :8080
})

interface User{
    ws:WebSocket,
    rooms:string[],
    userId:string
}

const users:User[]=[];

// const messagesToBePushed:any[]=[]

// const SendToDbImm=()=>{
//     prisma.chat.createMany({
//         data:{
//             messagesToBePushed
//         }
//     })
// }

// setInterval(()=>{

// },5000)


const checkUser=(token:string)=>{
    if(!token){
        return null;
    }
    if(!JWT_USER_PASSWORD){
        return null;
    }
    const decoded= jwt.verify(token,JWT_USER_PASSWORD)
    if(!decoded||!((decoded as JwtPayload).id)){
        return null;
    }

    if(!decoded){
        return null;
    }
    return (decoded as JwtPayload).id
}

wss.on('connection',(ws,request)=>{

    const url = request.url;
    if(!url){
        return;
    }
    const queryParams= new URLSearchParams(url.split("?")[1]);
    const token:any = queryParams.get("token");
    try {
        
        const userId=checkUser(token)
        if(!userId){
            ws.send(JSON.stringify({
                message:"Invalid Token"
            }))
            ws.close()
        }

        users.push({
            userId:userId,
            rooms:[],
            ws
        })

    

    ws.on("message",async(data)=>{
        const parsedData=JSON.parse(data as unknown as string);

        try {
            if(parsedData.type=='join_room'){
            const user=users.find(x=>x.ws==ws);
            const checkRoomId= await prisma.room.findFirst({
                where:{
                    id:parsedData.roomId
                }
            })
            if(!checkRoomId){
                ws.send(JSON.stringify({
                    message:"roomId is invalid"
                }))
            }else{
                user?.rooms.push(parsedData.roomId);
            }
        }


        if(parsedData.type=="leave_room"){
            const user=users.find(x=> x.ws==ws)
            if(!user){
                return null;
            }
            user.rooms=user?.rooms.filter(x=>x==parsedData.room)
        }

        if(parsedData.type=='chat_delete_shape'){

            const roomId=parsedData.roomId;
            const userId=parsedData.userId;

            const deletIds:number[]=[]

            const data=JSON.parse(parsedData.message)
            console.log(data)
            const MessageToBeDeletedId=data.data.id;
            const alreadyDeleted=(num:number)=>{
                const deleted=deletIds.find((x:number)=> x==num )
                console.log(deleted)
            }
            alreadyDeleted(MessageToBeDeletedId)
            await prisma.chat.delete({
                where:{
                    id:MessageToBeDeletedId
                }
            })
        

    

            users.forEach(user=>{
                if(user.rooms.includes(roomId)){
                    user.ws.send(JSON.stringify({
                        type:"chat_delete_shape",
                        message:"Shape Deleted",
                        roomId,
                        userId
                       
                    }))
                }
            })
        }


        if(parsedData.type=='chat'){

            const roomId=parsedData.roomId;
            const message=parsedData.message;
            const userId=parsedData.userId;

            const messageData={
                message:message,
                roomId,
                userId
            }
            // messagesToBePushed.push(messageData)
            await prisma.chat.create({
                data:messageData
            })
            users.forEach(user=>{
                if(user.rooms.includes(roomId)){
                    user.ws.send(JSON.stringify({
                        type:"chat",
                        message:message,
                        roomId,
                        userId
                       
                    }))
                }
            })
            

        }

        } catch (error) {
            console.log(error)
        }


    });
    } catch (error) {
        console.log(error)
    }
})