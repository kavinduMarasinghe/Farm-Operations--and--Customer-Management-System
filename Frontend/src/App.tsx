import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

// Customer Pages
import Home from "./pages/user/Home";
import About from "./pages/user/About";
import Marketplace from "./pages/user/Marketplace";
import Cart from "./pages/user/Cart";
import Checkout from "./pages/user/Checkout";
import Payment from "./pages/user/Payment";
import UserOrders from "./pages/user/Orders";
import UserCottages from "./pages/user/Cottages";
import CottageBooking from "./pages/user/CottageBooking";
import MyBookings from "./pages/user/MyBookings";
import Feedback from "./pages/user/Feedback";
import Profile from "./pages/user/Profile";
import Help from "./pages/user/Help";
import UserNotFound from "./pages/user/NotFound";
import CustomerLoginPage from "./pages/auth/LoginPage"; 
import CustomerRegisterPage from "./pages/auth/RegisterPage";

// Admin Components & Layouts
import DashboardLayout from "./components/layout/DashboardLayout";
import CustomerLayout from "./components/layout/CustomerLayout";
import StudentDashboard from "./components/layout/StudentDashboard";
import EmployeeDashboard from "./components/layout/EmployeeDashboard";

// Student Pages
import StudentBookings from "./pages/user/StudentBookings";
import StudentLiveSessions from "./pages/user/StudentLiveSessions";
import StudentMaterials from "./pages/user/StudentMaterials";
import StudentFaqPage from "./pages/user/StudentFaqPage";
import StudentSettings from "./pages/user/StudentSettings";

// Employee Pages
import EmployeeProfile from "./pages/user/EmployeeProfile";
import EmployeeWorkHours from "./pages/user/WorkHours";
import EmployeeTasks from "./pages/user/Tasks";
import EmployeeWorkGuide from "./pages/user/WorkGuide";
import EmployeeSettings from "./pages/user/EmployeeSettings";

