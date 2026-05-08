import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { AppSidebar } from '@/components/layout/StudentAppSidebar';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { 
  Video,
  Calendar,
  Clock,
  User,
  Users,
  Search,
  Filter,
  Plus,
  UserMinus,
  CheckCircle,
  AlertCircle,
  Loader2,
  CalendarDays,
  PlayCircle,
  UserPlus
} from 'lucide-react';

interface LiveSession {
  _id: string;
  title: string;
  description?: string;
  instructor: string;
  startTime: string;
  endTime: string;
  capacity: number;
  participants: string[];
  isEnrolled: boolean;
  isFull: boolean;
  enrollmentCount: number;
  spotsAvailable: number;
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

const StudentLiveSessions: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [availableSessions, setAvailableSessions] = useState<LiveSession[]>([]);
  const [mySessions, setMySessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [mySessionsLoading, setMySessionsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') === 'mysessions' ? 'mysessions' : 'available');

  // Available sessions state
  const [sessionsPagination, setSessionsPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 6,
    pages: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [instructorFilter, setInstructorFilter] = useState('');

  // My sessions state
  const [mySessionsPagination, setMySessionsPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0
  });
  const [upcomingFilter, setUpcomingFilter] = useState('true');

  // Enrollment dialog state
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<LiveSession | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch available live sessions
  const fetchAvailableSessions = async () => {
    try {
      setSessionsLoading(true);
      setError('');

      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      // Build query parameters with fallback values
      const params = new URLSearchParams({
        page: (sessionsPagination?.page ?? 1).toString(),
        limit: (sessionsPagination?.limit ?? 6).toString(),
        upcoming: 'true',
        sort: 'startTime',
        order: 'asc'
      });

      if (searchTerm) params.append('search', searchTerm);
      if (instructorFilter) params.append('instructor', instructorFilter);

      let data;
      try {
        const response = await fetch(`http://localhost:8070/api/student/sessions?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        data = await response.json();

        if (response.ok && data.success) {
          setAvailableSessions(data.sessions || []);
          setSessionsPagination({
            total: data.pagination?.total ?? 0,
            page: data.pagination?.page ?? data.pagination?.currentPage ?? 1,
            limit: data.pagination?.limit ?? 6,
            pages: data.pagination?.pages ?? data.pagination?.totalPages ?? 0
          });
        } else {
          setError(data.message || 'Failed to fetch available sessions');
        }
      } catch (jsonErr) {
        setError('Network error occurred while fetching sessions');
        console.error('Sessions fetch error:', jsonErr);
      }
    } catch (err) {
      setError('Network error occurred while fetching sessions');
      console.error('Sessions fetch error:', err);
    } finally {
      setSessionsLoading(false);
      setLoading(false);
    }
  };

  // Fetch my enrolled sessions
  const fetchMySessions = async () => {
    try {
      setMySessionsLoading(true);
      setError('');

      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      // Build query parameters with fallback values
      const params = new URLSearchParams({
        page: (mySessionsPagination?.page ?? 1).toString(),
        limit: (mySessionsPagination?.limit ?? 10).toString(),
        sort: 'startTime',
        order: 'asc'
      });

      // Only add upcoming filter if not "all"
      if (upcomingFilter !== 'all') {
        params.append('upcoming', upcomingFilter);
      }

      let data;
      try {
        const response = await fetch(`http://localhost:8070/api/student/sessions/mine?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        data = await response.json();

        if (response.ok && data.success) {
          setMySessions(data.sessions || []);
          setMySessionsPagination({
            total: data.pagination?.total ?? 0,
            page: data.pagination?.page ?? data.pagination?.currentPage ?? 1,
            limit: data.pagination?.limit ?? 10,
            pages: data.pagination?.pages ?? data.pagination?.totalPages ?? 0
          });
        } else {
          setError(data.message || 'Failed to fetch your sessions');
        }
      } catch (jsonErr) {
        setError('Network error occurred while fetching your sessions');
        console.error('My sessions fetch error:', jsonErr);
      }
    } catch (err) {
      setError('Network error occurred while fetching your sessions');
      console.error('My sessions fetch error:', err);
    } finally {
      setMySessionsLoading(false);
    }
  };

  // Enroll in a session
  const enrollInSession = async (sessionId: string) => {
    try {
      setSubmitting(true);
      setError('');

      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const response = await fetch(`http://localhost:8070/api/student/sessions/${sessionId}/enroll`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('Successfully enrolled in the live session!');
        setIsEnrollDialogOpen(false);
        setSelectedSession(null);
        fetchAvailableSessions();
        fetchMySessions();
      } else {
        setError(data.message || 'Failed to enroll in session');
      }
    } catch (err) {
      setError('Network error occurred while enrolling in session');
      console.error('Enrollment error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Drop enrollment from a session
  const dropSession = async (sessionId: string) => {
    try {
      setError('');

      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const response = await fetch(`http://localhost:8070/api/student/sessions/${sessionId}/drop`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('Successfully dropped enrollment from the session!');
        fetchAvailableSessions();
        fetchMySessions();
      } else {
        setError(data.message || 'Failed to drop enrollment');
      }
    } catch (err) {
      setError('Network error occurred while dropping enrollment');
      console.error('Drop enrollment error:', err);
    }
  };

  // Helper functions
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getSessionDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end.getTime() - start.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const canEnrollInSession = (session: LiveSession) => {
    return !session.isEnrolled && !session.isFull && new Date(session.startTime) > new Date();
  };

  const canDropSession = (session: LiveSession) => {
    return session.isEnrolled && new Date(session.endTime) > new Date();
  };

  const getSessionStatus = (session: LiveSession) => {
    const now = new Date();
    const startTime = new Date(session.startTime);
    const endTime = new Date(session.endTime);

    if (now < startTime) {
      return { status: 'Upcoming', color: 'bg-blue-100 text-blue-800' };
    } else if (now >= startTime && now <= endTime) {
      return { status: 'Live', color: 'bg-green-100 text-green-800' };
    } else {
      return { status: 'Ended', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const openEnrollDialog = (session: LiveSession) => {
    setSelectedSession(session);
    setIsEnrollDialogOpen(true);
  };

  // Effects
  useEffect(() => {
    fetchAvailableSessions();
    fetchMySessions();
  }, []);

  useEffect(() => {
    if (activeTab === 'available') {
      fetchAvailableSessions();
    } else {
      fetchMySessions();
    }
  }, [
    sessionsPagination.page, 
    mySessionsPagination.page, 
    searchTerm, 
    instructorFilter, 
    upcomingFilter
  ]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="pl-0 pr-4 py-4 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Live Sessions</h1>
            <p className="text-gray-600 mt-2">Join live learning sessions and interactive workshops</p>
          </div>

          {/* Alerts */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="available">Available Sessions</TabsTrigger>
          <TabsTrigger value="mysessions">My Sessions</TabsTrigger>
        </TabsList>

        {/* Available Sessions Tab */}
        <TabsContent value="available" className="space-y-4">
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="h-5 w-5 mr-2" />
                Search Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search sessions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Input
                  placeholder="Filter by instructor"
                  value={instructorFilter}
                  onChange={(e) => setInstructorFilter(e.target.value)}
                />
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('');
                    setInstructorFilter('');
                    setSessionsPagination(prev => ({ ...prev, page: 1 }));
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Available Sessions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessionsLoading || loading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <Card key={index} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : availableSessions.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Video className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Sessions Available</h3>
                <p className="text-gray-600">Check back later for new live learning opportunities!</p>
              </div>
            ) : (
              availableSessions.map((session) => {
                const sessionStatus = getSessionStatus(session);
                return (
                  <Card key={session._id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-start justify-between">
                        <span className="text-lg">{session.title}</span>
                        <div className="flex flex-col gap-1">
                          <Badge className={sessionStatus.color}>
                            {sessionStatus.status}
                          </Badge>
                          {session.isEnrolled && (
                            <Badge className="bg-green-100 text-green-800">
                              Enrolled
                            </Badge>
                          )}
                          {session.isFull && (
                            <Badge className="bg-red-100 text-red-800">
                              Full
                            </Badge>
                          )}
                        </div>
                      </CardTitle>
                      {session.description && (
                        <CardDescription className="line-clamp-2">
                          {session.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center text-sm text-gray-600">
                          <User className="h-4 w-4 mr-2" />
                          Instructor: {session.instructor}
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          {formatDate(session.startTime)}
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="h-4 w-4 mr-2" />
                          {formatTime(session.startTime)} - {formatTime(session.endTime)}
                          <span className="ml-2 text-xs text-gray-500">
                            ({getSessionDuration(session.startTime, session.endTime)})
                          </span>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="h-4 w-4 mr-2" />
                          {session.enrollmentCount}/{session.capacity} enrolled
                          {session.spotsAvailable > 0 && (
                            <span className="ml-2 text-green-600">
                              ({session.spotsAvailable} spots left)
                            </span>
                          )}
                        </div>
                        
                        <div className="pt-2">
                          {session.isEnrolled ? (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" className="w-full text-red-600 hover:text-red-700">
                                  <UserMinus className="h-4 w-4 mr-2" />
                                  Drop Enrollment
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Drop Enrollment</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to drop your enrollment from "{session.title}"?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Keep Enrollment</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => dropSession(session._id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Drop Enrollment
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          ) : (
                            <Button 
                              className="w-full" 
                              onClick={() => openEnrollDialog(session)}
                              disabled={!canEnrollInSession(session)}
                            >
                              <UserPlus className="h-4 w-4 mr-2" />
                              {session.isFull ? 'Session Full' : 'Enroll Now'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* Sessions Pagination */}
          {sessionsPagination.pages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setSessionsPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={sessionsPagination.page <= 1}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {sessionsPagination.page} of {sessionsPagination.pages}
              </span>
              <Button
                variant="outline"
                onClick={() => setSessionsPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={sessionsPagination.page >= sessionsPagination.pages}
              >
                Next
              </Button>
            </div>
          )}
        </TabsContent>

        {/* My Sessions Tab */}
        <TabsContent value="mysessions" className="space-y-4">
          {/* Sessions Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filter Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <Select value={upcomingFilter} onValueChange={setUpcomingFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter sessions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Upcoming Sessions</SelectItem>
                    <SelectItem value="false">Past Sessions</SelectItem>
                    <SelectItem value="all">All Sessions</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setUpcomingFilter('all');
                    setMySessionsPagination(prev => ({ ...prev, page: 1 }));
                  }}
                >
                  Reset Filter
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* My Sessions List */}
          <Card>
            <CardHeader>
              <CardTitle>Your Enrolled Sessions</CardTitle>
              <CardDescription>
                {mySessionsLoading ? 'Loading...' : `${mySessions.length} session(s) found`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mySessionsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="animate-pulse p-4 border rounded-lg">
                      <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  ))}
                </div>
              ) : mySessions.length === 0 ? (
                <div className="text-center py-12">
                  <CalendarDays className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Sessions Yet</h3>
                  <p className="text-gray-600 mb-4">You haven't enrolled in any live sessions yet.</p>
                  <Button onClick={() => setActiveTab('available')}>
                    Browse Available Sessions
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {mySessions.map((session) => {
                    const sessionStatus = getSessionStatus(session);
                    return (
                      <div key={session._id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="font-semibold text-lg">{session.title}</h3>
                              <Badge className={sessionStatus.color}>
                                {sessionStatus.status}
                              </Badge>
                              <Badge className="bg-green-100 text-green-800">
                                Enrolled
                              </Badge>
                            </div>
                            
                            {session.description && (
                              <p className="text-gray-600 mb-3">{session.description}</p>
                            )}
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-gray-600">
                              <div className="flex items-center">
                                <User className="h-4 w-4 mr-1" />
                                {session.instructor}
                              </div>
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                {formatDate(session.startTime)}
                              </div>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                {formatTime(session.startTime)} - {formatTime(session.endTime)}
                              </div>
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-1" />
                                {session.enrollmentCount}/{session.capacity} enrolled
                              </div>
                            </div>
                          </div>
                          
                          <div className="ml-4 flex items-center space-x-2">
                            {sessionStatus.status === 'Live' && (
                              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                <PlayCircle className="h-4 w-4 mr-1" />
                                Join Live
                              </Button>
                            )}
                            {canDropSession(session) && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                                    <UserMinus className="h-4 w-4 mr-1" />
                                    Drop
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Drop Enrollment</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to drop your enrollment from "{session.title}"?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Keep Enrollment</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => dropSession(session._id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Drop Enrollment
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* My Sessions Pagination */}
              {mySessionsPagination.pages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setMySessionsPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={mySessionsPagination.page <= 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {mySessionsPagination.page} of {mySessionsPagination.pages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setMySessionsPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={mySessionsPagination.page >= mySessionsPagination.pages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Enrollment Confirmation Dialog */}
      <Dialog open={isEnrollDialogOpen} onOpenChange={setIsEnrollDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enroll in Live Session</DialogTitle>
            <DialogDescription>
              Confirm your enrollment for this live session
            </DialogDescription>
          </DialogHeader>
          {selectedSession && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedSession.title}</h3>
                {selectedSession.description && (
                  <p className="text-gray-600 text-sm mt-1">{selectedSession.description}</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-gray-500" />
                  Instructor: {selectedSession.instructor}
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                  {formatDateTime(selectedSession.startTime)}
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-gray-500" />
                  Duration: {getSessionDuration(selectedSession.startTime, selectedSession.endTime)}
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2 text-gray-500" />
                  {selectedSession.enrollmentCount}/{selectedSession.capacity} enrolled
                  ({selectedSession.spotsAvailable} spots left)
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEnrollDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => selectedSession && enrollInSession(selectedSession._id)} 
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enrolling...
                </>
              ) : (
                'Confirm Enrollment'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default StudentLiveSessions;