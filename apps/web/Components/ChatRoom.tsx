import axios from "axios"
import { BACKEND_URL } from "../app/config"
import ChatRoomClient from "./ChatRomClient";


const getChats=async(roomId:number)=>{
    
    const response=await axios.get(BACKEND_URL+`/user/chats/${roomId}`);

    console.log(response.data,"testing EP")
    return response.data.messages;
}

const ChatRoom=async({roomId}:{roomId:number})=>{
    const messages= await getChats(roomId)

    return <ChatRoomClient messages={messages} roomId={roomId}  ></ChatRoomClient>

}

export default ChatRoom