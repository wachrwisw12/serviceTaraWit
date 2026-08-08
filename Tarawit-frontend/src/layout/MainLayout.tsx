import { useState } from "react";
import { Outlet } from "react-router-dom";
import ResponsiveAppBar from "../components/Appbar";
import Sidebar from "../components/Sidebar";

const APPBAR_HEIGHT = 70; // 6px accent bar + 64px bar

export default function MainLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Appbar ลอยอยู่บนสุด เต็มความกว้าง เหนือ sidebar */}
      <ResponsiveAppBar onMenuClick={() => setDrawerOpen(true)} />

      <div className="flex" style={{ paddingTop: `${APPBAR_HEIGHT}px` }}>
        <Sidebar
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed((v) => !v)}
        />

        <main
          className="min-w-0 flex-1 bg-slate-50 p-6 md:p-8"
          style={{ minHeight: `calc(100vh - ${APPBAR_HEIGHT}px)` }}
        >
          <Outlet />
        </main>
      </div>
    </>
  );
}
