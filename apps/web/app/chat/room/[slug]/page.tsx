import axios from 'axios'
import { BACKEND_URL } from '../../../config'
import ChatRoom from '../../../../Components/ChatRoom';

const getRoomId=async(slug:string)=>{
    const response= await axios.get(BACKEND_URL+"/user/room/"+slug)
    return response?.data?.roomId;
    
}


const ClientSiideChatRoom= async({
    params
}:{
    params:{
        slug:string
    }
})=>{

    const slug=(await params).slug
    const roomId=await getRoomId(slug);

    return <ChatRoom roomId={roomId} ></ChatRoom>

}

export default ClientSiideChatRoom;