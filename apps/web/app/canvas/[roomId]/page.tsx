
import JWT from "../../../Components/JWT"

const page= async ({params}:{
    params:{
        roomId:number
    }
})=>{

    const roomId=Number((await params).roomId)
    
    return <JWT roomId={roomId}></JWT>

    
}

export default page