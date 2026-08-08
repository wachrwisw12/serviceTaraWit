import React from "react";
import ReactDOM from "react-dom/client";
import "./assets/fonts.css";
import "./index.css";
import "./pwa/registerSW";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider as ReduxProvider } from "react-redux";

import { store } from "./store";
import App from "./App";

import SnackbarProvider from "./components/snackbar/SnackbarProvider";
import { DialogProvider } from "./components/dialog";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <DialogProvider>
          <SnackbarProvider>
            <App />
          </SnackbarProvider>
        </DialogProvider>
      </QueryClientProvider>
    </ReduxProvider>
  </React.StrictMode>,
);