// Admin Pages
import Dashboard from "./pages/admin/Dashboard";
import Products from "./pages/admin/Products";
import Customers from "./pages/admin/Customers";
import CottageBookings from "./pages/admin/CottageBookings";
import AdminCottages from "./pages/admin/Cottages";
import AdminRefunds from "./pages/admin/Refunds";
import Reports from "./pages/admin/Reports";
import CustomerReports from "./pages/admin/CustomerReports";
import Yields from "./pages/admin/Yields";
import AdminNotFound from "./pages/admin/NotFound";
import AdminOrders from "./pages/admin/Orders";
import CustomerFeedback from "./pages/admin/CustomerFeedback";
import AdminProfile from "./pages/admin/Profile";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminFeedback from "./pages/admin/AdminFeedback";
import AdminLiveSession from "./pages/admin/AdminLiveSession";
import AdminMaterial from "./pages/admin/AdminMaterial";
import AdminLabTour from "./pages/admin/AdminLabTour";
import AdminStudentDetails from "./pages/admin/AdminStudentDetails";
import AdminReports from "./pages/admin/AdminReports";
import WorkHours from "./pages/admin/WorkHours";
import Tasks from "./pages/admin/Tasks";
import Employees from "./pages/admin/Employees";
import Salary from "./pages/admin/Salary";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user } = useAuth();

  // Check user roles
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const isStudent = user?.role === 'student';
  const isCustomer = user?.role === 'customer';
  const isEmployee = user?.role === 'employee';
  const isLoggedIn = !!user;

  return (
    <Routes>
      {/* Customer Routes with Layout */}
      <Route path="/" element={<CustomerLayout><Home /></CustomerLayout>} />
      <Route path="/about" element={<CustomerLayout><About /></CustomerLayout>} />
      <Route path="/marketplace" element={<CustomerLayout><Marketplace /></CustomerLayout>} />
      <Route path="/cart" element={<CustomerLayout><Cart /></CustomerLayout>} />
      <Route path="/checkout" element={<CustomerLayout><Checkout /></CustomerLayout>} />
      <Route path="/payment" element={<CustomerLayout><Payment /></CustomerLayout>} />
      <Route path="/orders" element={<CustomerLayout><UserOrders /></CustomerLayout>} />
      <Route path="/cottages" element={<CustomerLayout><UserCottages /></CustomerLayout>} />
      <Route path="/cottage-booking/:cottageId" element={<CustomerLayout><CottageBooking /></CustomerLayout>} />
      <Route path="/my-bookings" element={<CustomerLayout><MyBookings /></CustomerLayout>} />
      <Route path="/feedback" element={<CustomerLayout><Feedback /></CustomerLayout>} />
      <Route path="/profile" element={<CustomerLayout><Profile /></CustomerLayout>} />
      <Route path="/help" element={<CustomerLayout><Help /></CustomerLayout>} />
      
      {/* Unified Auth - Single login for both customers and admins */}
      <Route path="/auth/login" element={<CustomerLoginPage />} />
      <Route path="/auth/register" element={<CustomerRegisterPage />} />
      <Route path="/login" element={<CustomerLoginPage />} />
      <Route path="/register" element={<CustomerRegisterPage />} />

      {/* Admin Routes - redirect to login if not logged in, or to products if admin */}
      <Route path="/admin" element={
        !isLoggedIn ? <Navigate to="/auth/login" replace /> : 
        isAdmin ? <Navigate to="/admin/dashboard/products" replace /> : 
        isEmployee ? <Navigate to="/employee/profile" replace /> :
        <Navigate to="/" replace />
      } />
      <Route path="/admin/login" element={<Navigate to="/auth/login" replace />} />

      {/* Student Routes - redirect to login if not logged in, or to student dashboard if student */}
      <Route path="/student" element={
        !isLoggedIn ? <Navigate to="/auth/login" replace /> : 
        isStudent ? <StudentDashboard /> : 
        <Navigate to="/" replace />
      } />
      <Route path="/student/dashboard" element={
        !isLoggedIn ? <Navigate to="/auth/login" replace /> : 
        isStudent ? <StudentDashboard /> : 
        <Navigate to="/" replace />
      } />
      <Route path="/student/bookings" element={
        !isLoggedIn ? <Navigate to="/auth/login" replace /> : 
        isStudent ? <StudentBookings /> : 
        <Navigate to="/" replace />
      } />
      <Route path="/student/livesessions" element={
        !isLoggedIn ? <Navigate to="/auth/login" replace /> : 
        isStudent ? <StudentLiveSessions /> : 
        <Navigate to="/" replace />
      } />
      <Route path="/student/materials" element={
        !isLoggedIn ? <Navigate to="/auth/login" replace /> : 
        isStudent ? <StudentMaterials /> : 
        <Navigate to="/" replace />
      } />
      <Route path="/student/settings" element={
        !isLoggedIn ? <Navigate to="/auth/login" replace /> : 
        isStudent ? <StudentSettings /> : 
        <Navigate to="/" replace />
      } />
      <Route path="/student/faq" element={
        !isLoggedIn ? <Navigate to="/auth/login" replace /> : 
        isStudent ? <StudentFaqPage /> : 
        <Navigate to="/" replace />
      } />

      {/* Employee Routes with EmployeeDashboard - protected by employee role */}
      <Route path="/employee" element={
        !isLoggedIn ? <Navigate to="/auth/login" replace /> : 
        !isEmployee ? <Navigate to="/" replace /> : 
        <EmployeeDashboard />
      }>
        <Route index element={<Navigate to="/employee/profile" replace />} />
        <Route path="profile" element={<EmployeeProfile />} />
        <Route path="settings" element={!isLoggedIn ? <Navigate to="/auth/login" replace /> : isEmployee ? <EmployeeSettings /> : <Navigate to="/" replace />} />
        <Route path="work-hours" element={<EmployeeWorkHours />} />
        <Route path="tasks" element={<EmployeeTasks />} />
        <Route path="work-guide" element={<EmployeeWorkGuide />} />
      </Route>
      
      {/* Admin Routes with DashboardLayout - protected by admin role */}
      {isAdmin && (
        <Route path="/admin/dashboard" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/admin/dashboard/products" replace />} />
          <Route path="products" element={<Products />} />
          <Route path="customers" element={<Customers />} />
          <Route path="feedbacks" element={<CustomerFeedback />} />
          <Route path="cottage-bookings" element={<CottageBookings />} />
          <Route path="work-hours" element={<WorkHours />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="employees" element={<Employees />} />
          <Route path="salary" element={<Salary />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="student-feedback" element={<AdminFeedback />} />
          <Route path="live-session" element={<AdminLiveSession />} />
          <Route path="material" element={<AdminMaterial />} />
          <Route path="lab-tour" element={<AdminLabTour />} />
          <Route path="student-details" element={<AdminStudentDetails />} />
          <Route path="student-reports" element={<AdminReports />} />
          <Route path="cottages" element={<AdminCottages />} />
          <Route path="refunds" element={<AdminRefunds />} />
          <Route path="yields" element={<Yields />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="profile" element={<AdminProfile />} />
          <Route path="reports" element={<Reports />} />
          <Route path="customer-reports" element={<CustomerReports />} />
        </Route>
      )}

      {/* Catch-all routes */}
      <Route path="/admin/*" element={
        !isLoggedIn ? <Navigate to="/auth/login" replace /> : 
        !isAdmin ? <Navigate to="/" replace /> : 
        <AdminNotFound />
      } />
      <Route path="*" element={<CustomerLayout><UserNotFound /></CustomerLayout>} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <SidebarProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
              <AppRoutes />
            </BrowserRouter>
          </SidebarProvider>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
