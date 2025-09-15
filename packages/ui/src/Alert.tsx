import React from 'react'

const Alert = ({type,message}:{
    type:string,
    message:string
}) => {

  if(type=='success'){
    return (
    <div className='w-screen bg-black flex justify-center fixed '>
      <div className={`p-2 m-2 max-w-[700px] rounded-md bg-green-200`}>
        {message}
      </div>
    </div>
  )}
  if(type=='failure'){
    return (
    <div className='w-screen flex bg-black justify-center fixed '>
      <div className={`p-2 m-2 max-w-[700px] rounded-md bg-red-200`}>
        {message}
      </div>
    </div>
  )}
  
}

export default Alert