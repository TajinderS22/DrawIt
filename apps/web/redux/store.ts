import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./UserSlice"; // ✅ default import
import setSelectedToolReducer  from "./slices/selectedToolSlice";

export const store = configureStore({
  reducer: {
    user: userReducer as any,
    selectedTool:setSelectedToolReducer
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
