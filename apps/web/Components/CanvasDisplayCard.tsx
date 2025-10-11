import { useRouter } from "next/navigation"

const CanvasDisplayCard = (data:any) => {
    const {id,slug,
        // adminId
    }=data.data

    const router=useRouter()

  return (
    <div 
     onClick={()=>{
        router.push('/canvas/'+id)
     }}
     className="w-11/12  mx-auto" key = {id}>
        <div className="p-6  bg-amber-100/95 m-2 rounded-lg ">
            {slug}
        </div>
    </div>
  )
}

export default CanvasDisplayCard