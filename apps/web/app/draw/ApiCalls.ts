import axios from "axios";
import { BACKEND_URL } from "../config";

export const getExistingShapes=async(roomId:number)=>{
    const res=await axios.get(BACKEND_URL+`/user/chats/${roomId}`)
    const messages=res.data.messages;

    const shapes=messages.map((x:{message:string})=>{
        const messageData=JSON.parse(x.message)
        const shape=messageData.shape;
        return shape;
    })
    return shapes;
}


