import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Download,
  Calendar,
  Users,
  FlaskConical,
  Video,
  BookOpen,
  Clock,
  CheckCircle,
  Loader2,
  BarChart3,
  Activity,
  User,
  CalendarDays
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface OverviewData {
  students: {
    total: number;
    active: number;
  };
  tours: {
    total: number;
    active: number;
  };
  sessions: {
    total: number;
    upcoming: number;
  };
  bookings: {
    total: number;
    pending: number;
    confirmed: number;
  };
  enrollments: {
    total: number;
  };
}

interface ActivityData {
  timeSpan: string;
  bookings: Array<{
    _id: string;
    count: number;
    confirmed: number;
    cancelled: number;
  }>;
  enrollments: Array<{
    _id: string;
    count: number;
    enrolled: number;
    dropped: number;
  }>;
}

const AdminReports: React.FC = () => {
  const { token } = useAuth();
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [activityData, setActivityData] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timeSpan, setTimeSpan] = useState('month');

  // Fetch overview data
  const fetchOverview = async () => {
    try {
      setLoading(true);
      setError('');

      if (!token) {
        setError('No authentication token found');
        return;
      }

      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8070';
      const response = await fetch(`${API_BASE}/api/admin/student/reports/overview`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setOverviewData(data.data);
      } else {
        setError(data.message || 'Failed to fetch overview data');
      }
    } catch (err) {
      setError('Network error occurred while fetching overview data');
      console.error('Overview fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch activity data
  const fetchActivity = async (selectedTimeSpan = timeSpan) => {
    try {
      setActivityLoading(true);
      setError('');

      if (!token) {
        setError('No authentication token found');
        return;
      }

      const params = new URLSearchParams({
        timeSpan: selectedTimeSpan,
        limit: '12'
      });

      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8070';
      const response = await fetch(`${API_BASE}/api/admin/student/reports/activity?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setActivityData(data.data);
      } else {
        setError(data.message || 'Failed to fetch activity data');
      }
    } catch (err) {
      setError('Network error occurred while fetching activity data');
      console.error('Activity fetch error:', err);
    } finally {
      setActivityLoading(false);
    }
  };

  // Handle time span change
  const handleTimeSpanChange = (newTimeSpan: string) => {
    setTimeSpan(newTimeSpan);
    fetchActivity(newTimeSpan);
  };

  // Generate CSV export data
  const exportReportsToCSV = () => {
    if (!overviewData || !activityData) {
      setError('No data available to export');
      return;
    }

    try {
      // Helper function to escape CSV values
      const escapeCSVValue = (value: any): string => {
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      };

      let csvContent = '';

      // Header for the CSV file
      csvContent += `FarmerHub Admin Reports\n`;
      csvContent += `Generated on: ${new Date().toLocaleString()}\n`;
      csvContent += `Time Span: ${timeSpan}\n\n`;

      // Overview Section
      csvContent += `OVERVIEW STATISTICS\n`;
      csvContent += `Category,Metric,Count\n`;
      csvContent += `Students,Total Students,${overviewData?.students?.total || 0}\n`;
      csvContent += `Students,Active Students,${overviewData?.students?.active || 0}\n`;
      csvContent += `Lab Tours,Total Tours,${overviewData?.tours?.total || 0}\n`;
      csvContent += `Lab Tours,Active Tours,${overviewData?.tours?.active || 0}\n`;
      csvContent += `Live Sessions,Total Sessions,${overviewData?.sessions?.total || 0}\n`;
      csvContent += `Live Sessions,Upcoming Sessions,${overviewData?.sessions?.upcoming || 0}\n`;
      csvContent += `Bookings,Total Bookings,${overviewData?.bookings?.total || 0}\n`;
      csvContent += `Bookings,Pending Bookings,${overviewData?.bookings?.pending || 0}\n`;
      csvContent += `Bookings,Confirmed Bookings,${overviewData?.bookings?.confirmed || 0}\n`;
      csvContent += `Enrollments,Total Enrollments,${overviewData?.enrollments?.total || 0}\n\n`;

      // Activity Data - Bookings Section
      csvContent += `BOOKING ACTIVITY\n`;
      csvContent += `Period,Total Count,Confirmed,Cancelled\n`;
      if (activityData?.bookings && Array.isArray(activityData.bookings)) {
        activityData.bookings.forEach(booking => {
          csvContent += `${escapeCSVValue(booking._id)},${booking.count},${booking.confirmed},${booking.cancelled}\n`;
        });
      }
      csvContent += `\n`;

      // Activity Data - Enrollments Section
      csvContent += `ENROLLMENT ACTIVITY\n`;
      csvContent += `Period,Total Count,Enrolled,Dropped\n`;
      if (activityData?.enrollments && Array.isArray(activityData.enrollments)) {
        activityData.enrollments.forEach(enrollment => {
          csvContent += `${escapeCSVValue(enrollment._id)},${enrollment.count},${enrollment.enrolled},${enrollment.dropped}\n`;
        });
      }

      // Create and download the CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `admin-reports-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccess('Reports exported to CSV successfully!');
    } catch (error) {
      console.error('Export error:', error);
      setError('Failed to export reports. Please try again.');
    }
  };

  // PDF Export Handler
  const handleExportPDF = async () => {
    try {
      const reportElement = document.querySelector('.admin-report-export-area');
      if (!reportElement) {
        setError('Report area not found');
        return;
      }

      const canvas = await html2canvas(reportElement as HTMLElement);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' });
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate dimensions from canvas
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const pdfWidth = pageWidth;
      const pdfHeight = (imgHeight * pageWidth) / imgWidth;
      
      // Add image to PDF
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('Admin_Report.pdf');
      
      setSuccess('PDF exported successfully!');
    } catch (error) {
      console.error('PDF export error:', error);
      setError('Failed to export PDF. Please try again.');
    }
  };

  // Prepare chart data
  const prepareBookingsChartData = () => {
    if (!activityData?.bookings) return [];
    
    return activityData.bookings.map(item => ({
      period: item._id,
      total: item.count,
      confirmed: item.confirmed,
      cancelled: item.cancelled,
      pending: item.count - item.confirmed - item.cancelled
    }));
  };

  const prepareEnrollmentsChartData = () => {
    if (!activityData?.enrollments) return [];
    
    return activityData.enrollments.map(item => ({
      period: item._id,
      total: item.count,
      enrolled: item.enrolled,
      dropped: item.dropped
    }));
  };

  // Prepare pie chart data for bookings status
  const prepareBookingsPieData = () => {
    if (!overviewData?.bookings) return [];
    
    return [
      { name: 'Confirmed', value: overviewData?.bookings?.confirmed || 0, color: '#22C55E' },
      { name: 'Pending', value: overviewData?.bookings?.pending || 0, color: '#F59E0B' },
      { 
        name: 'Other', 
        value: (overviewData?.bookings?.total || 0) - (overviewData?.bookings?.confirmed || 0) - (overviewData?.bookings?.pending || 0), 
        color: '#6B7280' 
      }
    ].filter(item => item.value > 0);
  };

  const formatTimeSpanLabel = (span: string) => {
    switch (span) {
      case 'week': return 'Weekly';
      case 'month': return 'Monthly';
      case 'quarter': return 'Quarterly';
      case 'year': return 'Yearly';
      default: return 'Monthly';
    }
  };

  // Effects
  useEffect(() => {
    fetchOverview();
    fetchActivity();
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Reports</h1>
          <p className="text-gray-600 mt-2">Comprehensive analytics and reporting dashboard</p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={timeSpan} onValueChange={handleTimeSpanChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Weekly</SelectItem>
              <SelectItem value="month">Monthly</SelectItem>
              <SelectItem value="quarter">Quarterly</SelectItem>
              <SelectItem value="year">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExportPDF} disabled={!overviewData || !activityData}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button onClick={exportReportsToCSV} disabled={!overviewData || !activityData}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>
      <div className="admin-report-export-area">
        {/* Alerts */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{overviewData?.students?.total || 0}</div>
                  <p className="text-xs text-green-600">
                    {overviewData?.students?.active || 0} active
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lab Tours</CardTitle>
              <FlaskConical className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{overviewData?.tours?.total || 0}</div>
                  <p className="text-xs text-green-600">
                    {overviewData?.tours?.active || 0} active
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Live Sessions</CardTitle>
              <Video className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{overviewData?.sessions?.total || 0}</div>
                  <p className="text-xs text-blue-600">
                    {overviewData?.sessions?.upcoming || 0} upcoming
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{overviewData?.bookings?.total || 0}</div>
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-green-600">{overviewData?.bookings?.confirmed || 0} confirmed</span>
                    <span className="text-yellow-600">{overviewData?.bookings?.pending || 0} pending</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Enrollments</CardTitle>
              <BookOpen className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{overviewData?.enrollments?.total || 0}</div>
                  <p className="text-xs text-muted-foreground">Active enrollments</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

                  {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Bookings Activity Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Bookings Activity ({formatTimeSpanLabel(timeSpan)})
                </CardTitle>
                <CardDescription>
                  Booking trends over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activityLoading ? (
                  <div className="flex items-center justify-center h-80">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={prepareBookingsChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="confirmed" stackId="a" fill="#22C55E" name="Confirmed" />
                      <Bar dataKey="pending" stackId="a" fill="#F59E0B" name="Pending" />
                      <Bar dataKey="cancelled" stackId="a" fill="#EF4444" name="Cancelled" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Enrollments Activity Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Enrollments Activity ({formatTimeSpanLabel(timeSpan)})
                </CardTitle>
                <CardDescription>
                  Enrollment trends over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activityLoading ? (
                  <div className="flex items-center justify-center h-80">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : prepareEnrollmentsChartData().length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-80 text-gray-500">
                    <BarChart3 className="h-10 w-10 mb-2" />
                    <span>No enrollment activity data available for this period.</span>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={prepareEnrollmentsChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="enrolled" stroke="#3B82F6" strokeWidth={2} name="Enrolled" />
                      <Line type="monotone" dataKey="dropped" stroke="#EF4444" strokeWidth={2} name="Dropped" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>


                  {/* Additional Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            {/* Booking Status Distribution */}
            <Card className="p-6">
              <CardHeader>
                <CardTitle>Booking Status Distribution</CardTitle>
                <CardDescription>
                  Current booking status breakdown
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-60">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={prepareBookingsPieData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value, percent }) => 
                          `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {prepareBookingsPieData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* System Health */}
            <Card className="p-6">
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>
                  Platform performance indicators
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-60">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-medium">Active Students</span>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        {overviewData?.students?.active || 0}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <CalendarDays className="h-5 w-5 text-blue-600" />
                        <span className="font-medium">Upcoming Sessions</span>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">
                        {overviewData?.sessions?.upcoming || 0}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Clock className="h-5 w-5 text-orange-600" />
                        <span className="font-medium">Pending Bookings</span>
                      </div>
                      <Badge className="bg-orange-100 text-orange-800">
                        {overviewData?.bookings?.pending || 0}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FlaskConical className="h-5 w-5 text-purple-600" />
                        <span className="font-medium">Active Tours</span>
                      </div>
                      <Badge className="bg-purple-100 text-purple-800">
                        {overviewData?.tours?.active || 0}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
         </div>
        </div>
    </div>
  );
};

export default AdminReports;