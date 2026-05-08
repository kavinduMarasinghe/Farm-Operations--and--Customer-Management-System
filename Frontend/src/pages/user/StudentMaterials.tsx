import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppSidebar } from '@/components/layout/StudentAppSidebar';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { 
  BookOpen,
  FileText,
  Video,
  Download,
  ExternalLink,
  Search,
  Filter,
  Eye,
  Calendar,
  Tag,
  Users,
  GraduationCap,
  Building,
  Clock,
  Loader2,
  AlertCircle,
  CheckCircle,
  FileIcon,
  Link as LinkIcon,
  MessageSquare,
  Star
} from 'lucide-react';

interface LearningMaterial {
  _id: string;
  title: string;
  description?: string;
  type: 'FILE' | 'LINK' | 'VIDEO' | 'DOC' | 'OTHER';
  fileUrl?: string;
  link?: string;
  visibility: 'PUBLIC' | 'DEPARTMENT' | 'YEAR' | 'PRIVATE';
  department?: string;
  year?: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

const StudentMaterials: React.FC = () => {
  const [materials, setMaterials] = useState<LearningMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [visibilityFilter, setVisibilityFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');

  // Pagination state
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 12,
    pages: 0
  });

  // View modes
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedMaterial, setSelectedMaterial] = useState<LearningMaterial | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  // Feedback state
  const [feedbackMaterial, setFeedbackMaterial] = useState<LearningMaterial | null>(null);
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Fetch materials
  const fetchMaterials = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      // Build query parameters with fallback values
      const params = new URLSearchParams({
        page: (pagination?.page ?? 1).toString(),
        limit: (pagination?.limit ?? 12).toString(),
        sort: 'createdAt',
        order: 'desc'
      });

      if (searchTerm) params.append('search', searchTerm);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (visibilityFilter !== 'all') params.append('visibility', visibilityFilter);
      if (departmentFilter) params.append('department', departmentFilter);
      if (yearFilter) params.append('year', yearFilter);

      let data;
      try {
        const response = await fetch(`http://localhost:8070/api/student/materials?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        data = await response.json();

        if (response.ok && data.success) {
          setMaterials(data.materials || []);
          setPagination({
            total: data.pagination?.total ?? 0,
            page: data.pagination?.page ?? data.pagination?.currentPage ?? 1,
            limit: data.pagination?.limit ?? 12,
            pages: data.pagination?.pages ?? data.pagination?.totalPages ?? 0
          });
        } else {
          setError(data.message || 'Failed to fetch learning materials');
        }
      } catch (jsonErr) {
        setError('Network error occurred while fetching materials');
        console.error('Materials fetch error:', jsonErr);
      }
    } catch (err) {
      setError('Network error occurred while fetching materials');
      console.error('Materials fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // View material details
  const viewMaterialDetails = async (materialId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const response = await fetch(`http://localhost:8070/api/student/materials/${materialId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSelectedMaterial(data.material);
        setIsDetailDialogOpen(true);
      } else {
        setError(data.message || 'Failed to fetch material details');
      }
    } catch (err) {
      setError('Network error occurred while fetching material details');
      console.error('Material details fetch error:', err);
    }
  };

  // Submit feedback for material
  const submitFeedback = async () => {
    if (!feedbackMaterial) return;

    try {
      setSubmittingFeedback(true);
      setError('');

      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const response = await fetch('http://localhost:8070/api/student/feedback', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'MATERIAL',
          target: feedbackMaterial._id,
          rating: feedbackRating,
          comment: feedbackComment
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('Feedback submitted successfully!');
        setIsFeedbackDialogOpen(false);
        setFeedbackComment('');
        setFeedbackRating(5);
        setFeedbackMaterial(null);
      } else {
        setError(data.message || 'Failed to submit feedback');
      }
    } catch (err) {
      setError('Network error occurred while submitting feedback');
      console.error('Feedback submission error:', err);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // Open feedback dialog
  const openFeedbackDialog = (material: LearningMaterial) => {
    setFeedbackMaterial(material);
    setIsFeedbackDialogOpen(true);
  };

  // Helper functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'DOC':
        return <FileText className="h-5 w-5" />;
      case 'VIDEO':
        return <Video className="h-5 w-5" />;
      case 'LINK':
        return <LinkIcon className="h-5 w-5" />;
      case 'FILE':
        return <FileIcon className="h-5 w-5" />;
      case 'OTHER':
        return <BookOpen className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'DOC':
        return 'bg-blue-100 text-blue-800';
      case 'VIDEO':
        return 'bg-red-100 text-red-800';
      case 'LINK':
        return 'bg-green-100 text-green-800';
      case 'FILE':
        return 'bg-purple-100 text-purple-800';
      case 'OTHER':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case 'PUBLIC':
        return 'bg-green-100 text-green-800';
      case 'DEPARTMENT':
        return 'bg-blue-100 text-blue-800';
      case 'YEAR':
        return 'bg-yellow-100 text-yellow-800';
      case 'PRIVATE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAccessMaterial = (material: LearningMaterial) => {
    if (material.link) {
      window.open(material.link, '_blank');
    } else if (material.fileUrl) {
      window.open(material.fileUrl, '_blank');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setVisibilityFilter('all');
    setDepartmentFilter('');
    setYearFilter('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Effects
  useEffect(() => {
    fetchMaterials();
  }, [pagination.page, searchTerm, typeFilter, visibilityFilter, departmentFilter, yearFilter]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const MaterialCard = ({ material }: { material: LearningMaterial }) => (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            {getTypeIcon(material.type)}
            <CardTitle className="text-lg line-clamp-2">{material.title}</CardTitle>
          </div>
          <div className="flex flex-col gap-1">
            <Badge className={getTypeColor(material.type)}>
              {material.type}
            </Badge>
            <Badge className={getVisibilityColor(material.visibility)}>
              {material.visibility}
            </Badge>
          </div>
        </div>
        {material.description && (
          <CardDescription className="line-clamp-3">
            {material.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Tags */}
          {material.tags && material.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {material.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
              {material.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{material.tags.length - 3} more
                </Badge>
              )}
            </div>
          )}

          {/* Meta information */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {formatDate(material.createdAt)}
            </div>
            {(material.department || material.year) && (
              <div className="flex items-center space-x-2">
                {material.department && (
                  <div className="flex items-center">
                    <Building className="h-4 w-4 mr-1" />
                    {material.department}
                  </div>
                )}
                {material.year && (
                  <div className="flex items-center">
                    <GraduationCap className="h-4 w-4 mr-1" />
                    Year {material.year}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => viewMaterialDetails(material._id)}
            >
              <Eye className="h-4 w-4 mr-1" />
              View Details
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openFeedbackDialog(material)}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Feedback
            </Button>
            <Button
              size="sm"
              onClick={() => handleAccessMaterial(material)}
              disabled={!material.link && !material.fileUrl}
            >
              {material.link ? (
                <>
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Open Link
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const MaterialListItem = ({ material }: { material: LearningMaterial }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <div className="flex items-center space-x-2">
              {getTypeIcon(material.type)}
              <div>
                <h3 className="font-semibold text-lg">{material.title}</h3>
                {material.description && (
                  <p className="text-gray-600 text-sm line-clamp-2">{material.description}</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex flex-col gap-1">
              <Badge className={getTypeColor(material.type)}>
                {material.type}
              </Badge>
              <Badge className={getVisibilityColor(material.visibility)}>
                {material.visibility}
              </Badge>
            </div>
            
            <div className="text-sm text-gray-600 text-right">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {formatDate(material.createdAt)}
              </div>
              {(material.department || material.year) && (
                <div className="flex items-center space-x-2 mt-1">
                  {material.department && (
                    <div className="flex items-center">
                      <Building className="h-4 w-4 mr-1" />
                      {material.department}
                    </div>
                  )}
                  {material.year && (
                    <div className="flex items-center">
                      <GraduationCap className="h-4 w-4 mr-1" />
                      Year {material.year}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => viewMaterialDetails(material._id)}
              >
                <Eye className="h-4 w-4 mr-1" />
                Details
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openFeedbackDialog(material)}
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                Feedback
              </Button>
              <Button
                size="sm"
                onClick={() => handleAccessMaterial(material)}
                disabled={!material.link && !material.fileUrl}
              >
                {material.link ? (
                  <>
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Open
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="pl-0 pr-4 py-4 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Learning Materials</h1>
            <p className="text-gray-600 mt-2">Access course materials, documents, videos, and resources</p>
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

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Search and Filter Materials
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search materials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Material Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="DOC">Documents</SelectItem>
                <SelectItem value="VIDEO">Videos</SelectItem>
                <SelectItem value="LINK">Links</SelectItem>
                <SelectItem value="FILE">Files</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>

            <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Materials</SelectItem>
                <SelectItem value="PUBLIC">Public</SelectItem>
                <SelectItem value="DEPARTMENT">Department</SelectItem>
                <SelectItem value="YEAR">Year Specific</SelectItem>
                <SelectItem value="PRIVATE">Private</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Department"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            />

            <Input
              placeholder="Year"
              type="number"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
            />
          </div>
          
          <div className="flex justify-between items-center mt-4">
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
            
            <div className="flex space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                Grid
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                List
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Materials Display */}
      <div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
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
            ))}
          </div>
        ) : materials.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Materials Found</h3>
            <p className="text-gray-600">No learning materials match your current filters.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {materials.map((material) => (
              <MaterialCard key={material._id} material={material} />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {materials.map((material) => (
              <MaterialListItem key={material._id} material={material} />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            disabled={pagination.page <= 1}
          >
            Previous
          </Button>
          <span className="text-sm">
            Page {pagination.page} of {pagination.pages} ({pagination.total} total)
          </span>
          <Button
            variant="outline"
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            disabled={pagination.page >= pagination.pages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Material Details Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {selectedMaterial && getTypeIcon(selectedMaterial.type)}
              <span>{selectedMaterial?.title}</span>
            </DialogTitle>
            <DialogDescription>
              Material details and information
            </DialogDescription>
          </DialogHeader>
          {selectedMaterial && (
            <div className="space-y-4">
              <div className="flex space-x-2">
                <Badge className={getTypeColor(selectedMaterial.type)}>
                  {selectedMaterial.type}
                </Badge>
                <Badge className={getVisibilityColor(selectedMaterial.visibility)}>
                  {selectedMaterial.visibility}
                </Badge>
              </div>
              
              {selectedMaterial.description && (
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-gray-700">{selectedMaterial.description}</p>
                </div>
              )}

              {selectedMaterial.tags && selectedMaterial.tags.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedMaterial.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-1">Created</h4>
                  <p className="text-sm text-gray-600">{formatDate(selectedMaterial.createdAt)}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Updated</h4>
                  <p className="text-sm text-gray-600">{formatDate(selectedMaterial.updatedAt)}</p>
                </div>
                {selectedMaterial.department && (
                  <div>
                    <h4 className="font-semibold mb-1">Department</h4>
                    <p className="text-sm text-gray-600">{selectedMaterial.department}</p>
                  </div>
                )}
                {selectedMaterial.year && (
                  <div>
                    <h4 className="font-semibold mb-1">Year</h4>
                    <p className="text-sm text-gray-600">Year {selectedMaterial.year}</p>
                  </div>
                )}
              </div>

              <div className="flex space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => openFeedbackDialog(selectedMaterial)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Give Feedback
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => handleAccessMaterial(selectedMaterial)}
                  disabled={!selectedMaterial.link && !selectedMaterial.fileUrl}
                >
                  {selectedMaterial.link ? (
                    <>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Link
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Download File
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog open={isFeedbackDialogOpen} onOpenChange={setIsFeedbackDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>Give Feedback</span>
            </DialogTitle>
            <DialogDescription>
              Share your thoughts about "{feedbackMaterial?.title}"
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Rating */}
            <div>
              <label className="text-sm font-medium mb-2 block">Rating</label>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFeedbackRating(star)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        star <= feedbackRating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm text-gray-600">
                  {feedbackRating}/5 stars
                </span>
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="text-sm font-medium mb-2 block">Comment</label>
              <textarea
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                placeholder="Share your thoughts about this material..."
                className="w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                required
              />
            </div>

            {/* Actions */}
            <div className="flex space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsFeedbackDialogOpen(false)}
                disabled={submittingFeedback}
              >
                Cancel
              </Button>
              <Button
                onClick={submitFeedback}
                disabled={submittingFeedback || !feedbackComment.trim()}
                className="flex-1"
              >
                {submittingFeedback ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Submit Feedback
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default StudentMaterials;