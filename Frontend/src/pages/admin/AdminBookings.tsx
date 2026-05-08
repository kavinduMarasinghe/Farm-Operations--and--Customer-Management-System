import React, { useState, useEffect } from 'react';
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
  BookOpen, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Users,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  User
} from 'lucide-react';
import { studentBookingsAPI } from '@/api/studentAPI';

interface Booking {
  _id: string;
  tour: {
    _id: string;
    title: string;
    description?: string;
    location?: string;
    startDate: string;
    endDate?: string;
    capacity: number;
    bookingCount: number;
  };
  student: {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  date: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

const AdminBookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0
  });
  
  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  
  // UI state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [updatingBooking, setUpdatingBooking] = useState<string | null>(null);

  // Fetch bookings
  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await studentBookingsAPI.getAll();
      const data = response.data;

      if (data.success) {
        // Filter by search term and other filters on frontend if provided
        let filteredBookings = data.bookings;
        
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          filteredBookings = data.bookings.filter((booking: Booking) =>
            booking.tour.title.toLowerCase().includes(searchLower) ||
            booking.student.first_name.toLowerCase().includes(searchLower) ||
            booking.student.last_name.toLowerCase().includes(searchLower) ||
            booking.student.email.toLowerCase().includes(searchLower) ||
            (booking.tour.location && booking.tour.location.toLowerCase().includes(searchLower))
          );
        }

        if (statusFilter && statusFilter !== 'ALL') {
          filteredBookings = filteredBookings.filter((booking: Booking) => booking.status === statusFilter);
        }
        
        setBookings(filteredBookings);
        setPagination(data.pagination || { total: filteredBookings.length, page: 1, limit: 10, pages: 1 });
      } else {
        setError(data.message || 'Failed to fetch bookings');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Network error occurred while fetching bookings');
      console.error('Booking fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Update booking status
  const updateBookingStatus = async (bookingId: string, newStatus: 'PENDING' | 'CONFIRMED' | 'CANCELLED') => {
    try {
      setUpdatingBooking(bookingId);
      setError('');

      const response = await studentBookingsAPI.updateStatus(bookingId, newStatus);

      if (response.data && response.data.success) {
        setSuccess(`Booking status updated to ${newStatus.toLowerCase()}`);
        fetchBookings(); // Refresh the list
      } else {
        setError(response.data?.message || 'Failed to update booking status');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Network error occurred while updating booking status');
      console.error('Booking status update error:', err);
    } finally {
      setUpdatingBooking(null);
    }
  };

  // Delete booking
  const deleteBooking = async (bookingId: string) => {
    try {
      setError('');

      const response = await studentBookingsAPI.delete(bookingId);

      if (response.data && response.data.success) {
        setSuccess('Booking deleted successfully!');
        fetchBookings();
      } else {
        setError(response.data?.message || 'Failed to delete booking');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Network error occurred while deleting booking');
      console.error('Booking deletion error:', err);
    }
  };

  // Helper functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return <CheckCircle className="h-4 w-4" />;
      case 'PENDING': return <AlertCircle className="h-4 w-4" />;
      case 'CANCELLED': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  // Effects
  useEffect(() => {
    fetchBookings();
  }, [pagination.page, statusFilter, startDateFilter, endDateFilter]);

  useEffect(() => {
    if (searchTerm === '') {
      fetchBookings();
    }
  }, [searchTerm]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setStartDateFilter('');
    setEndDateFilter('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchBookings();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lab Tour Bookings</h1>
          <p className="text-gray-600 mt-2">Manage student bookings for laboratory tours</p>
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

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Search & Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search bookings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Start date from"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              type="date"
            />
            <Input
              placeholder="End date to"
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
              type="date"
            />
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleSearch}>
                Search
              </Button>
              <Button variant="outline" onClick={clearFilters}>
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total}</div>
            <p className="text-xs text-muted-foreground">All bookings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bookings.filter(b => b.status === 'CONFIRMED').length}
            </div>
            <p className="text-xs text-muted-foreground">Confirmed bookings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bookings.filter(b => b.status === 'PENDING').length}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bookings.filter(b => b.status === 'CANCELLED').length}
            </div>
            <p className="text-xs text-muted-foreground">Cancelled bookings</p>
          </CardContent>
        </Card>
      </div>

      {/* Bookings List */}
      <Card>
        <CardHeader>
          <CardTitle>Bookings</CardTitle>
          <CardDescription>
            Showing {bookings.length} of {pagination.total} bookings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading bookings...</span>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No bookings found</h3>
              <p className="text-gray-600">No bookings match your current filters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div key={booking._id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-medium text-lg">{booking.tour.title}</h3>
                        <Badge className={getStatusBadgeColor(booking.status)}>
                          {getStatusIcon(booking.status)}
                          <span className="ml-1">{booking.status}</span>
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-gray-600">
                            <User className="h-4 w-4 mr-2" />
                            <span className="font-medium">Student:</span>
                            <span className="ml-1">{booking.student.first_name} {booking.student.last_name}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="ml-6">{booking.student.email}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          {booking.tour.location && (
                            <div className="flex items-center text-sm text-gray-600">
                              <MapPin className="h-4 w-4 mr-2" />
                              <span>{booking.tour.location}</span>
                            </div>
                          )}
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span>{formatDate(booking.tour.startDate)}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Users className="h-4 w-4 mr-2" />
                            <span>{booking.tour.bookingCount || 0} / {booking.tour.capacity} confirmed</span>
                          </div>
                        </div>
                      </div>

                      {booking.tour.description && (
                        <p className="text-gray-600 text-sm mb-2">{booking.tour.description}</p>
                      )}

                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Booking Date: {formatDate(booking.date)}</span>
                        <span>Created: {formatDate(booking.createdAt)}</span>
                      </div>

                      {booking.notes && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                          <strong>Notes:</strong> {booking.notes}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {booking.status === 'PENDING' && (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateBookingStatus(booking._id, 'CONFIRMED')}
                            disabled={updatingBooking === booking._id}
                            className="text-green-600 hover:text-green-700"
                          >
                            {updatingBooking === booking._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateBookingStatus(booking._id, 'CANCELLED')}
                            disabled={updatingBooking === booking._id}
                            className="text-red-600 hover:text-red-700"
                          >
                            {updatingBooking === booking._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                          </Button>
                        </>
                      )}
                      
                      {booking.status === 'CONFIRMED' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateBookingStatus(booking._id, 'CANCELLED')}
                          disabled={updatingBooking === booking._id}
                          className="text-red-600 hover:text-red-700"
                        >
                          {updatingBooking === booking._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                        </Button>
                      )}

                      {booking.status === 'CANCELLED' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateBookingStatus(booking._id, 'CONFIRMED')}
                          disabled={updatingBooking === booking._id}
                          className="text-green-600 hover:text-green-700"
                        >
                          {updatingBooking === booking._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                        </Button>
                      )}

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Booking Details</DialogTitle>
                            <DialogDescription>
                              Complete information for this booking
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm font-medium">Tour</Label>
                                <p className="text-sm">{booking.tour.title}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Status</Label>
                                <Badge className={getStatusBadgeColor(booking.status)}>
                                  {booking.status}
                                </Badge>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm font-medium">Student</Label>
                                <p className="text-sm">{booking.student.first_name} {booking.student.last_name}</p>
                                <p className="text-sm text-gray-600">{booking.student.email}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Tour Date</Label>
                                <p className="text-sm">{formatDate(booking.tour.startDate)}</p>
                              </div>
                            </div>
                            {booking.tour.location && (
                              <div>
                                <Label className="text-sm font-medium">Location</Label>
                                <p className="text-sm">{booking.tour.location}</p>
                              </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm font-medium">Tour Capacity</Label>
                                <p className="text-sm">{booking.tour.capacity} people</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Confirmed Bookings</Label>
                                <p className="text-sm">{booking.tour.bookingCount || 0} confirmed</p>
                              </div>
                            </div>
                            {booking.tour.description && (
                              <div>
                                <Label className="text-sm font-medium">Tour Description</Label>
                                <p className="text-sm">{booking.tour.description}</p>
                              </div>
                            )}
                            {booking.notes && (
                              <div>
                                <Label className="text-sm font-medium">Notes</Label>
                                <p className="text-sm">{booking.notes}</p>
                              </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm font-medium">Booking Created</Label>
                                <p className="text-sm">{formatDate(booking.createdAt)}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Last Updated</Label>
                                <p className="text-sm">{formatDate(booking.updatedAt)}</p>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Booking</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this booking for "{booking.tour.title}" by {booking.student.first_name} {booking.student.last_name}? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deleteBooking(booking._id)}
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
    </div>
  );
};

export default AdminBookings;