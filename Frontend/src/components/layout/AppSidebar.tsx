import { NavLink, useLocation } from "react-router-dom";
import { 
  Package, 
  Home, 
  MessageSquare, 
  FileBarChart,
  Sprout,
  Users,
  BookOpen,
  User,
  ShoppingCart,
  Calendar,
  UserCheck,
  Shield,
  Briefcase,
  Video,
  FileText,
  FlaskConical,
  Bookmark
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

// Main menu structure with flat hierarchy
const menuSections = [
  // Product Management Section
  {
    title: "Product Management",
    isMainTopic: true,
    icon: Package,
  },
  {
    title: "Products",
    url: "/admin/dashboard/products",
    icon: Package,
    isSubTopic: true,
  },
  {
    title: "Yields",
    url: "/admin/dashboard/yields", 
    icon: Sprout,
    isSubTopic: true,
  },
  {
    title: "Orders",
    url: "/admin/dashboard/orders",
    icon: ShoppingCart,
    isSubTopic: true,
  },
  {
    title: "Reports",
    url: "/admin/dashboard/reports",
    icon: FileBarChart,
    isSubTopic: true,
  },
  
  // Customer Management Section
  {
    title: "Customer Management",
    isMainTopic: true,
    icon: Users,
  },
  {
    title: "Customers",
    url: "/admin/dashboard/customers",
    icon: Users,
    isSubTopic: true,
  },
  {
    title: "Feedbacks",
    url: "/admin/dashboard/feedbacks",
    icon: MessageSquare,
    isSubTopic: true,
  },
  {
    title: "Cottage Bookings",
    url: "/admin/dashboard/cottage-bookings",
    icon: Calendar,
    isSubTopic: true,
  },
  {
    title: "Cottages",
    url: "/admin/dashboard/cottages",
    icon: Home,
    isSubTopic: true,
  },
  {
    title: "Refunds",
    url: "/admin/dashboard/refunds",
    icon: FileBarChart,
    isSubTopic: true,
  },
  {
    title: "Reports",
    url: "/admin/dashboard/customer-reports",
    icon: FileBarChart,
    isSubTopic: true,
  },
  
  // Employee Management Section
  {
    title: "Employee Management",
    isMainTopic: true,
    icon: UserCheck,
  },
  {
    title: "Work Hours",
    url: "/admin/dashboard/work-hours",
    icon: Calendar,
    isSubTopic: true,
  },
  {
    title: "Tasks",
    url: "/admin/dashboard/tasks",
    icon: FileBarChart,
    isSubTopic: true,
  },
  {
    title: "Employees",
    url: "/admin/dashboard/employees",
    icon: Users,
    isSubTopic: true,
  },
  {
    title: "Salary",
    url: "/admin/dashboard/salary",
    icon: Briefcase,
    isSubTopic: true,
  },
  
  // Student Management Section
  {
    title: "Student Management",
    isMainTopic: true,
    icon: BookOpen,
  },
  {
    title: "Bookings",
    url: "/admin/dashboard/bookings",
    icon: Calendar,
    isSubTopic: true,
  },
  {
    title: "Feedback",
    url: "/admin/dashboard/student-feedback",
    icon: MessageSquare,
    isSubTopic: true,
  },
  {
    title: "Livesession",
    url: "/admin/dashboard/live-session",
    icon: Video,
    isSubTopic: true,
  },
  {
    title: "Material",
    url: "/admin/dashboard/material",
    icon: FileText,
    isSubTopic: true,
  },
  {
    title: "Labtour",
    url: "/admin/dashboard/lab-tour",
    icon: FlaskConical,
    isSubTopic: true,
  },
  {
    title: "Student Details",
    url: "/admin/dashboard/student-details",
    icon: User,
    isSubTopic: true,
  },
  {
    title: "Student Reports",
    url: "/admin/dashboard/student-reports",
    icon: FileBarChart,
    isSubTopic: true,
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  // Check if sidebar is collapsed
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => currentPath.startsWith(path);

  const getMainTopicClass = () =>
    `text-sm font-bold text-primary px-4 py-3 border-l-4 border-primary bg-primary/5 uppercase tracking-wide`;

  const getSubTopicClass = (isActiveRoute: boolean) =>
    `transition-all duration-200 ml-4 pl-6 border-l-2 ${
      isActiveRoute
        ? "bg-primary text-primary-foreground shadow-sm font-medium border-primary"
        : "hover:bg-sidebar-accent hover:text-foreground text-muted-foreground border-muted/30 hover:border-primary/50"
    }`;

  return (
    <Sidebar
      className={`${
        isCollapsed ? "w-16" : "w-80"
      } border-r border-sidebar-border bg-sidebar`}
    >
      <SidebarContent className="pb-20">
        {/* Brand Header */}
        <div className="p-6 border-b border-sidebar-border bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-primary to-primary/80 rounded-lg shadow-lg">
              <Sprout className="h-6 w-6 text-primary-foreground" />
            </div>
            {!isCollapsed && (
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  FarmerHub
                </h2>
                <p className="text-xs text-muted-foreground font-medium">
                  Admin Dashboard
                </p>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup>
          
          <SidebarGroupContent className="space-y-1 px-2">
            <SidebarMenu>
              {menuSections.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.isMainTopic ? (
                    // Main Topic Header (non-clickable)
                    <div className={getMainTopicClass()}>
                      {!isCollapsed && (
                        <div className="flex items-center gap-3">
                          <item.icon className="h-5 w-5" />
                          <span className="text-xs font-bold">{item.title}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Sub Topic (clickable)
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url!}
                        className={getSubTopicClass(isActive(item.url!))}
                      >
                        <item.icon
                          className={`h-4 w-4 ${!isCollapsed ? "mr-3" : ""}`}
                        />
                        {!isCollapsed && (
                          <span className="text-sm">{item.title}</span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}