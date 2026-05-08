import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Video, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Users,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  UserPlus,
  UserMinus,
  Settings
} from 'lucide-react';

interface LiveSession {
  _id: string;
  title: string;
  description?: string;
  instructor?: string;
  startTime: string;
  endTime?: string;
  capacity: number;
  participants: string[];
  participantCount: number;
  spotsAvailable: number;
  isFull: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

const AdminLiveSession: React.FC = () => {
  const { token } = useAuth();
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0
  });

  // Form state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCapacityDialogOpen, setIsCapacityDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<LiveSession | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructor: '',
    startTime: '',
    endTime: '',
    capacity: '50'
  });

  // View dialog state
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewSession, setViewSession] = useState<LiveSession | null>(null);

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [timeframe, setTimeframe] = useState('all');
  const [instructor, setInstructor] = useState('');

  // UI state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch sessions
  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!token) {
        setError('No authentication token found');
        return;
      }

      // Build query parameters
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      });

      if (searchTerm) params.append('search', searchTerm);
      if (timeframe !== 'all') params.append('timeframe', timeframe);
      if (instructor) params.append('instructor', instructor);

      const response = await fetch(`http://localhost:8070/api/admin/student/livesession?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSessions(data.sessions);
        setPagination(data.pagination);
      } else {
        setError(data.message || 'Failed to fetch live sessions');
      }
    } catch (err) {
      setError('Network error occurred while fetching live sessions');
      console.error('Live session fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create session
  const createSession = async () => {
    try {
      setSubmitting(true);
      setError('');

      if (!token) {
        setError('No authentication token found');
        return;
      }

      const payload = {
        ...formData,
        capacity: parseInt(formData.capacity)
      };

      const response = await fetch('http://localhost:8070/api/admin/student/livesession', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('Live session created successfully!');
        setIsCreateDialogOpen(false);
        resetForm();
        fetchSessions();
      } else {
        setError(data.message || 'Failed to create live session');
      }
    } catch (err) {
      setError('Network error occurred while creating live session');
      console.error('Live session creation error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Update session
  const updateSession = async () => {
    if (!editingSession) return;

    try {
      setSubmitting(true);
      setError('');

      if (!token) {
        setError('No authentication token found');
        return;
      }

      const payload = {
        ...formData,
        capacity: parseInt(formData.capacity)
      };

      const response = await fetch(`http://localhost:8070/api/admin/student/livesession/${editingSession._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('Live session updated successfully!');
        setIsEditDialogOpen(false);
        setEditingSession(null);
        resetForm();
        fetchSessions();
      } else {
        setError(data.message || 'Failed to update live session');
      }
    } catch (err) {
      setError('Network error occurred while updating live session');
      console.error('Live session update error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete session
  const deleteSession = async (sessionId: string) => {
    try {
      setError('');

      if (!token) {
        setError('No authentication token found');
        return;
      }

      const response = await fetch(`http://localhost:8070/api/admin/student/livesession/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('Live session deleted successfully!');
        fetchSessions();
      } else {
        setError(data.message || 'Failed to delete live session');
      }
    } catch (err) {
      setError('Network error occurred while deleting live session');
      console.error('Live session deletion error:', err);
    }
  };

  // Adjust capacity
  const adjustCapacity = async (sessionId: string, newCapacity: number) => {
    try {
      setError('');

      if (!token) {
        setError('No authentication token found');
        return;
      }

      const response = await fetch(`http://localhost:8070/api/admin/student/livesession/${sessionId}/capacity`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ capacity: newCapacity })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('Capacity updated successfully!');
        setIsCapacityDialogOpen(false);
        fetchSessions();
      } else {
        setError(data.message || 'Failed to update capacity');
      }
    } catch (err) {
      setError('Network error occurred while updating capacity');
      console.error('Capacity update error:', err);
    }
  };

  // Helper functions
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      instructor: '',
      startTime: '',
      endTime: '',
      capacity: '50'
    });
  };

  const openEditDialog = (session: LiveSession) => {
    setEditingSession(session);
    setFormData({
      title: session.title,
      description: session.description || '',
      instructor: session.instructor || '',
      startTime: new Date(session.startTime).toISOString().slice(0, 16),
      endTime: session.endTime ? new Date(session.endTime).toISOString().slice(0, 16) : '',
      capacity: session.capacity.toString()
    });
    setIsEditDialogOpen(true);
  };

  const getSessionStatus = (session: LiveSession) => {
    const now = new Date();
    const startTime = new Date(session.startTime);
    const endTime = session.endTime ? new Date(session.endTime) : null;

    if (endTime && now > endTime) return 'completed';
    if (now >= startTime && (!endTime || now <= endTime)) return 'live';
    if (now < startTime) return 'scheduled';
    return 'unknown';
  };

  const getStatusBadge = (session: LiveSession) => {
    const status = getSessionStatus(session);
    
    switch (status) {
      case 'live':
        return <Badge className="bg-red-100 text-red-800">🔴 Live</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800">📅 Scheduled</Badge>;
      case 'completed':
        return <Badge className="bg-gray-100 text-gray-800">✅ Completed</Badge>;
      default:
        return <Badge variant="outline">❓ Unknown</Badge>;
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Effects
  useEffect(() => {
    fetchSessions();
  }, [pagination.page, searchTerm, timeframe, instructor]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const clearSearch = () => {
    setSearchTerm('');
    setTimeframe('all');
    setInstructor('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Live Sessions</h1>
          <p className="text-gray-600 mt-2">Manage live educational sessions and webinars</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Create Session
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Live Session</DialogTitle>
              <DialogDescription>
                Schedule a new live educational session
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Session title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Session description"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructor">Instructor</Label>
                <Input
                  id="instructor"
                  value={formData.instructor}
                  onChange={(e) => setFormData(prev => ({ ...prev, instructor: e.target.value }))}
                  placeholder="Instructor name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time *</Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                  placeholder="Maximum participants"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createSession} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Session'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

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

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search sessions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger>
                <SelectValue placeholder="All Sessions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sessions</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="past">Past</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Instructor name"
              value={instructor}
              onChange={(e) => setInstructor(e.target.value)}
            />
            <Button variant="outline" onClick={clearSearch}>
              Clear Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total}</div>
            <p className="text-xs text-muted-foreground">Live sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Live Now</CardTitle>
            <div className="h-4 w-4 bg-red-500 rounded-full animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sessions.filter(s => getSessionStatus(s) === 'live').length}
            </div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sessions.filter(s => getSessionStatus(s) === 'scheduled').length}
            </div>
            <p className="text-xs text-muted-foreground">Scheduled sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sessions.reduce((total, session) => total + session.participantCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Across all sessions</p>
          </CardContent>
        </Card>
      </div>

      {/* Sessions List */}
      <Card>
        <CardHeader>
          <CardTitle>Live Sessions</CardTitle>
          <CardDescription>
            Showing {sessions.length} of {pagination.total} sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading sessions...</span>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8">
              <Video className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No sessions found</h3>
              <p className="text-gray-600">Try adjusting your search or create a new session.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div key={session._id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Video className="h-5 w-5 text-blue-600" />
                        <h3 className="font-medium text-lg">{session.title}</h3>
                        {getStatusBadge(session)}
                        {session.isFull && (
                          <Badge className="bg-orange-100 text-orange-800">Full</Badge>
                        )}
                      </div>
                      
                      {session.description && (
                        <p className="text-gray-600 mb-2">{session.description}</p>
                      )}
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500 mb-2">
                        {session.instructor && (
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            <span>Instructor: {session.instructor}</span>
                          </div>
                        )}
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>Start: {formatDateTime(session.startTime)}</span>
                        </div>
                        {session.endTime && (
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>End: {formatDateTime(session.endTime)}</span>
                          </div>
                        )}
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          <span>{session.participantCount}/{session.capacity} participants</span>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-500">
                        <span>Available spots: {session.spotsAvailable}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button size="sm" variant="outline" onClick={() => { setViewSession(session); setIsViewDialogOpen(true); }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openEditDialog(session)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setEditingSession(session);
                          setFormData(prev => ({ ...prev, capacity: session.capacity.toString() }));
                          setIsCapacityDialogOpen(true);
                        }}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Session</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{session.title}"? This action cannot be undone.
                              {session.participantCount > 0 && (
                                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                                  ⚠️ This session has {session.participantCount} participants enrolled.
                                </div>
                              )}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deleteSession(session._id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
      {/* View Session Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <style>{`.fixed.inset-0.bg-black\/50 {background-color: rgba(37,99,235,0.5)!important;}`}</style>
          <DialogHeader>
            <DialogTitle>Session Details</DialogTitle>
            <DialogDescription>Full details of the live session</DialogDescription>
          </DialogHeader>
          {viewSession && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Title</Label>
                  <p className="text-sm">{viewSession.title}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  {getStatusBadge(viewSession)}
                </div>
              </div>
              {viewSession.description && (
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <div className="bg-gray-50 p-3 rounded text-sm">{viewSession.description}</div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Instructor</Label>
                  <p className="text-sm">{viewSession.instructor || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Capacity</Label>
                  <p className="text-sm">{viewSession.capacity}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Start Time</Label>
                  <p className="text-sm">{formatDateTime(viewSession.startTime)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">End Time</Label>
                  <p className="text-sm">{viewSession.endTime ? formatDateTime(viewSession.endTime) : '-'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Participants</Label>
                  <p className="text-sm">{viewSession.participantCount}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Available Spots</Label>
                  <p className="text-sm">{viewSession.spotsAvailable}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <p>{formatDateTime(viewSession.createdAt)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Updated</Label>
                  <p>{formatDateTime(viewSession.updatedAt)}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= pagination.pages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Live Session</DialogTitle>
            <DialogDescription>
              Update the live session information
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Session title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Session description"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-instructor">Instructor</Label>
              <Input
                id="edit-instructor"
                value={formData.instructor}
                onChange={(e) => setFormData(prev => ({ ...prev, instructor: e.target.value }))}
                placeholder="Instructor name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-startTime">Start Time *</Label>
                <Input
                  id="edit-startTime"
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-endTime">End Time</Label>
                <Input
                  id="edit-endTime"
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-capacity">Capacity</Label>
              <Input
                id="edit-capacity"
                type="number"
                min="1"
                value={formData.capacity}
                onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                placeholder="Maximum participants"
              />
              {editingSession && parseInt(formData.capacity) < editingSession.participantCount && (
                <p className="text-sm text-red-600">
                  Warning: Cannot reduce capacity below current participant count ({editingSession.participantCount})
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={updateSession} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Session'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Capacity Adjustment Dialog */}
      <Dialog open={isCapacityDialogOpen} onOpenChange={setIsCapacityDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Session Capacity</DialogTitle>
            <DialogDescription>
              Change the maximum number of participants for this session
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-capacity">New Capacity</Label>
              <Input
                id="new-capacity"
                type="number"
                min={editingSession?.participantCount || 1}
                value={formData.capacity}
                onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
              />
              {editingSession && (
                <p className="text-sm text-gray-600">
                  Current participants: {editingSession.participantCount}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCapacityDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => editingSession && adjustCapacity(editingSession._id, parseInt(formData.capacity))}
              disabled={submitting}
            >
              Update Capacity
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLiveSession;