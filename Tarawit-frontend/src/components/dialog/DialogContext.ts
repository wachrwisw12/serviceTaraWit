import { createContext } from "react";
import type { DialogContextType } from "./types";

export const DialogContext = createContext<DialogContextType>({
  alert: async () => {},
  confirm: async () => false,
});
