import React from 'react'

const Alert = ({type,message}:{
    type:string,
    message:string
}) => {

  if(type=='success'){
    return (
    <div className='w-screen z-50  flex justify-center fixed top-0 '>
      <div className={`p-2 m-2 max-w-[700px] rounded-md bg-green-200`}>
        {message}
      </div>
    </div>
  )}
  if(type=='failure'){
    return (
    <div className='w-screen z-50 flex  justify-center fixed top-0'>
      <div className={`p-2 m-2 max-w-[700px] rounded-md bg-red-200`}>
        {message}
      </div>
    </div>
  )}
  
}

export default Alert