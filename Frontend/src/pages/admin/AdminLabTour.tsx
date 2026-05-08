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
  MapPin, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Users,
  Calendar,
  Clock,
  Archive,
  ArchiveRestore,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Building
} from 'lucide-react';

interface LabTour {
  _id: string;
  title: string;
  description?: string;
  location?: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  archived: boolean;
  bookingsCount: number;
  pendingCount: number;
  confirmedCount: number;
  availableSpots: number;
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

const AdminLabTour: React.FC = () => {
  const { token } = useAuth();
  const [tours, setTours] = useState<LabTour[]>([]);
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
  const [editingTour, setEditingTour] = useState<LabTour | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    date: '',
    startTime: '',
    endTime: '',
    capacity: '20'
  });

  // View dialog state
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewTour, setViewTour] = useState<LabTour | null>(null);
  
  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [showArchived, setShowArchived] = useState('false');
  const [startDateMin, setStartDateMin] = useState('');
  const [startDateMax, setStartDateMax] = useState('');
  
  // UI state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({
    title: '',
    description: '',
    location: '',
    date: '',
    startTime: '',
    endTime: '',
    capacity: ''
  });

  // Validation functions
  const validateField = (name: string, value: string) => {
    let error = '';
    
    switch (name) {
      case 'title':
        if (!value.trim()) {
          error = 'Title is required';
        } else if (value.trim().length < 3) {
          error = 'Title must be at least 3 characters';
        } else if (value.trim().length > 100) {
          error = 'Title must be less than 100 characters';
        }
        break;
        
      case 'description':
        if (value.trim() && value.trim().length > 500) {
          error = 'Description must be less than 500 characters';
        }
        break;
        
      case 'location':
        if (!value.trim()) {
          error = 'Location is required';
        } else if (value.trim().length < 3) {
          error = 'Location must be at least 3 characters';
        }
        break;
        
      case 'date':
        if (!value) {
          error = 'Date is required';
        } else {
          const selectedDate = new Date(value);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          if (selectedDate < today) {
            error = 'Date cannot be in the past';
          }
        }
        break;
        
      case 'startTime':
        if (!value) {
          error = 'Start time is required';
        }
        break;
        
      case 'endTime':
        if (!value) {
          error = 'End time is required';
        } else if (formData.startTime) {
          const [startHour, startMinute] = formData.startTime.split(':').map(Number);
          const [endHour, endMinute] = value.split(':').map(Number);
          const startMinutes = startHour * 60 + startMinute;
          const endMinutes = endHour * 60 + endMinute;
          
          if (endMinutes <= startMinutes) {
            error = 'End time must be after start time';
          }
        }
        break;
        
      case 'capacity':
        const capacityNum = parseInt(value);
        if (!value.trim()) {
          error = 'Capacity is required';
        } else if (isNaN(capacityNum) || capacityNum < 1) {
          error = 'Capacity must be at least 1';
        } else if (capacityNum > 1000) {
          error = 'Capacity cannot exceed 1000';
        }
        break;
        
      default:
        break;
    }
    
    return error;
  };

  const validateForm = () => {
    const errors = {
      title: validateField('title', formData.title),
      description: validateField('description', formData.description),
      location: validateField('location', formData.location),
      date: validateField('date', formData.date),
      startTime: validateField('startTime', formData.startTime),
      endTime: validateField('endTime', formData.endTime),
      capacity: validateField('capacity', formData.capacity)
    };
    
    setFormErrors(errors);
    return !Object.values(errors).some(error => error !== '');
  };

  // Handle form input changes with validation
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Validate field on change
    const error = validateField(name, value);
    setFormErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  // Fetch lab tours
  const fetchLabTours = async (pageOverride?: number) => {
    try {
      setLoading(true);
      setError('');
      
      if (!token) {
        setError('No authentication token found');
        return;
      }

      // Build query parameters - use override if provided, otherwise use state
      const currentPage = pageOverride !== undefined ? pageOverride : (pagination?.page || 1);
      const currentLimit = pagination?.limit || 10;
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: currentLimit.toString(),
        showArchived: showArchived
      });

      if (searchTerm) params.append('search', searchTerm);
      if (startDateMin) params.append('startDateMin', startDateMin);
      if (startDateMax) params.append('startDateMax', startDateMax);

      const response = await fetch(`http://localhost:8070/api/admin/student/labtour?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setTours(data.tours || []);
        setPagination(data.pagination || {
          total: 0,
          page: currentPage,
          limit: currentLimit,
          pages: 0
        });
      } else {
        setError(data.message || 'Failed to fetch lab tours');
      }
    } catch (err) {
      setError('Network error occurred while fetching lab tours');
      console.error('Lab tour fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create lab tour
  const createLabTour = async () => {
    if (!validateForm()) {
      setError('Please fix the validation errors before submitting');
      return;
    }

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

      const response = await fetch('http://localhost:8070/api/admin/student/labtour', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('Lab tour created successfully!');
        setIsCreateDialogOpen(false);
        resetForm();
        fetchLabTours();
        setFormErrors({
          title: '',
          description: '',
          location: '',
          date: '',
          startTime: '',
          endTime: '',
          capacity: ''
        });
      } else {
        setError(data.message || 'Failed to create lab tour');
      }
    } catch (err) {
      setError('Network error occurred while creating lab tour');
      console.error('Lab tour creation error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Update lab tour
  const updateLabTour = async () => {
    if (!editingTour) return;

    if (!validateForm()) {
      setError('Please fix the validation errors before submitting');
      return;
    }

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

      const response = await fetch(`http://localhost:8070/api/admin/student/labtour/${editingTour._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('Lab tour updated successfully!');
        setIsEditDialogOpen(false);
        setEditingTour(null);
        resetForm();
        fetchLabTours();
        setFormErrors({
          title: '',
          description: '',
          location: '',
          date: '',
          startTime: '',
          endTime: '',
          capacity: ''
        });
      } else {
        setError(data.message || 'Failed to update lab tour');
      }
    } catch (err) {
      setError('Network error occurred while updating lab tour');
      console.error('Lab tour update error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle archive status
  const toggleArchiveStatus = async (tourId: string, isArchived: boolean) => {
    try {
      setError('');

      if (!token) {
        setError('No authentication token found');
        return;
      }

      const response = await fetch(`http://localhost:8070/api/admin/student/labtour/${tourId}/archive`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(`Lab tour ${isArchived ? 'unarchived' : 'archived'} successfully!`);
        fetchLabTours();
      } else {
        setError(data.message || 'Failed to update archive status');
      }
    } catch (err) {
      setError('Network error occurred while updating archive status');
      console.error('Archive status update error:', err);
    }
  };

  // Delete lab tour
  const deleteLabTour = async (tourId: string) => {
    try {
      setError('');

      if (!token) {
        setError('No authentication token found');
        return;
      }

      const response = await fetch(`http://localhost:8070/api/admin/student/labtour/${tourId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('Lab tour deleted successfully!');
        fetchLabTours();
      } else {
        setError(data.message || 'Failed to delete lab tour');
      }
    } catch (err) {
      setError('Network error occurred while deleting lab tour');
      console.error('Lab tour deletion error:', err);
    }
  };

  // Helper functions
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      location: '',
      date: '',
      startTime: '',
      endTime: '',
      capacity: '20'
    });
    setFormErrors({
      title: '',
      description: '',
      location: '',
      date: '',
      startTime: '',
      endTime: '',
      capacity: ''
    });
  };

  const openEditDialog = (tour: LabTour) => {
    setEditingTour(tour);
    setFormData({
      title: tour.title,
      description: tour.description || '',
      location: tour.location || '',
      date: tour.date ? new Date(tour.date).toISOString().slice(0, 10) : '',
      startTime: tour.startTime || '',
      endTime: tour.endTime || '',
      capacity: tour.capacity.toString()
    });
    setIsEditDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadgeColor = (tour: LabTour) => {
    if (tour.archived) return 'bg-gray-100 text-gray-800';
    if (tour.isFull) return 'bg-red-100 text-red-800';
    if (new Date(tour.date) < new Date()) return 'bg-orange-100 text-orange-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (tour: LabTour) => {
    if (tour.archived) return 'Archived';
    if (tour.isFull) return 'Full';
    if (new Date(tour.date) < new Date()) return 'Past';
    return 'Available';
  };

  // Effects
  useEffect(() => {
    if (token) {
      fetchLabTours();
    }
  }, [token, searchTerm, showArchived, startDateMin, startDateMax]);

  // Separate effect for pagination changes
  useEffect(() => {
    if (token && pagination.page > 1) {
      fetchLabTours(pagination.page);
    }
  }, [pagination.page]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const clearFilters = () => {
    setSearchTerm('');
    setShowArchived('false');
    setStartDateMin('');
    setStartDateMax('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lab Tours</h1>
          <p className="text-gray-600 mt-2">Manage laboratory tours and schedules</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Lab Tour
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Lab Tour</DialogTitle>
              <DialogDescription>
                Add a new laboratory tour to the system
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Lab tour title"
                  className={formErrors.title ? "border-red-500 focus:border-red-500" : ""}
                  required
                />
                {formErrors.title && (
                  <p className="text-sm text-red-600">{formErrors.title}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Lab tour description"
                  rows={3}
                  className={formErrors.description ? "border-red-500 focus:border-red-500" : ""}
                />
                {formErrors.description && (
                  <p className="text-sm text-red-600">{formErrors.description}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="Lab location"
                    className={formErrors.location ? "border-red-500 focus:border-red-500" : ""}
                    required
                  />
                  {formErrors.location && (
                    <p className="text-sm text-red-600">{formErrors.location}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity *</Label>
                  <Input
                    id="capacity"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    placeholder="Maximum participants"
                    type="number"
                    min="1"
                    className={formErrors.capacity ? "border-red-500 focus:border-red-500" : ""}
                    required
                  />
                  {formErrors.capacity && (
                    <p className="text-sm text-red-600">{formErrors.capacity}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    type="date"
                    className={formErrors.date ? "border-red-500 focus:border-red-500" : ""}
                    required
                  />
                  {formErrors.date && (
                    <p className="text-sm text-red-600">{formErrors.date}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time *</Label>
                    <Input
                      id="startTime"
                      name="startTime"
                      value={formData.startTime}
                      onChange={handleInputChange}
                      type="time"
                      className={formErrors.startTime ? "border-red-500 focus:border-red-500" : ""}
                      required
                    />
                    {formErrors.startTime && (
                      <p className="text-sm text-red-600">{formErrors.startTime}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time *</Label>
                    <Input
                      id="endTime"
                      name="endTime"
                      value={formData.endTime}
                      onChange={handleInputChange}
                      type="time"
                      className={formErrors.endTime ? "border-red-500 focus:border-red-500" : ""}
                      required
                    />
                    {formErrors.endTime && (
                      <p className="text-sm text-red-600">{formErrors.endTime}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createLabTour} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Lab Tour'
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

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Search & Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search tours..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={showArchived} onValueChange={setShowArchived}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="false">Active Tours</SelectItem>
                <SelectItem value="true">Archived Tours</SelectItem>
                <SelectItem value="all">All Tours</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Start date from"
              value={startDateMin}
              onChange={(e) => setStartDateMin(e.target.value)}
              type="date"
            />
            <Input
              placeholder="Start date to"
              value={startDateMax}
              onChange={(e) => setStartDateMax(e.target.value)}
              type="date"
            />
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tours</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total}</div>
            <p className="text-xs text-muted-foreground">Lab tours</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tours</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tours.filter(t => !t.archived).length}
            </div>
            <p className="text-xs text-muted-foreground">Currently available</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tours.reduce((sum, tour) => sum + tour.bookingsCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">All bookings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Archived Tours</CardTitle>
            <Archive className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tours.filter(t => t.archived).length}
            </div>
            <p className="text-xs text-muted-foreground">Archived tours</p>
          </CardContent>
        </Card>
      </div>

      {/* Tours List */}
      <Card>
        <CardHeader>
          <CardTitle>Lab Tours</CardTitle>
          <CardDescription>
            Showing {tours.length} of {pagination.total} tours
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading lab tours...</span>
            </div>
          ) : tours.length === 0 ? (
            <div className="text-center py-8">
              <Building className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No lab tours found</h3>
              <p className="text-gray-600">Try adjusting your filters or create a new lab tour.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tours.map((tour) => (
                <div key={tour._id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-medium text-lg">{tour.title}</h3>
                        <Badge className={getStatusBadgeColor(tour)}>
                          {getStatusText(tour)}
                        </Badge>
                        {tour.isFull && (
                          <Badge className="bg-red-100 text-red-800">
                            <Users className="h-3 w-3 mr-1" />
                            Full
                          </Badge>
                        )}
                      </div>
                      
                      {tour.description && (
                        <p className="text-gray-600 mb-2">{tour.description}</p>
                      )}
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500 mb-2">
                        {tour.location && (
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {tour.location}
                          </div>
                        )}
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(tour.date)} {tour.startTime} - {tour.endTime}
                        </div>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {tour.bookingsCount}/{tour.capacity} total bookings
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {tour.availableSpots} spots available
                        </div>
                      </div>

                      <div className="flex items-center space-x-6 text-sm bg-gray-50 p-2 rounded mt-2">
                        <span className="text-green-600 font-medium">
                          ✓ Confirmed: {tour.confirmedCount}
                        </span>
                        <span className="text-yellow-600 font-medium">
                          ⏳ Pending: {tour.pendingCount}
                        </span>
                        <span className="text-blue-600 font-medium">
                          📋 Total: {tour.bookingsCount}
                        </span>
                        <span className="text-gray-600 font-medium">
                          🎯 Capacity: {tour.capacity}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button size="sm" variant="outline" onClick={() => { setViewTour(tour); setIsViewDialogOpen(true); }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openEditDialog(tour)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => toggleArchiveStatus(tour._id, tour.archived)}
                        className={tour.archived ? "text-green-600 hover:text-green-700" : "text-gray-600 hover:text-gray-700"}
                      >
                        {tour.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Lab Tour</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{tour.title}"? This action cannot be undone.
                              {tour.bookingsCount > 0 && (
                                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                                  <strong>Warning:</strong> This tour has {tour.bookingsCount} booking(s). 
                                  Consider archiving instead of deleting.
                                </div>
                              )}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deleteLabTour(tour._id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
      {/* View Lab Tour Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Lab Tour Details</DialogTitle>
            <DialogDescription>Full details of the lab tour</DialogDescription>
          </DialogHeader>
          {viewTour && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Title</Label>
                  <p className="text-sm">{viewTour.title}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge className={getStatusBadgeColor(viewTour)}>{getStatusText(viewTour)}</Badge>
                </div>
              </div>
              {viewTour.description && (
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <div className="bg-gray-50 p-3 rounded text-sm">{viewTour.description}</div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Location</Label>
                  <p className="text-sm">{viewTour.location || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Capacity</Label>
                  <p className="text-sm">{viewTour.capacity}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Date</Label>
                  <p className="text-sm">{formatDate(viewTour.date)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Start Time</Label>
                  <p className="text-sm">{viewTour.startTime}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">End Time</Label>
                  <p className="text-sm">{viewTour.endTime}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Bookings</Label>
                  <p className="text-sm">{viewTour.bookingsCount}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Available Spots</Label>
                  <p className="text-sm">{viewTour.availableSpots}</p>
                </div>
              </div>
              <div className="flex items-center space-x-6 text-sm bg-gray-50 p-2 rounded mt-2">
                <span className="text-green-600 font-medium">
                  ✓ Confirmed: {viewTour.confirmedCount}
                </span>
                <span className="text-yellow-600 font-medium">
                  ⏳ Pending: {viewTour.pendingCount}
                </span>
                <span className="text-blue-600 font-medium">
                  📋 Total: {viewTour.bookingsCount}
                </span>
                <span className="text-gray-600 font-medium">
                  🎯 Capacity: {viewTour.capacity}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <p>{formatDate(viewTour.createdAt)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Updated</Label>
                  <p>{formatDate(viewTour.updatedAt)}</p>
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
            <DialogTitle>Edit Lab Tour</DialogTitle>
            <DialogDescription>
              Update the lab tour information
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Lab tour title"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Lab tour description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Lab location"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-capacity">Capacity</Label>
                <Input
                  id="edit-capacity"
                  value={formData.capacity}
                  onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                  placeholder="Maximum participants"
                  type="number"
                  min="1"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-date">Date</Label>
                <Input
                  id="edit-date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  type="date"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-startTime">Start Time</Label>
                  <Input
                    id="edit-startTime"
                    value={formData.startTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    type="time"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-endTime">End Time</Label>
                  <Input
                    id="edit-endTime"
                    value={formData.endTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    type="time"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={updateLabTour} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Lab Tour'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLabTour;