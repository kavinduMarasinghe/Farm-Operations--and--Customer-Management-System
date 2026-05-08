import { Outlet, useLocation } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { TopNavbar } from "./TopNavbar";

const DashboardLayout = () => {
  const { pathname } = useLocation();

  // Show sidebar on all admin pages
  const showSidebar = true;

  return (
    <div className="min-h-screen flex w-full bg-background">
      {showSidebar && <AppSidebar />}
      <div className={`flex-1 flex flex-col ${!showSidebar ? "pl-0" : ""}`}>
        <TopNavbar />
        <main className="flex-1 p-6 bg-muted/30">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;