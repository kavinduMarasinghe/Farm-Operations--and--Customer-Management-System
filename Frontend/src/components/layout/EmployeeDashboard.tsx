import { Outlet } from "react-router-dom";
import { AppSidebar } from "./EmployeeSidebar";
import { TopNavbar } from "./TopNavbar";

export default function EmployeeDashboard() {
  return (
    <div className="min-h-screen bg-background w-screen overflow-x-hidden">
      <AppSidebar />
      <div className="ml-72 flex flex-col min-h-screen" style={{ width: 'calc(100vw - 288px)' }}>
        <div className="fixed top-0 right-0 left-72 z-10 bg-background border-b">
          <TopNavbar />
        </div>
        <main className="flex-1 bg-muted/30 pt-[4.5rem] overflow-y-auto" style={{ width: '100%' }}>
          <div style={{ width: '100%', minHeight: '100%' }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}