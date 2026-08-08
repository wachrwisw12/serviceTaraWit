import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#027368",
      contrastText: "#F2F2F2",
    },
    secondary: {
      main: "#ffffff",
      contrastText: "#1f2937",
    },
  },

  typography: {
    fontFamily: `'Prompt', sans-serif`,
    button: {
      fontWeight: 600,
    },
  },

  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          textTransform: "none",
          fontWeight: 200,
          transition: "all 0.2s ease",

          // ✅ Responsive กลาง
          padding: "10px 20px",
          fontSize: "1rem",

          "@media (max-width:600px)": {
            padding: "12px 24px",
            fontSize: "1.05rem",
          },
        },

        sizeSmall: {
          padding: "6px 14px",
          fontSize: "0.875rem",
        },

        sizeMedium: {
          padding: "10px 20px",
          fontSize: "1rem",
        },

        sizeLarge: {
          padding: "14px 28px",
          fontSize: "1.1rem",
        },

        text: {
          "&:hover": {
            backgroundColor: "rgba(213, 217, 219, 0.08)",
          },
        },

        containedPrimary: {
          "&:hover": {
            //  backgroundColor: "rgba(36, 148, 204, 0.08)",
          },
        },
      },
    },

    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: "#29ce60",
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
        },
      },
    },
  },
});

export default theme;
