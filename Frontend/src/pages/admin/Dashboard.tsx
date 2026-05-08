import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp,
  Package,
  AlertTriangle,
  Clock,
  CheckCircle
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

const Dashboard = () => {
  // Mock data
  const statsCards = [
    {
      title: "Total Customers",
      value: "2,543",
      change: "+12.3%",
      icon: Users,
      trend: "up",
    },
    {
      title: "Total Orders",
      value: "1,789",
      change: "+8.1%", 
      icon: ShoppingCart,
      trend: "up",
    },
    {
      title: "Revenue",
      value: "Rs 47,382",
      change: "+15.7%",
      icon: DollarSign,
      trend: "up",
    },
    {
      title: "Growth Rate",
      value: "23.4%",
      change: "+4.2%",
      icon: TrendingUp,
      trend: "up",
    },
  ];

  const salesData = [
    { month: "Jan", products: 450, cottages: 120 },
    { month: "Feb", products: 520, cottages: 140 },
    { month: "Mar", products: 480, cottages: 160 },
    { month: "Apr", products: 680, cottages: 180 },
    { month: "May", products: 750, cottages: 200 },
    { month: "Jun", products: 820, cottages: 220 },
  ];

  const categoryData = [
    { name: "Vegetables", value: 35, color: "#22C55E" },
    { name: "Fruits", value: 25, color: "#EAB308" },
    { name: "Dairy", value: 20, color: "#3B82F6" },
    { name: "Grains", value: 20, color: "#F97316" },
  ];

  const recentOrders = [
    { id: "#1234", customer: "Sarah Johnson", product: "Organic Tomatoes", amount: "$45.99", status: "completed" },
    { id: "#1235", customer: "Mike Chen", product: "Fresh Milk", amount: "$12.50", status: "pending" },
    { id: "#1236", customer: "Emma Davis", product: "Honey", amount: "$28.00", status: "completed" },
    { id: "#1237", customer: "John Smith", product: "Cottage Stay", amount: "$120.00", status: "confirmed" },
  ];

  const lowStockProducts = [
    { name: "Organic Carrots", stock: 5, threshold: 20 },
    { name: "Fresh Herbs", stock: 8, threshold: 25 },
    { name: "Artisan Cheese", stock: 3, threshold: 15 },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
  <h1 className="text-3xl font-bold text-foreground mb-2">Product Dashboard Overview</h1>
        <p className="text-muted-foreground">Welcome back! Here's what's happening with your farm marketplace.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <Card key={index} className="border-border bg-card shadow-card hover:shadow-natural transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <div className="flex items-center mt-1">
                    <TrendingUp className="h-4 w-4 text-success mr-1" />
                    <span className="text-sm text-success">{stat.change}</span>
                  </div>
                </div>
                <div className="p-3 bg-gradient-primary rounded-lg shadow-natural">
                  <stat.icon className="h-6 w-6 text-primary-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <Card className="border-border bg-card shadow-card">
          <CardHeader>
            <CardTitle className="text-foreground">Sales Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" />
                <YAxis />
                <Bar dataKey="products" fill="hsl(var(--primary))" name="Products" />
                <Bar dataKey="cottages" fill="hsl(var(--accent))" name="Cottages" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card className="border-border bg-card shadow-card">
          <CardHeader>
            <CardTitle className="text-foreground">Product Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card className="border-border bg-card shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-foreground">Recent Orders</CardTitle>
            <Button variant="outline" size="sm">View All</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-foreground">{order.customer}</p>
                    <p className="text-sm text-muted-foreground">{order.product}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-foreground">{order.amount}</p>
                    <Badge 
                      variant={order.status === "completed" ? "default" : order.status === "confirmed" ? "secondary" : "outline"}
                      className="text-xs"
                    >
                      {order.status === "completed" && <CheckCircle className="w-3 h-3 mr-1" />}
                      {order.status === "pending" && <Clock className="w-3 h-3 mr-1" />}
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card className="border-border bg-card shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-foreground flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Low Stock Alert
            </CardTitle>
            <Badge variant="destructive">{lowStockProducts.length}</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStockProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-warning/10 border border-warning/20">
                  <div>
                    <p className="font-medium text-foreground">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Stock: {product.stock} / Threshold: {product.threshold}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" className="border-warning text-warning hover:bg-warning hover:text-warning-foreground">
                    Restock
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;