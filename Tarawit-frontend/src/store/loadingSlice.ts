import { createSlice } from "@reduxjs/toolkit";

interface UiState {
  globalLoading: boolean;
}

const initialState: UiState = {
  globalLoading: false,
};

const uiReducer = createSlice({
  name: "ui",
  initialState,
  reducers: {}, // ไม่ต้องมี reducer ปกติแล้ว
  extraReducers: (builder) => {
    builder
      .addMatcher(
        (action) => action.type.endsWith("/pending"),
        (state) => {
          state.globalLoading = true;
        },
      )
      .addMatcher(
        (action) =>
          action.type.endsWith("/fulfilled") ||
          action.type.endsWith("/rejected"),
        (state) => {
          state.globalLoading = false;
        },
      );
  },
});

export default uiReducer.reducer;
