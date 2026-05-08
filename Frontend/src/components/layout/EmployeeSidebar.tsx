import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { 
  Home,
  User,
  LogOut,
  Sprout,
  Calendar,
  Video,
  BookOpen,
  HelpCircle,
  ChevronRight,
  GraduationCap,
  Settings
} from "lucide-react";

const menuItems = [
  {
    title: "My Profile",
    url: "/employee/profile",
    icon: User,
    description: "View and edit profile"
  },
  {
    title: "My Work Hours",
    url: "/employee/work-hours",
    icon: Calendar,
    description: "Track your work hours"
  },
  {
    title: "My Tasks",
    url: "/employee/tasks",
    icon: Settings,
    description: "View assigned tasks"
  },
  {
    title: "Work Guide",
    url: "/employee/work-guide",
    icon: BookOpen,
    description: "Work instructions and guides"
  },
];

export function AppSidebar() {
  const { logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    if (path === "/employee/profile") return currentPath === "/employee/profile";
    return currentPath.startsWith(path);
  };

  const getNavClass = (isActiveRoute: boolean) =>
    `flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 w-full ${
      isActiveRoute 
        ? "bg-green-600 text-white shadow-sm" 
        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
    }`;

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="w-72 border-r border-gray-200 bg-white fixed left-0 top-0 h-screen flex-shrink-0 z-10">
      <div className="p-4 flex flex-col h-full overflow-hidden">
        {/* Modern Brand Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <Sprout className="h-5 w-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <GraduationCap className="h-2.5 w-2.5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">FarmHub</h1>
              <p className="text-xs text-gray-500 font-medium">Employee Portal</p>
            </div>
          </div>

          {/* User Profile Card */}
          <div 
            onClick={() => navigate('/employee/profile')}
            className="relative bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[0.98] border border-gray-200"
          >
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user?.fullName || user?.name || 'Employee User'}
                </p>
                <p className="text-xs text-gray-600 truncate">
                  {user?.email}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="space-y-1 flex-1 overflow-hidden">
          <div className="px-3 mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Navigation</p>
          </div>          <div className="space-y-1">
            {menuItems.map((item) => {
              const isActiveRoute = isActive(item.url);
              return (
                <NavLink
                  key={item.title}
                  to={item.url}
                  className={getNavClass(isActiveRoute)}
                >
                  <item.icon className={`h-5 w-5 ${isActiveRoute ? 'text-white' : 'text-gray-500'}`} />
                  <span className="font-medium">{item.title}</span>
                  {isActiveRoute && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Bottom Actions */}
  <div className="mt-auto pt-6 space-y-1">
          <div className="px-3 mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Account</p>
          </div>
          
          <button
            onClick={() => navigate('/employee/settings')}
            className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 w-full text-left"
          >
            <Settings className="h-5 w-5 text-gray-500" />
            <span className="font-medium">Settings</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 w-full text-left"
          >
            <LogOut className="h-5 w-5 text-red-500" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export { AppSidebar as EmployeeSidebar };
