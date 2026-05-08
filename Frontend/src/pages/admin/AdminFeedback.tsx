import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MessageSquare, 
  Star, 
  User, 
  Clock,
  Search,
  Filter,
  Download,
  Eye,
  EyeOff,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  BarChart3,
  TrendingUp,
  ThumbsUp
} from 'lucide-react';

interface Student {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  course?: string;
}

interface Feedback {
  _id: string;
  student: Student;
  target?: string;
  type: 'GENERAL' | 'LABTOUR' | 'SESSION' | 'MATERIAL';
  rating?: number;
  comment?: string;
  hidden: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FeedbackStats {
  total: number;
  hidden: number;
  visible: number;
  typeStats: Array<{
    type: string;
    count: number;
    avgRating: number;
  }>;
  ratingDistribution: Array<{
    rating: number;
    count: number;
  }>;
  trends: {
    recent: {
      count: number;
      avgRating: number;
    };
    previousPeriod: {
      count: number;
    };
    percentChange: number | null;
  };
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalPages: number;
}

const AdminFeedback: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    totalPages: 0
  });
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedHidden, setSelectedHidden] = useState('ALL');
  const [minRating, setMinRating] = useState('');
  const [maxRating, setMaxRating] = useState('');
  
  // UI state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Auth
  const { token } = useAuth();
  const authToken = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') : null);

  // Fetch feedback stats
  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      setError('');

      if (!authToken) {
        setError('No authentication token found');
        return;
      }

      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8070';
      const response = await fetch(`${API_BASE}/api/admin/student/feedback/stats`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStats(data.data);
      } else {
        setError(data.message || 'Failed to fetch feedback stats');
      }
    } catch (err) {
      setError('Network error occurred while fetching stats');
      console.error('Stats fetch error:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch feedback list
  const fetchFeedback = async () => {
    try {
      setLoading(true);
      setError('');

      if (!authToken) {
        setError('No authentication token found');
        return;
      }

      // Build query parameters
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      if (searchTerm) params.append('search', searchTerm);
      if (selectedType !== 'ALL') params.append('type', selectedType);
      if (selectedHidden !== 'ALL') params.append('hidden', selectedHidden);
      if (minRating) params.append('minRating', minRating);
      if (maxRating) params.append('maxRating', maxRating);

      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8070';
      const response = await fetch(`${API_BASE}/api/admin/student/feedback?${params}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Normalize possible backend shapes
        let feedbackList: Feedback[] = [];
        // Common shapes: { success, data: Array } or { success, data: { feedbacks: Array, pagination } }
        if (Array.isArray(data.data)) {
          feedbackList = data.data;
        } else if (Array.isArray(data.feedbacks)) {
          feedbackList = data.feedbacks;
        } else if (data.data && Array.isArray(data.data.feedbacks)) {
          feedbackList = data.data.feedbacks;
        } else if (data.data && Array.isArray(data.data.items)) {
          feedbackList = data.data.items;
        } else {
          // Fallback: try to coerce single item
          feedbackList = [];
        }

        // Normalize pagination
        const pagSource = data.pagination || data.data?.pagination || data.pagination || {};
        const nextPagination: PaginationInfo = {
          page: pagSource.page ?? pagination.page,
          limit: pagSource.limit ?? pagination.limit,
          totalPages: pagSource.totalPages ?? pagination.totalPages
        };

        setFeedbacks(feedbackList);
        setPagination(nextPagination);
      } else {
        setError(data.message || 'Failed to fetch feedback');
      }
    } catch (err) {
      setError('Network error occurred while fetching feedback');
      console.error('Feedback fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle feedback visibility
  const toggleVisibility = async (feedbackId: string) => {
    try {
      setError('');

      if (!authToken) {
        setError('No authentication token found');
        return;
      }

      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8070';
      const response = await fetch(`${API_BASE}/api/admin/student/feedback/${feedbackId}/hide`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(data.message);
        fetchFeedback();
        fetchStats();
      } else {
        setError(data.message || 'Failed to update feedback visibility');
      }
    } catch (err) {
      setError('Network error occurred while updating feedback');
      console.error('Visibility toggle error:', err);
    }
  };

  // Delete feedback
  const deleteFeedback = async (feedbackId: string) => {
    try {
      setError('');
      if (!authToken) {
        setError('No authentication token found');
        return;
      }

      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8070';
      const response = await fetch(`${API_BASE}/api/admin/student/feedback/${feedbackId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(data.message);
        fetchFeedback();
        fetchStats();
      } else {
        setError(data.message || 'Failed to delete feedback');
      }
    } catch (err) {
      setError('Network error occurred while deleting feedback');
      console.error('Delete feedback error:', err);
    }
  };

  // Helper functions
  const renderStars = (rating?: number) => {
    if (!rating) return <span className="text-gray-400">No rating</span>;
    
    return (
      <div className="flex items-center space-x-1">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating}/5)</span>
      </div>
    );
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'GENERAL': return 'bg-blue-100 text-blue-800';
      case 'LABTOUR': return 'bg-green-100 text-green-800';
      case 'SESSION': return 'bg-purple-100 text-purple-800';
      case 'MATERIAL': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedType('ALL');
    setSelectedHidden('ALL');
    setMinRating('');
    setMaxRating('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const viewFeedback = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setIsViewDialogOpen(true);
  };

  // Effects
  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchFeedback();
  }, [pagination.page, searchTerm, selectedType, selectedHidden, minRating, maxRating]);

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
          <h1 className="text-3xl font-bold text-gray-900">Feedback Management</h1>
          <p className="text-gray-600 mt-2">Monitor and manage student feedback and reviews</p>
        </div>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="text-2xl font-bold">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.total ?? 0}</div>
                <p className="text-xs text-muted-foreground">
                  {typeof stats?.trends?.percentChange === 'number'
                    ? `${stats.trends.percentChange > 0 ? '+' : ''}${stats.trends.percentChange.toFixed(1)}% from last month`
                    : 'No comparison data'
                  }
                </p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="text-2xl font-bold">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.trends?.recent?.avgRating ?? 0}</div>
                <p className="text-xs text-muted-foreground">Out of 5 stars</p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hidden</CardTitle>
            <EyeOff className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="text-2xl font-bold">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.hidden || 0}</div>
                <p className="text-xs text-muted-foreground">Hidden from public view</p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="text-2xl font-bold">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.trends?.recent?.count ?? 0}</div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Search & Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search feedback..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="GENERAL">General</SelectItem>
                <SelectItem value="LABTOUR">Lab Tour</SelectItem>
                <SelectItem value="SESSION">Live Session</SelectItem>
                <SelectItem value="MATERIAL">Material</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedHidden} onValueChange={setSelectedHidden}>
              <SelectTrigger>
                <SelectValue placeholder="Visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Feedback</SelectItem>
                <SelectItem value="false">Visible</SelectItem>
                <SelectItem value="true">Hidden</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Min rating"
              value={minRating}
              onChange={(e) => setMinRating(e.target.value)}
              type="number"
              min="1"
              max="5"
            />
            <Input
              placeholder="Max rating"
              value={maxRating}
              onChange={(e) => setMaxRating(e.target.value)}
              type="number"
              min="1"
              max="5"
            />
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Feedback List */}
      <Card>
        <CardHeader>
          <CardTitle>Feedback List</CardTitle>
          <CardDescription>
            {loading ? 'Loading...' : `Showing ${feedbacks.length} feedback entries`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading feedback...</span>
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No feedback found</h3>
              <p className="text-gray-600">Try adjusting your filters or check back later.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {feedbacks.map((feedback) => (
                <div key={feedback._id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{feedback.student.first_name} {feedback.student.last_name}</span>
                          <span className="text-sm text-gray-500">({feedback.student.email})</span>
                        </div>
                        <Badge className={getTypeBadgeColor(feedback.type)}>
                          {feedback.type}
                        </Badge>
                        <Badge className={feedback.hidden ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                          {feedback.hidden ? 'Hidden' : 'Visible'}
                        </Badge>
                      </div>
                      
                      {feedback.target && (
                        <p className="text-sm text-gray-600 mb-2">Target: {feedback.target}</p>
                      )}
                      
                      <div className="flex items-center space-x-4 mb-2">
                        {renderStars(feedback.rating)}
                        <span className="text-sm text-gray-500">{formatDate(feedback.createdAt)}</span>
                      </div>
                      
                      {feedback.comment && (
                        <p className="text-gray-700 bg-gray-50 p-2 rounded text-sm">
                          {feedback.comment.length > 150 
                            ? `${feedback.comment.substring(0, 150)}...` 
                            : feedback.comment
                          }
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button size="sm" variant="outline" onClick={() => viewFeedback(feedback)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => toggleVisibility(feedback._id)}
                        className={feedback.hidden ? "text-green-600 hover:text-green-700" : "text-orange-600 hover:text-orange-700"}
                      >
                        {feedback.hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Feedback</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this feedback from {feedback.student.first_name} {feedback.student.last_name}? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deleteFeedback(feedback._id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages}
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
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Feedback Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Feedback Details</DialogTitle>
            <DialogDescription>
              Complete feedback information
            </DialogDescription>
          </DialogHeader>
          {selectedFeedback && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Student</Label>
                  <p className="text-sm">{selectedFeedback.student.first_name} {selectedFeedback.student.last_name}</p>
                  <p className="text-xs text-gray-500">{selectedFeedback.student.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <Badge className={getTypeBadgeColor(selectedFeedback.type)}>
                    {selectedFeedback.type}
                  </Badge>
                </div>
              </div>
              
              {selectedFeedback.target && (
                <div>
                  <Label className="text-sm font-medium">Target</Label>
                  <p className="text-sm">{selectedFeedback.target}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Rating</Label>
                  {renderStars(selectedFeedback.rating)}
                </div>
                <div>
                  <Label className="text-sm font-medium">Visibility</Label>
                  <Badge className={selectedFeedback.hidden ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                    {selectedFeedback.hidden ? 'Hidden' : 'Visible'}
                  </Badge>
                </div>
              </div>
              
              {selectedFeedback.comment && (
                <div>
                  <Label className="text-sm font-medium">Comment</Label>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    {selectedFeedback.comment}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <p>{formatDate(selectedFeedback.createdAt)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Updated</Label>
                  <p>{formatDate(selectedFeedback.updatedAt)}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            {selectedFeedback && (
              <Button 
                onClick={() => toggleVisibility(selectedFeedback._id)}
                className={selectedFeedback.hidden ? "bg-green-600 hover:bg-green-700" : "bg-orange-600 hover:bg-orange-700"}
              >
                {selectedFeedback.hidden ? 'Make Visible' : 'Hide Feedback'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminFeedback;