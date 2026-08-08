import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";

type Props = {
  open: boolean;
  title: string;
  message: string | React.ReactNode;
  onClose: () => void;
  confirmText?: string;
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl";
  fullWidth?: boolean;
};

export default function AppDialog({
  open,
  title,
  message,
  onClose,
  confirmText = "ปิด",
  maxWidth,
  fullWidth,
}: Props) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
    >
      <DialogTitle>{title}</DialogTitle>

      <DialogContent>
        {typeof message === "string" ? (
          <Typography>{message}</Typography>
        ) : (
          message
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained" color="warning">
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
