import { Box, CircularProgress, Typography } from "@mui/material";

export default function SplashScreen() {
  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 2,
        background: "#0f172a",
        color: "#fff",
      }}
    >
      <CircularProgress color="inherit" />
      <Typography>กำลังโหลดระบบ...</Typography>
    </Box>
  );
}
