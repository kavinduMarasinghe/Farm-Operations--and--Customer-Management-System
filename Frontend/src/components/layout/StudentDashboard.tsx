import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { 
  BookOpen,
  Calendar,
  Video,
  FlaskConical,
  Users,
  Clock,
  CheckCircle,
  TrendingUp,
  Award,
  AlertCircle,
  Eye,
  Download,
  ExternalLink,
  PlayCircle,
  MapPin
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Tooltip } from "recharts";
import { useNavigate } from 'react-router-dom';
import { AppSidebar } from './StudentAppSidebar';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

interface DashboardStats {
  totalMaterials: number;
  enrolledSessions: number;
  confirmedBookings: number;
  cancelledBookings: number;
  pendingBookings: number;
  totalLabTours: number;
}

interface RecentActivity {
  id: string;
  type: 'session' | 'booking' | 'material';
  title: string;
  action: string;
  date: string;
  status?: string;
}

interface UpcomingEvent {
  id: string;
  type: 'session' | 'booking';
  title: string;
  date: string;
  time: string;
  location?: string;
  instructor?: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<DashboardStats>({
    totalMaterials: 0,
    enrolledSessions: 0,
    confirmedBookings: 0,
    cancelledBookings: 0,
    pendingBookings: 0,
    totalLabTours: 0
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [enrollmentChartData, setEnrollmentChartData] = useState<Array<{ period: string; count: number }>>([]);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      if (!token) {
        setError('No authentication token found');
        return;
      }

      // Fetch multiple endpoints in parallel
      const [materialsRes, sessionsUpcomingRes, sessionsPastRes, bookingsRes, labToursRes] = await Promise.all([
        fetch('http://localhost:8070/api/student/materials?limit=5', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        // upcoming sessions (for quick display)
        fetch('http://localhost:8070/api/student/sessions/mine?limit=5', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        // past sessions (for historical enrollment graph and totals)
        fetch('http://localhost:8070/api/student/sessions/mine?upcoming=false&limit=100', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:8070/api/student/bookings/mine?limit=100', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:8070/api/student/labtours?limit=100', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      // Process responses
  const materialsData = materialsRes.ok ? await materialsRes.json() : { materials: [], pagination: { total: 0 } };
  const sessionsUpcomingData = sessionsUpcomingRes.ok ? await sessionsUpcomingRes.json() : { sessions: [], pagination: { total: 0 } };
  const sessionsPastData = sessionsPastRes.ok ? await sessionsPastRes.json() : { sessions: [], pagination: { total: 0 } };
      const bookingsData = bookingsRes.ok ? await bookingsRes.json() : { bookings: [], pagination: { total: 0 } };
      const labToursData = labToursRes.ok ? await labToursRes.json() : { tours: [], pagination: { total: 0 } };

      // Count confirmed/completed from all bookings in the array (up to 100)
      let confirmedBookings = 0;
      let cancelledBookings = 0;
      let pendingBookings = 0;
      if (bookingsData.bookings && bookingsData.bookings.length > 0) {
        confirmedBookings = bookingsData.bookings.filter((b: any) => b.status === 'CONFIRMED').length;
        cancelledBookings = bookingsData.bookings.filter((b: any) => b.status === 'CANCELLED').length;
        pendingBookings = bookingsData.bookings.filter((b: any) => b.status === 'PENDING').length;
      }
      // Combine upcoming + past counts to get total enrolled sessions
      const totalEnrolled = (sessionsUpcomingData.pagination?.total || 0) + (sessionsPastData.pagination?.total || 0);

      setStats({
        totalMaterials: materialsData.pagination?.total || 0,
        enrolledSessions: totalEnrolled,
        confirmedBookings,
        cancelledBookings,
        pendingBookings,
        totalLabTours: labToursData.pagination?.total || 0
      });

      // Process recent activities
      const activities: RecentActivity[] = [];
      
      // Add recent materials
      if (materialsData.materials) {
        materialsData.materials.slice(0, 3).forEach((material: any) => {
          activities.push({
            id: material._id,
            type: 'material',
            title: material.title,
            action: 'Added',
            date: material.createdAt,
            status: material.type
          });
        });
      }

      // Add recent sessions (from upcoming + past merged, sort will trim to top 5 later)
      const mergedSessions = [
        ...(sessionsUpcomingData.sessions || []),
        ...(sessionsPastData.sessions || [])
      ];
      if (mergedSessions.length > 0) {
        mergedSessions.slice(0, 5).forEach((session: any) => {
          activities.push({
            id: session._id,
            type: 'session',
            title: session.title,
            action: 'Enrolled',
            date: session.startTime || session.createdAt,
            status: new Date(session.startTime) > new Date() ? 'upcoming' : 'past'
          });
        });
      }

      // Sort activities by date
      activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentActivities(activities.slice(0, 5));

      // Process upcoming events
      const events: UpcomingEvent[] = [];
      
      // Add upcoming sessions (use upcoming data)
      if (sessionsUpcomingData.sessions) {
        sessionsUpcomingData.sessions
          .filter((session: any) => new Date(session.startTime) > new Date())
          .slice(0, 3)
          .forEach((session: any) => {
            events.push({
              id: session._id,
              type: 'session',
              title: session.title,
              date: session.startTime,
              time: new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              instructor: session.instructor
            });
          });
      }

      // Add upcoming bookings
      if (bookingsData.bookings) {
        bookingsData.bookings
          .filter((booking: any) => booking.status === 'CONFIRMED' && new Date(booking.tourDate) > new Date())
          .slice(0, 2)
          .forEach((booking: any) => {
            events.push({
              id: booking._id,
              type: 'booking',
              title: booking.tourTitle || 'Lab Tour',
              date: booking.tourDate,
              time: booking.timeSlot || 'TBD',
              location: booking.location || 'Lab'
            });
          });
      }

      // Sort events by date
      events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setUpcomingEvents(events.slice(0, 5));

  // Prepare enrollment chart data (last 6 months)
      const monthsToShow = 6;
      const now = new Date();
      const monthBuckets: Record<string, number> = {};
      // initialize buckets
      for (let i = monthsToShow - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toLocaleString(undefined, { year: 'numeric', month: 'short' });
        monthBuckets[key] = 0;
      }

      // Count sessions by month
      const allSessions = mergedSessions || [];
      allSessions.forEach((s: any) => {
        const dt = s.startTime ? new Date(s.startTime) : new Date(s.createdAt);
        const key = dt.toLocaleString(undefined, { year: 'numeric', month: 'short' });
        if (key in monthBuckets) monthBuckets[key] += 1;
      });
      const chartData = Object.keys(monthBuckets).map(k => ({ period: k, count: monthBuckets[k] }));
      setEnrollmentChartData(chartData);

    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Helper functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'material':
        return <BookOpen className="h-4 w-4" />;
      case 'session':
        return <Video className="h-4 w-4" />;
      case 'booking':
        return <FlaskConical className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string, status?: string) => {
    switch (type) {
      case 'material':
        return 'bg-blue-100 text-blue-800';
      case 'session':
        return status === 'upcoming' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
      case 'booking':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Chart data
  const activityData = [
    { name: 'Materials', value: stats.totalMaterials, color: '#3b82f6' },
    { name: 'Sessions', value: stats.enrolledSessions, color: '#10b981' },
    { name: 'Bookings', value: stats.confirmedBookings + stats.cancelledBookings + stats.pendingBookings, color: '#8b5cf6' }
  ];

  const progressData = [
    { name: 'Confirmed', value: stats.confirmedBookings, color: '#10b981' },
    { name: 'Pending', value: stats.pendingBookings, color: '#6366f1' },
    { name: 'Cancelled', value: stats.cancelledBookings, color: '#ef4444' }
  ];

  // Stats cards data
  const statsCards = [
    {
      title: "Learning Materials",
      value: stats.totalMaterials.toString(),
      description: "Available resources",
      icon: BookOpen,
      trend: "View Materials",
      onClick: () => navigate('/student/materials'),
      color: "bg-blue-50 border-blue-200"
    },
    {
      title: "Enrolled Sessions",
      value: stats.enrolledSessions.toString(),
      description: "Live learning sessions",
      icon: Video,
      trend: "View My Sessions",
      onClick: () => navigate('/student/livesessions?tab=mysessions'),
      color: "bg-green-50 border-green-200"
    },
    {
      title: "Confirmed Bookings",
      value: stats.confirmedBookings.toString(),
      description: "Confirmed lab tours",
      icon: FlaskConical,
      trend: "View Bookings",
      onClick: () => navigate('/student/bookings'),
      color: "bg-purple-50 border-purple-200"
    },
    {
      title: "Lab Tours",
      value: stats.totalLabTours.toString(),
      description: "Available lab tours",
      icon: MapPin,
      trend: "View Lab Tours",
      onClick: () => navigate('/student/bookings'),
      color: "bg-orange-50 border-orange-200"
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="pl-0 pr-4 py-4 space-y-5">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Student Dashboard Overview</h1>
            <p className="text-gray-600 mt-2">Welcome to your learning hub</p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((card, index) => (
          <Card 
            key={index} 
            className={`${card.color} cursor-pointer hover:shadow-lg transition-all duration-200 transform hover:scale-105`}
            onClick={card.onClick}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">
                {card.title}
              </CardTitle>
              <card.icon className="h-5 w-5 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{card.value}</div>
              <p className="text-xs text-gray-600 mt-1">{card.description}</p>
              <Button variant="link" className="text-xs p-0 h-auto mt-2 text-blue-600">
                {card.trend} →
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Activity Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Learning Activity Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={activityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {activityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="w-full h-64">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Enrollments (last 6 months)</h3>
                <ResponsiveContainer width="100%" height="86%">
                  <LineChart data={enrollmentChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="lg:col-span-2 flex justify-center space-x-4 mt-4">
                {activityData.map((item, index) => (
                  <div key={index} className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-sm text-gray-600">{item.name}: {item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Recent Activities
            </CardTitle>
            <Button variant="outline" size="sm">View All</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No recent activities</p>
              ) : (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <div className="flex items-center space-x-3">
                      {getActivityIcon(activity.type)}
                      <div>
                        <p className="font-medium text-gray-900">{activity.title}</p>
                        <p className="text-sm text-gray-600">{activity.action} • {formatDate(activity.date)}</p>
                      </div>
                    </div>
                    <Badge className={getActivityColor(activity.type, activity.status)}>
                      {activity.status || activity.type}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Upcoming Events
            </CardTitle>
            <Button variant="outline" size="sm">View Calendar</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingEvents.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No upcoming events</p>
              ) : (
                upcomingEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      {event.type === 'session' ? (
                        <Video className="h-4 w-4 text-green-600" />
                      ) : (
                        <FlaskConical className="h-4 w-4 text-purple-600" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{event.title}</p>
                        <p className="text-sm text-gray-600">
                          {formatDate(event.date)} at {event.time}
                        </p>
                        {event.instructor && (
                          <p className="text-xs text-gray-500">Instructor: {event.instructor}</p>
                        )}
                        {event.location && (
                          <p className="text-xs text-gray-500 flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {event.location}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      {event.type === 'session' ? (
                        <>
                          <PlayCircle className="h-4 w-4 mr-1" />
                          Join
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </>
                      )}
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex flex-col space-y-2"
              onClick={() => navigate('/student/materials')}
            >
              <BookOpen className="h-6 w-6" />
              <span className="text-sm">Browse Materials</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col space-y-2"
              onClick={() => navigate('/student/livesessions')}
            >
              <Video className="h-6 w-6" />
              <span className="text-sm">Join Sessions</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col space-y-2"
              onClick={() => navigate('/student/bookings')}
            >
              <FlaskConical className="h-6 w-6" />
              <span className="text-sm">Book Lab Tour</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col space-y-2"
              onClick={() => navigate('/profile')}
            >
              <Users className="h-6 w-6" />
              <span className="text-sm">View Profile</span>
            </Button>
          </div>
        </CardContent>
      </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Dashboard;