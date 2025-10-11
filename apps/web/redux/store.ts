import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./UserSlice"; // ✅ default import

export const store = configureStore({
  reducer: {
    user: userReducer as any,
  },
});

// ✅ Inferred types for TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
