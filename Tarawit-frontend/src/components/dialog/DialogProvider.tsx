import { useCallback, useRef, useState, type ReactNode } from "react";
import Dialog from "./Dialog";
import { DialogContext } from "./DialogContext";
import type { DialogOptions, DialogState } from "./types";

interface Props {
  children: ReactNode;
}

const initialState: DialogState = {
  open: false,
  mode: "alert",
  type: "info",
  title: "",
  message: "",
  confirmText: "ตกลง",
  cancelText: "ยกเลิก",
};

export default function DialogProvider({ children }: Props) {
  const [dialog, setDialog] = useState<DialogState>(initialState);

  // เก็บ resolve ของ Promise ไว้
  const resolver = useRef<
    | ((value: boolean | PromiseLike<boolean>) => void)
    | ((value: void | PromiseLike<void>) => void)
    | null
  >(null);

  // ------------------------
  // Alert
  // ------------------------
  const alert = useCallback((options: DialogOptions) => {
    return new Promise<void>((resolve) => {
      resolver.current = resolve;

      setDialog({
        ...initialState,
        ...options,
        open: true,
        mode: "alert",
      });
    });
  }, []);

  // ------------------------
  // Confirm
  // ------------------------
  const confirm = useCallback((options: DialogOptions) => {
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;

      setDialog({
        ...initialState,
        ...options,
        open: true,
        mode: "confirm",
      });
    });
  }, []);

  // ------------------------
  // ปุ่มตกลง
  // ------------------------
  const handleConfirm = () => {
    if (dialog.mode === "confirm") {
      (resolver.current as ((value: boolean) => void) | null)?.(true);
    } else {
      (resolver.current as ((value: void) => void) | null)?.();
    }

    resolver.current = null;
    setDialog(initialState);
  };

  // ------------------------
  // ปุ่มยกเลิก / ปิด
  // ------------------------
  const handleCancel = () => {
    if (dialog.mode === "confirm") {
      (resolver.current as ((value: boolean) => void) | null)?.(false);
    } else {
      (resolver.current as ((value: void) => void) | null)?.();
    }

    resolver.current = null;
    setDialog(initialState);
  };

  return (
    <DialogContext.Provider
      value={{
        alert,
        confirm,
      }}
    >
      {children}

      <Dialog
        dialog={dialog}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </DialogContext.Provider>
  );
}
