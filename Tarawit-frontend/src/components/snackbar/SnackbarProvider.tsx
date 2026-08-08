import { useCallback, useState, type ReactNode } from "react";

import Snackbar, { type SnackbarType } from "./Snackbar";
import { SnackbarContext } from "./SnackbarContext";

interface SnackbarState {
  open: boolean;
  message: string;
  type: SnackbarType;
}

export default function SnackbarProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [state, setState] = useState<SnackbarState>({
    open: false,
    message: "",
    type: "info",
  });

  const [duration, setDuration] = useState(3000);

  const showSnackbar = useCallback(
    (message: string, type: SnackbarType = "info", autoHide = 3000) => {
      setDuration(autoHide);

      setState({
        open: true,
        message,
        type,
      });
    },
    [],
  );

  const closeSnackbar = () => {
    setState((prev) => ({
      ...prev,
      open: false,
    }));
  };

  return (
    <SnackbarContext.Provider
      value={{
        showSnackbar,
      }}
    >
      {children}

      <Snackbar
        open={state.open}
        message={state.message}
        type={state.type}
        duration={duration}
        onClose={closeSnackbar}
      />
    </SnackbarContext.Provider>
  );
}
