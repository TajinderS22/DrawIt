import { createSlice } from "@reduxjs/toolkit";


const initialState=null;

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    
    setUser: (state, action) => action.payload,
    clearUser:()=> null
  },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
