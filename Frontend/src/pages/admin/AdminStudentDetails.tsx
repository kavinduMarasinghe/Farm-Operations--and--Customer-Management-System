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
import { useAuth } from '@/contexts/AuthContext';
import { 
  Users, 
  Search, 
  Edit,
  UserCheck,
  UserX,
  UserMinus,
  Mail,
  Phone,
  Calendar,
  Activity,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Filter,
  Download,
  RefreshCw,
  TrendingUp
} from 'lucide-react';

interface Student {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  contact: string;
  role: string;
  isAccountVerified: boolean;
  isActive: boolean;
  profileImage?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  fullName: string;
  liveSessions: string[];
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

const AdminStudentDetails: React.FC = () => {
  const { token } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0
  });
  
  // View dialog state
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewStudent, setViewStudent] = useState<Student | null>(null);
  
  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // UI state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge color
  const getStatusBadgeColor = (student: Student) => {
    if (!student.isActive) return 'bg-red-100 text-red-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (student: Student) => {
    if (!student.isActive) return 'Inactive';
    return 'Active';
  };

  const getStatusIcon = (student: Student) => {
    if (!student.isActive) return <UserMinus className="h-3 w-3 mr-1" />;
    return <UserCheck className="h-3 w-3 mr-1" />;
  };

  // Helper function to calculate recent students (last 30 days)
  const getRecentStudentsCount = () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return students.filter(student => {
      if (!student.createdAt) return false;
      const studentDate = new Date(student.createdAt);
      return studentDate >= thirtyDaysAgo;
    }).length;
  };

  // Fetch students
  const fetchStudents = async () => {
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
        limit: pagination.limit.toString(),
      });

      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('isActive', statusFilter);

      // Note: This endpoint already exists in the backend
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8070';
      const response = await fetch(`${API_BASE}/api/admin/student/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStudents(data.data.students);
        setPagination(data.data.pagination);
        } else {
        setError(data.message || 'Failed to fetch students');
      }
    } catch (err) {
      setError('Network error occurred while fetching students');
      console.error('Students fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh data
  const refreshData = () => {
    setRefreshing(true);
    fetchStudents();
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Toggle student active status
  const toggleStudentStatus = async (studentId: string, currentStatus: boolean) => {
    try {
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8070';
      const response = await fetch(`${API_BASE}/api/admin/student/users/${studentId}/activate`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(`Student ${currentStatus ? 'deactivated' : 'activated'} successfully!`);
        fetchStudents();
      } else {
        setError(data.message || 'Failed to update student status');
      }
    } catch (err) {
      setError('Network error occurred while updating student status');
      console.error('Student status update error:', err);
    }
  };

  // Export students to CSV
  const exportStudentsToCSV = async () => {
    try {
      setExporting(true);
      setError('');

      if (!token) {
        setError('No authentication token found');
        return;
      }

      // Build query parameters for export (get all matching records, not just current page)
      const params = new URLSearchParams({
        page: '1',
        limit: '10000', // Large limit to get all records
      });

      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('isActive', statusFilter);

      console.log('Exporting students with params:', params.toString());

      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8070';
      const response = await fetch(`${API_BASE}/api/admin/student/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const studentsData = data.data.students;
        
        if (studentsData.length === 0) {
          setError('No students found to export with current filters');
          return;
        }
        
        // Define CSV headers
        const headers = [
          'ID',
          'First Name',
          'Last Name',
          'Full Name',
          'Email',
          'Contact',
          'Role',
          'Account Verified',
          'Active Status',
          'Join Date',
          'Last Login',
          'Live Sessions Count'
        ];

        // Convert students data to CSV format
        const csvData = studentsData.map((student: Student) => [
          student._id || '',
          student.first_name || '',
          student.last_name || '',
          student.fullName || `${student.first_name || ''} ${student.last_name || ''}`.trim(),
          student.email || '',
          student.contact || '',
          student.role || 'student',
          student.isAccountVerified ? 'Yes' : 'No',
          student.isActive ? 'Active' : 'Inactive',
          student.createdAt ? formatDate(student.createdAt) : '',
          student.lastLogin ? formatDate(student.lastLogin) : 'Never',
          student.liveSessions ? student.liveSessions.length.toString() : '0'
        ]);

        // Combine headers and data
        const csvContent = [headers, ...csvData]
          .map(row => row.map(field => {
            // Escape quotes and handle special characters
            const fieldStr = String(field || '');
            return `"${fieldStr.replace(/"/g, '""')}"`;
          }).join(','))
          .join('\n');

        // Create and download CSV file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
          const url = URL.createObjectURL(blob);
          link.setAttribute('href', url);
          
          // Generate filename with current date and filters
          const currentDate = new Date().toISOString().split('T')[0];
          const filterSuffix = searchTerm || statusFilter !== 'all' 
            ? '_filtered' 
            : '';
          const filename = `students_export_${currentDate}${filterSuffix}.csv`;
          
          link.setAttribute('download', filename);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          setSuccess(`Successfully exported ${studentsData.length} student records to CSV!`);
        }
      } else {
        setError(data.message || 'Failed to fetch students for export');
      }
    } catch (err) {
      setError('Network error occurred while exporting students');
      console.error('Export error:', err);
    } finally {
      setExporting(false);
    }
  };

  // Effects
  useEffect(() => {
    fetchStudents();
  }, [pagination.page, searchTerm, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setError('');
      setSuccess('');
    }, 5000);
    return () => clearTimeout(timer);
  }, [error, success]);

  return (
    <div className="w-full max-w-none space-y-8 p-4 sm:p-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Student Details</h1>
          <p className="text-gray-600">Manage and view student information</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={refreshing}
            className="w-full sm:w-auto"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            onClick={exportStudentsToCSV}
            disabled={exporting}
            title={`Export ${pagination.total} student records to CSV`}
            className="w-full sm:w-auto"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export CSV ({pagination.total})
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Filter className="h-5 w-5 mr-2" />
            Search & Filters
          </CardTitle>
          {(searchTerm || statusFilter !== 'all') && (
            <CardDescription>
              Active filters will be applied to CSV export. Export will include {pagination.total} matching records.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="search">Search Students</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Search by name, email, or contact..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-6 pt-4 border-t">
            <div className="text-sm text-gray-600">
              {pagination.total > 0 && (
                <span>Showing {students.length} of {pagination.total} students</span>
              )}
            </div>
            <Button variant="outline" onClick={clearFilters} className="w-full sm:w-auto">
              <RefreshCw className="h-4 w-4 mr-2" />
              Clear All Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total}</div>
            <p className="text-xs text-muted-foreground">Registered students</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {students.filter(s => s.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">Active students</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Students</CardTitle>
            <UserMinus className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {students.filter(s => !s.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">Deactivated accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Joiners</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getRecentStudentsCount()}
            </div>
            <p className="text-xs text-muted-foreground">Joined in last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Students List */}
      <Card>
        <CardHeader>
          <CardTitle>Students</CardTitle>
          <CardDescription>
            Showing {students.length} of {pagination.total} students
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading students...</span>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No students found</h3>
              <p className="text-gray-600">Try adjusting your filters or search criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">{student.fullName}</span>
                            <span className="text-xs text-gray-500">{student.first_name} {student.last_name}</span>
                          </div>
                          <Badge className={getStatusBadgeColor(student)}>
                            <div className="flex items-center">
                              {getStatusIcon(student)}
                              {getStatusText(student)}
                            </div>
                          </Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{student.email}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{student.contact || '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 capitalize">{student.role || 'student'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-700">{student.isAccountVerified ? 'Verified' : 'Unverified'}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{formatDate(student.createdAt)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <div className="inline-flex items-center gap-2">
                          {/* view button removed as requested */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className={student.isActive ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"}
                                title={student.isActive ? 'Deactivate' : 'Activate'}
                              >
                                {student.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {student.isActive ? 'Deactivate' : 'Activate'} Student
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to {student.isActive ? 'deactivate' : 'activate'} {student.fullName}?
                                  {student.isActive && " This will prevent them from accessing the system."}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => toggleStudentStatus(student._id, student.isActive)}
                                  className={student.isActive ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                                >
                                  {student.isActive ? 'Deactivate' : 'Activate'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-700">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
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
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Student Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
            <DialogDescription>Complete information about the student</DialogDescription>
          </DialogHeader>
          {viewStudent && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                  {viewStudent.profileImage ? (
                    <img 
                      src={viewStudent.profileImage} 
                      alt={viewStudent.fullName}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <Users className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{viewStudent.fullName}</h3>
                  <Badge className={getStatusBadgeColor(viewStudent)}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(viewStudent)}
                      {getStatusText(viewStudent)}
                    </div>
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm">{viewStudent.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Contact</Label>
                  <p className="text-sm">{viewStudent.contact}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Role</Label>
                  <p className="text-sm capitalize">{viewStudent.role}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Account Verified</Label>
                  <p className="text-sm">{viewStudent.isAccountVerified ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Active Status</Label>
                  <p className="text-sm">{viewStudent.isActive ? 'Active' : 'Inactive'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Joined Date</Label>
                  <p className="text-sm">{formatDate(viewStudent.createdAt)}</p>
                </div>
                {viewStudent.lastLogin && (
                  <div>
                    <Label className="text-sm font-medium">Last Login</Label>
                    <p className="text-sm">{formatDate(viewStudent.lastLogin)}</p>
                  </div>
                )}
              </div>
              
              <div>
                <Label className="text-sm font-medium">Live Sessions Enrolled</Label>
                <p className="text-sm">{viewStudent.liveSessions.length} sessions</p>
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
    </div>
  );
};

export default AdminStudentDetails;