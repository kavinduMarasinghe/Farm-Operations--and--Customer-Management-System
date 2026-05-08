import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface User {
  id: string;
  name?: string;
  fullName?: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("authToken");
    const storedUser = localStorage.getItem("user");
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8070";

    let authToken = null;
    let userData = null;
    let userRole = null;

    // Try customer authentication first
    try {
      const customerRes = await fetch(`${API_BASE}/api/customer/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (customerRes.ok) {
        const customerData = await customerRes.json();
        authToken = customerData.token;
        userData = customerData.customer;
        userRole = 'customer';
      }
    } catch (error) {
      console.log('Customer auth failed, trying other options...');
    }

    // If customer auth failed, try student authentication
    if (!authToken) {
      try {
        const studentRes = await fetch(`${API_BASE}/api/student/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        if (studentRes.ok) {
          const studentData = await studentRes.json();
          authToken = studentData.token;
          userData = studentData.student;
          userRole = 'student';
        }
      } catch (error) {
        console.log('Student auth failed, trying admin...');
      }
    }

    // If customer and student auth failed, try employee authentication
    if (!authToken) {
      try {
        const employeeRes = await fetch(`${API_BASE}/api/auth/employee/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        if (employeeRes.ok) {
          const employeeData = await employeeRes.json();
          authToken = employeeData.token;
          userData = employeeData.user;
          userRole = 'employee';
        }
      } catch (error) {
        console.log('Employee auth failed, trying admin...');
      }
    }

    // If all previous auth failed, try admin authentication
    if (!authToken) {
      try {
        const adminRes = await fetch(`${API_BASE}/api/admin/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        if (adminRes.ok) {
          const adminData = await adminRes.json();
          authToken = adminData.token;
          userData = adminData.user;
          userRole = 'admin';
        }
      } catch (error) {
        console.log('Admin auth failed');
      }
    }

    // If all authentication attempts failed
    if (!authToken || !userData) {
      throw new Error("Invalid email or password");
    }

    // Set user data
    setToken(authToken);
    setUser({
      id: userData.id,
      name: userData.name,
      fullName: userData.fullName || userData.name,
      email: userData.email,
      role: userRole || userData.role
    });

    localStorage.setItem("authToken", authToken);
    localStorage.setItem("user", JSON.stringify({
      id: userData.id,
      name: userData.name,
      fullName: userData.fullName || userData.name,
      email: userData.email,
      role: userRole || userData.role
    }));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
