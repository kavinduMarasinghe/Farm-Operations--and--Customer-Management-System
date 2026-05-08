import { useState, useEffect } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileBarChart,
  Download,
  Calendar,
  DollarSign,
  FileText,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

// Export features
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const CustomerReports = () => {
  const [reportType, setReportType] = useState<string>("cottage-bookings");
  const [dateRange, setDateRange] = useState<string>("30");
  const [loading, setLoading] = useState<boolean>(false);
  const [customerData, setCustomerData] = useState<any[]>([]);
  const [customerStats, setCustomerStats] = useState<any>({});
  const [ordersByCustomer, setOrdersByCustomer] = useState<any[]>([]);
  const [cottageReport, setCottageReport] = useState<any>(null);
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchCustomerReports();
  }, [reportType, dateRange]);

  const fetchCustomerReports = async () => {
    try {
      setLoading(true);
      const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:8070";
      
      // Always load cottage report data (mock data for now)
      setCottageReport({
        totalBookings: 45,
        totalRevenue: 22500,
        statusSummary: [
          { _id: "confirmed", count: 32 },
          { _id: "pending", count: 8 },
          { _id: "cancelled", count: 5 }
        ],
        cottageSummary: [
          { _id: "Mountain View Cottage", bookings: 15, revenue: 7500, avgGuests: 3.2 },
          { _id: "Lakeside Retreat", bookings: 12, revenue: 6000, avgGuests: 2.8 },
          { _id: "Forest Cabin", bookings: 10, revenue: 5000, avgGuests: 2.5 },
          { _id: "Garden Villa", bookings: 8, revenue: 4000, avgGuests: 4.1 }
        ],
        recentBookings: [
          {
            cottageName: "Mountain View Cottage",
            checkIn: "2024-10-15",
            checkOut: "2024-10-17",
            guests: 4,
            totalAmount: 800,
            status: "confirmed",
            paymentStatus: "paid"
          },
          {
            cottageName: "Lakeside Retreat",
            checkIn: "2024-10-18",
            checkOut: "2024-10-20",
            guests: 2,
            totalAmount: 600,
            status: "pending",
            paymentStatus: "unpaid"
          },
          {
            cottageName: "Forest Cabin",
            checkIn: "2024-10-20",
            checkOut: "2024-10-22",
            guests: 3,
            totalAmount: 750,
            status: "confirmed",
            paymentStatus: "paid"
          }
        ],
        allBookings: [
          {
            _id: "BK001",
            cottageName: "Mountain View Cottage",
            customerName: "John Smith",
            checkIn: "2024-10-15",
            checkOut: "2024-10-17",
            guests: 4,
            totalAmount: 800,
            status: "confirmed",
            paymentStatus: "paid",
            createdAt: "2024-10-10"
          },
          {
            _id: "BK002",
            cottageName: "Lakeside Retreat",
            customerName: "Sarah Johnson",
            checkIn: "2024-10-18",
            checkOut: "2024-10-20",
            guests: 2,
            totalAmount: 600,
            status: "pending",
            paymentStatus: "unpaid",
            createdAt: "2024-10-12"
          },
          {
            _id: "BK003",
            cottageName: "Forest Cabin",
            customerName: "Mike Chen",
            checkIn: "2024-10-20",
            checkOut: "2024-10-22",
            guests: 3,
            totalAmount: 750,
            status: "confirmed",
            paymentStatus: "paid",
            createdAt: "2024-10-08"
          },
          {
            _id: "BK004",
            cottageName: "Garden Villa",
            customerName: "Emma Davis",
            checkIn: "2024-10-25",
            checkOut: "2024-10-27",
            guests: 5,
            totalAmount: 950,
            status: "cancelled",
            paymentStatus: "unpaid",
            createdAt: "2024-10-05"
          },
          {
            _id: "BK005",
            cottageName: "Mountain View Cottage",
            customerName: "Robert Wilson",
            checkIn: "2024-11-01",
            checkOut: "2024-11-03",
            guests: 2,
            totalAmount: 500,
            status: "pending",
            paymentStatus: "unpaid",
            createdAt: "2024-10-11"
          },
          {
            _id: "BK006",
            cottageName: "Lakeside Retreat",
            customerName: "Lisa Anderson",
            checkIn: "2024-11-05",
            checkOut: "2024-11-08",
            guests: 3,
            totalAmount: 900,
            status: "confirmed",
            paymentStatus: "paid",
            createdAt: "2024-10-09"
          },
          {
            _id: "BK007",
            cottageName: "Forest Cabin",
            customerName: "David Brown",
            checkIn: "2024-11-10",
            checkOut: "2024-11-12",
            guests: 4,
            totalAmount: 800,
            status: "pending",
            paymentStatus: "unpaid",
            createdAt: "2024-10-13"
          },
          {
            _id: "BK008",
            cottageName: "Garden Villa",
            customerName: "Jennifer Taylor",
            checkIn: "2024-11-15",
            checkOut: "2024-11-17",
            guests: 6,
            totalAmount: 1200,
            status: "cancelled",
            paymentStatus: "unpaid",
            createdAt: "2024-10-06"
          }
        ]
      });

      try {
        // Fetch customer data
        const customerResponse = await axios.get(`${API_BASE}/api/customers`);
        if (customerResponse.data?.success) {
          setCustomerData(customerResponse.data.data || []);
        } else {
          // Use mock customer data
          setCustomerData([
            { _id: "1", name: "John Doe", email: "john@example.com", phone: "123-456-7890", isActive: true, createdAt: "2024-09-15" },
            { _id: "2", name: "Jane Smith", email: "jane@example.com", phone: "098-765-4321", isActive: true, createdAt: "2024-08-20" },
            { _id: "3", name: "Bob Johnson", email: "bob@example.com", phone: "555-123-4567", isActive: false, createdAt: "2024-07-10" }
          ]);
        }
      } catch (customerError) {
        console.error("Error loading customers, using mock data:", customerError);
        setCustomerData([
          { _id: "1", name: "John Doe", email: "john@example.com", phone: "123-456-7890", isActive: true, createdAt: "2024-09-15" },
          { _id: "2", name: "Jane Smith", email: "jane@example.com", phone: "098-765-4321", isActive: true, createdAt: "2024-08-20" },
          { _id: "3", name: "Bob Johnson", email: "bob@example.com", phone: "555-123-4567", isActive: false, createdAt: "2024-07-10" }
        ]);
      }

      try {
        // Fetch orders to analyze customer behavior
        const ordersResponse = await axios.get(`${API_BASE}/api/orders`);
        if (ordersResponse.data?.success) {
          const orders = ordersResponse.data.data || [];
          analyzeCustomerData(customerData.length > 0 ? customerData : [
            { _id: "1", name: "John Doe", email: "john@example.com", phone: "123-456-7890", isActive: true, createdAt: "2024-09-15" },
            { _id: "2", name: "Jane Smith", email: "jane@example.com", phone: "098-765-4321", isActive: true, createdAt: "2024-08-20" },
            { _id: "3", name: "Bob Johnson", email: "bob@example.com", phone: "555-123-4567", isActive: false, createdAt: "2024-07-10" }
          ], orders);
        } else {
          // Use mock order data
          const mockOrders = [
            { _id: "1", customerId: "1", totalAmount: 150, createdAt: "2024-10-01" },
            { _id: "2", customerId: "2", totalAmount: 200, createdAt: "2024-10-02" },
            { _id: "3", customerId: "1", totalAmount: 75, createdAt: "2024-10-03" }
          ];
          analyzeCustomerData(customerData.length > 0 ? customerData : [
            { _id: "1", name: "John Doe", email: "john@example.com", phone: "123-456-7890", isActive: true, createdAt: "2024-09-15" },
            { _id: "2", name: "Jane Smith", email: "jane@example.com", phone: "098-765-4321", isActive: true, createdAt: "2024-08-20" },
            { _id: "3", name: "Bob Johnson", email: "bob@example.com", phone: "555-123-4567", isActive: false, createdAt: "2024-07-10" }
          ], mockOrders);
        }
      } catch (orderError) {
        console.error("Error loading orders, using mock data:", orderError);
        const mockOrders = [
          { _id: "1", customerId: "1", totalAmount: 150, createdAt: "2024-10-01" },
          { _id: "2", customerId: "2", totalAmount: 200, createdAt: "2024-10-02" },
          { _id: "3", customerId: "1", totalAmount: 75, createdAt: "2024-10-03" }
        ];
        analyzeCustomerData(customerData.length > 0 ? customerData : [
          { _id: "1", name: "John Doe", email: "john@example.com", phone: "123-456-7890", isActive: true, createdAt: "2024-09-15" },
          { _id: "2", name: "Jane Smith", email: "jane@example.com", phone: "098-765-4321", isActive: true, createdAt: "2024-08-20" },
          { _id: "3", name: "Bob Johnson", email: "bob@example.com", phone: "555-123-4567", isActive: false, createdAt: "2024-07-10" }
        ], mockOrders);
      }

      // Try to fetch cottage bookings data for cottage reports
      if (reportType === "cottage-bookings") {
        try {
          const cottageResponse = await axios.get(`${API_BASE}/api/reports/cottages?range=${dateRange}`);
          if (cottageResponse.data?.success) {
            setCottageReport(cottageResponse.data.data);
          }
        } catch (cottageError) {
          console.error("Error loading cottage report API, keeping mock data:", cottageError);
          // Mock data is already set above
        }
      }
    } catch (error) {
      console.error("Failed to fetch customer reports:", error);
      // Set default mock data for all states
      setCustomerData([
        { _id: "1", name: "John Doe", email: "john@example.com", phone: "123-456-7890", isActive: true, createdAt: "2024-09-15" },
        { _id: "2", name: "Jane Smith", email: "jane@example.com", phone: "098-765-4321", isActive: true, createdAt: "2024-08-20" },
        { _id: "3", name: "Bob Johnson", email: "bob@example.com", phone: "555-123-4567", isActive: false, createdAt: "2024-07-10" }
      ]);
      
      const mockOrders = [
        { _id: "1", customerId: "1", totalAmount: 150, createdAt: "2024-10-01" },
        { _id: "2", customerId: "2", totalAmount: 200, createdAt: "2024-10-02" },
        { _id: "3", customerId: "1", totalAmount: 75, createdAt: "2024-10-03" }
      ];
      
      analyzeCustomerData([
        { _id: "1", name: "John Doe", email: "john@example.com", phone: "123-456-7890", isActive: true, createdAt: "2024-09-15" },
        { _id: "2", name: "Jane Smith", email: "jane@example.com", phone: "098-765-4321", isActive: true, createdAt: "2024-08-20" },
        { _id: "3", name: "Bob Johnson", email: "bob@example.com", phone: "555-123-4567", isActive: false, createdAt: "2024-07-10" }
      ], mockOrders);
    } finally {
      setLoading(false);
    }
  };

  const analyzeCustomerData = (customers: any[], orders: any[]) => {
    // Calculate customer statistics
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => c.isActive !== false).length;
    
    // Create a customer map for quick lookup
    const customerMap = new Map();
    customers.forEach(customer => {
      customerMap.set(customer._id, customer);
    });
    
    // Analyze orders by customer
    const customerOrderMap = new Map();
    let totalRevenue = 0;
    
    orders.forEach(order => {
      const customerId = order.customerId?._id || order.customerId;
      const customer = customerMap.get(customerId);
      
      if (!customerOrderMap.has(customerId)) {
        customerOrderMap.set(customerId, {
          customerId,
          customerName: customer?.name || customer?.fullName || order.customerId?.name || order.customerId?.fullName || `Customer ${customerId}`,
          orderCount: 0,
          totalSpent: 0,
          lastOrderDate: null
        });
      }
      
      const customerInfo = customerOrderMap.get(customerId);
      customerInfo.orderCount += 1;
      customerInfo.totalSpent += parseFloat(order.totalAmount) || 0;
      totalRevenue += parseFloat(order.totalAmount) || 0;
      
      const orderDate = new Date(order.createdAt);
      if (!customerInfo.lastOrderDate || orderDate > customerInfo.lastOrderDate) {
        customerInfo.lastOrderDate = orderDate;
      }
    });

    // If no orders exist, create some mock customer order data
    if (customerOrderMap.size === 0 && customers.length > 0) {
      customers.forEach((customer, index) => {
        const mockSpent = [150, 200, 75, 300, 125][index] || 100;
        customerOrderMap.set(customer._id, {
          customerId: customer._id,
          customerName: customer.name || customer.fullName,
          orderCount: Math.floor(Math.random() * 5) + 1,
          totalSpent: mockSpent,
          lastOrderDate: new Date(2024, 9, Math.floor(Math.random() * 30) + 1)
        });
        totalRevenue += mockSpent;
      });
    }

    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : totalRevenue / Math.max(Array.from(customerOrderMap.values()).reduce((sum, c) => sum + c.orderCount, 0), 1);
    const avgCustomerValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

    setCustomerStats({
      totalCustomers,
      activeCustomers,
      totalOrders: orders.length || Array.from(customerOrderMap.values()).reduce((sum, c) => sum + c.orderCount, 0),
      totalRevenue,
      avgOrderValue,
      avgCustomerValue
    });

    setOrdersByCustomer(Array.from(customerOrderMap.values()));
  };

  // Filter bookings by status
  const getFilteredBookings = () => {
    if (!cottageReport?.allBookings) return [];
    
    if (bookingStatusFilter === "all") {
      return cottageReport.allBookings;
    }
    
    return cottageReport.allBookings.filter((booking: any) => 
      booking.status === bookingStatusFilter
    );
  };

  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  // Export functions
  const exportToPDF = async () => {
    const element = document.getElementById('customer-reports');
    if (element) {
      const canvas = await html2canvas(element);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF();
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save('customer-reports.pdf');
    }
  };

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    if (reportType === "cottage-bookings" && cottageReport) {
      const ws1 = XLSX.utils.json_to_sheet(cottageReport.statusSummary);
      const ws2 = XLSX.utils.json_to_sheet(cottageReport.cottageSummary);
      const ws3 = XLSX.utils.json_to_sheet(cottageReport.allBookings);
      XLSX.utils.book_append_sheet(wb, ws1, "Status Summary");
      XLSX.utils.book_append_sheet(wb, ws2, "Cottage Summary");
      XLSX.utils.book_append_sheet(wb, ws3, "All Bookings");
    } else {
      const ws = XLSX.utils.json_to_sheet(ordersByCustomer);
      XLSX.utils.book_append_sheet(wb, ws, "Customer Reports");
    }
    
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, `${reportType}-customer-reports.xlsx`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="customer-reports">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Cottage Booking Reports</h1>
          <p className="text-muted-foreground">
            Analyze cottage booking performance, customer behavior, and revenue metrics.
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={exportToPDF} variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button onClick={exportToExcel} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={reportType} onValueChange={setReportType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Cottage Bookings" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cottage-bookings">Cottage Bookings</SelectItem>
          </SelectContent>
        </Select>

        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cottage Bookings Report Section */}
      {reportType === "cottage-bookings" && cottageReport && (
        <div className="space-y-6 mt-8">
          <div className="border-t pt-6">
            <h2 className="text-2xl font-bold mb-4">Cottage Bookings Report</h2>
            
            {/* Cottage Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {cottageReport.totalBookings}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {cottageReport.statusSummary.find((s: any) => s._id === "confirmed")?.count || 0} confirmed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    LKR {cottageReport.totalRevenue}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    From cottage bookings
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Booking Value</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    LKR {(cottageReport.totalRevenue / cottageReport.totalBookings).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Per booking average
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Cottage Performance and Status Charts */}
            <div className="grid gap-6 md:grid-cols-2 mb-6">
              {/* Cottage Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Cottage Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={cottageReport.cottageSummary}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="_id" 
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="bookings" fill="#0088FE" name="Bookings" />
                      <Bar dataKey="revenue" fill="#00C49F" name="Revenue (Rs)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Booking Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Booking Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={cottageReport.statusSummary}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {cottageReport.statusSummary.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={["#22C55E", "#3B82F6", "#EF4444"][index % 3]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Cottage Summary Table */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Cottage Performance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cottage Name</TableHead>
                      <TableHead>Total Bookings</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Avg Guests</TableHead>
                      <TableHead>Performance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cottageReport.cottageSummary.map((cottage: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{cottage._id}</TableCell>
                        <TableCell>{cottage.bookings}</TableCell>
                        <TableCell>LKR {cottage.revenue}</TableCell>
                        <TableCell>{cottage.avgGuests.toFixed(1)}</TableCell>
                        <TableCell>
                          <Badge variant={cottage.bookings > 10 ? "default" : "secondary"}>
                            {cottage.bookings > 10 ? "High" : "Moderate"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Recent Bookings */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Cottage Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cottage</TableHead>
                      <TableHead>Check-In</TableHead>
                      <TableHead>Check-Out</TableHead>
                      <TableHead>Guests</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cottageReport.recentBookings.map((booking: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{booking.cottageName}</TableCell>
                        <TableCell>{new Date(booking.checkIn).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(booking.checkOut).toLocaleDateString()}</TableCell>
                        <TableCell>{booking.guests}</TableCell>
                        <TableCell>LKR {booking.totalAmount}</TableCell>
                        <TableCell>
                          <Badge variant={booking.status === "confirmed" ? "default" : 
                                         booking.status === "pending" ? "secondary" : "destructive"}>
                            {booking.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={booking.paymentStatus === "paid" ? "default" : "outline"}>
                            {booking.paymentStatus}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* All Cottage Bookings Table */}
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      All Cottage Bookings
                      <Badge variant="secondary" className="ml-2">
                        {getFilteredBookings().length} bookings
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Complete list of all cottage bookings with status breakdown
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Select value={bookingStatusFilter} onValueChange={setBookingStatusFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Filter by Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Booking ID</TableHead>
                      <TableHead>Cottage Name</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Check-In</TableHead>
                      <TableHead>Check-Out</TableHead>
                      <TableHead>Guests</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Created Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredBookings().length > 0 ? (
                      getFilteredBookings().map((booking: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">
                            #{booking._id || booking.id || `BK-${String(idx + 1).padStart(3, '0')}`}
                          </TableCell>
                          <TableCell>{booking.cottageName}</TableCell>
                          <TableCell>{booking.customerName || booking.userId?.name || 'N/A'}</TableCell>
                          <TableCell>{new Date(booking.checkIn).toLocaleDateString()}</TableCell>
                          <TableCell>{new Date(booking.checkOut).toLocaleDateString()}</TableCell>
                          <TableCell>{booking.guests}</TableCell>
                          <TableCell>LKR {booking.totalAmount}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                booking.status === "confirmed" ? "default" : 
                                booking.status === "pending" ? "secondary" : 
                                booking.status === "cancelled" ? "destructive" : "outline"
                              }
                            >
                              {booking.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={booking.paymentStatus === "paid" ? "default" : "outline"}>
                              {booking.paymentStatus || "unpaid"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                          No cottage bookings found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerReports;