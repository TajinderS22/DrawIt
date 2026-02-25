import { createSlice } from "@reduxjs/toolkit";

const selectedToolSlice = createSlice({
    name:"selectedTool",
    initialState:null,
    reducers:{
        setSelectedTool:(state,action )=>action.payload
    }
})

export const {setSelectedTool}=selectedToolSlice.actions
export default selectedToolSlice.reducer