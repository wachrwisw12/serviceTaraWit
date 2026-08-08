import React from "react";

interface Props {
  show: boolean;
  size?: number;
}

const GlobalLoader: React.FC<Props> = ({ show, size = 40 }) => {
  if (!show) return null;

  return (
    <div style={containerStyle}>
      <div
        style={{
          width: size,
          height: size,
          border: "4px solid #ccc",
          borderTop: "4px solid #1976d2",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }}
      />
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
  background: "transparent", // ไม่มีพื้นหลังทึบ
};

export default GlobalLoader;
