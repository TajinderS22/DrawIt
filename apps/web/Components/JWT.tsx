"use client"
import React, { useEffect, useState } from 'react'
import RoomCanvas from './RoomCanvas'

const JWT = ({roomId}:{roomId:number}) => {

    const [token, setToken] = useState<string | null>(null)
    useEffect(() => {
        const jwt = localStorage.getItem("jwt")
        if (jwt) {
          setToken(jwt)
        }
    }, [])

    if(!token){
        return <div> Error getting JWT Token</div>
    }
  

  return (
    <RoomCanvas roomId={roomId} jwt={token}></RoomCanvas>
  )
}

export default JWT