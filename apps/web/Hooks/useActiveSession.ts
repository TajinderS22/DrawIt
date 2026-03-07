"use client"
import  { useEffect } from 'react'
import useJwt from './useJwt'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../redux/store'
import axios from 'axios'
import { BACKEND_URL } from '../app/config'
import { setUser } from '../redux/UserSlice'
import { useRouter } from 'next/navigation'

const useActiveSession = () => {

    const jwt=  useJwt()
    const dispatch=useDispatch()
    const router=useRouter()


    const user=useSelector((state:RootState)=>state.user)


    const setUserToRedux= async()=>{

        if(!user && jwt){
            const res= await axios.post(BACKEND_URL+"/user/verify",{},{
                headers:{
                    authorization:jwt
                }
            })
            if(res.status==200){
                dispatch(setUser(res.data.user))
            }else{
                router.push("/signin")
            }
        }
    }
    
    useEffect(()=>{
        
        if(jwt){
            setUserToRedux();
        }

    },[user,jwt])

  return user
}

export default useActiveSession