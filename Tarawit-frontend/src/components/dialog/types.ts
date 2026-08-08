export type DialogType = "info" | "success" | "warning" | "error";

export interface DialogOptions {
  type?: DialogType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

export interface DialogState extends DialogOptions {
  open: boolean;
  mode: "alert" | "confirm";
}

export interface DialogContextType {
  alert: (options: DialogOptions) => Promise<void>;
  confirm: (options: DialogOptions) => Promise<boolean>;
}
