import {LineChart} from "lucide-react"
import { ReactNode } from "react"


const IconButton=({icon,onClick,activated}:{
    icon:ReactNode,
    onClick?:()=>void,
    activated:boolean
})=>{
    return(
        <div className={`pointer rounded-full border bg-black hover:bg-black p-2 m-1 mx-2
            ${activated?"text-amber-700":"text-white"}
        
        `} onClick={onClick}  >
            {icon}
        </div>
    )
}

export default IconButton