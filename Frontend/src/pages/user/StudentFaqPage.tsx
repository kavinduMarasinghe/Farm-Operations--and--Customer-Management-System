import Chatbot from "@/components/Chatbot";
import { AppSidebar } from '@/components/layout/StudentAppSidebar';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

const FaqPage = () => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="pl-0 pr-4 py-4">
          <h1 className="text-2xl font-bold mb-4">Help & Support</h1>
          <p className="mb-6 text-gray-600">
            Ask our Student Assistant about Lab Tours, Bookings, Materials, and Live Sessions.
          </p>

          <Chatbot />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default FaqPage;

