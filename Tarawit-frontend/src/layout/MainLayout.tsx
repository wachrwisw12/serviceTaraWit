import { useState } from "react";
import { Outlet } from "react-router-dom";
import SchoolAppbar from "../components/SchoolAppbar";
import SchoolSidebar from "../components/SchoolSidebar";

export default function MainLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-dvh bg-[#edf5ff] print:block">
      <div className="print:hidden">
        <SchoolSidebar
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed((current) => !current)}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="print:hidden">
          <SchoolAppbar
            onOpenMenu={() => setDrawerOpen(true)}
            onToggleSidebar={() => setCollapsed((current) => !current)}
          />
        </div>

        <main className="min-w-0 flex-1 bg-[#edf5ff] p-4 print-pad-none sm:p-5 lg:p-6 xl:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
