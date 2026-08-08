import { createContext } from "react";
import type { SnackbarType } from "./Snackbar";

export interface SnackbarContextType {
  showSnackbar: (
    message: string,
    type?: SnackbarType,
    duration?: number,
  ) => void;
}

export const SnackbarContext = createContext<SnackbarContextType | undefined>(
  undefined,
);
