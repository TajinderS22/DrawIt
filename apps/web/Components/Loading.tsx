import { LoaderCircle } from 'lucide-react'
import React from 'react'

const Loading = () => {
  return (
    <div className='min-w-screen min-h-screen flex justify-center items-center '>
        <LoaderCircle className='animate-spin text-white w-30 h-30 '/>
    </div>
  )
}

export default Loading