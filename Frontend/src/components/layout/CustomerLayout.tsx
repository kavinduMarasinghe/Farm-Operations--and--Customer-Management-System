import React from "react";
import Navigation from "@/components/Navigation";

interface CustomerLayoutProps {
  children: React.ReactNode;
}

const CustomerLayout = ({ children }: CustomerLayoutProps) => {
  return (
    <div className="min-h-screen bg-background w-full">
      <Navigation />
      <main className="w-full min-h-[calc(100vh-4rem)]">
        {children}
      </main>
    </div>
  );
};

export default CustomerLayout;