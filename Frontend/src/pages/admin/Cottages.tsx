import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  MapPin,
  Users,
  Star,
  Home,
} from "lucide-react";

import {
  getCottages,
  createCottage,
  updateCottage,
  deleteCottage,
} from "@/api/cottages";

const Cottages = () => {
  const [cottages, setCottages] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // Add dialog
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newCottage, setNewCottage] = useState({
    name: "",
    location: "",
    capacity: 0,
    pricePerNight: 0,
    available: true,
    description: "",
    amenities: "",
    image: "",
  });

  // Edit dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCottage, setEditingCottage] = useState<any>(null);

  // Fetch cottages
  useEffect(() => {
    fetchCottages();
  }, []);

  const fetchCottages = async () => {
    try {
      setLoading(true);
      const data = await getCottages();
      setCottages(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching cottages", error);
      setLoading(false);
    }
  };

  // Add cottage
  const handleAdd = async () => {
    try {
      const created = await createCottage({
        ...newCottage,
        amenities: newCottage.amenities
          ? newCottage.amenities.split(",").map((a) => a.trim())
          : [],
      });
      setCottages([created, ...cottages]);
      setNewCottage({
        name: "",
        location: "",
        capacity: 0,
        pricePerNight: 0,
        available: true,
        description: "",
        amenities: "",
        image: "",
      });
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error("Create failed", error);
    }
  };

  // Update cottage
  const handleUpdate = async (id: string, updated: any) => {
    try {
      const updatedCottage = await updateCottage(id, {
        ...updated,
        amenities: typeof updated.amenities === "string"
          ? updated.amenities.split(",").map((a: string) => a.trim())
          : updated.amenities,
      });
      setCottages(
        cottages.map((c) => (c._id === id ? updatedCottage : c))
      );
    } catch (error) {
      console.error("Update failed", error);
    }
  };

  // Delete cottage
  const handleDelete = async (id: string) => {
    try {
      await deleteCottage(id);
      setCottages(cottages.filter((c) => c._id !== id));
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  // Toggle availability
  const handleToggleAvailable = async (id: string, current: boolean) => {
    try {
      const updated = await updateCottage(id, { available: !current });
      setCottages(cottages.map((c) => (c._id === id ? updated : c)));
    } catch (error) {
      console.error("Availability toggle failed", error);
    }
  };

  // Filter cottages
  const filteredCottages = cottages.filter(
    (cottage) =>
      cottage.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cottage.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Cottage Management
          </h1>
          <p className="text-muted-foreground">
            Manage your cottage rentals and bookings
          </p>
        </div>

        {/* Add Cottage Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:shadow-glow">
              <Plus className="w-4 h-4 mr-2" />
              Add Cottage
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Cottage</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cottage-name">Cottage Name</Label>
                  <Input
                    id="cottage-name"
                    value={newCottage.name}
                    onChange={(e) =>
                      setNewCottage({ ...newCottage, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={newCottage.location}
                    onChange={(e) =>
                      setNewCottage({ ...newCottage, location: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={newCottage.capacity}
                    onChange={(e) =>
                      setNewCottage({
                        ...newCottage,
                        capacity: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="price">Price per Night</Label>
                  <Input
                    id="price"
                    type="number"
                    value={newCottage.pricePerNight}
                    onChange={(e) =>
                      setNewCottage({
                        ...newCottage,
                        pricePerNight: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="flex items-center space-x-2 pt-7">
                  <Switch
                    id="availability"
                    checked={newCottage.available}
                    onCheckedChange={(checked) =>
                      setNewCottage({ ...newCottage, available: checked })
                    }
                  />
                  <Label htmlFor="availability">Available</Label>
                </div>
              </div>
              <div>
                <Label htmlFor="cottage-description">Description</Label>
                <Textarea
                  id="cottage-description"
                  value={newCottage.description}
                  onChange={(e) =>
                    setNewCottage({
                      ...newCottage,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="amenities">Amenities (comma separated)</Label>
                <Input
                  id="amenities"
                  value={newCottage.amenities}
                  onChange={(e) =>
                    setNewCottage({ ...newCottage, amenities: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="image">Image</Label>
                <Input
                  id="image"
                  value={newCottage.image}
                  onChange={(e) =>
                    setNewCottage({ ...newCottage, image: e.target.value })
                  }
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button className="bg-gradient-primary" onClick={handleAdd}>
                  Add Cottage
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card className="border-border bg-card shadow-card">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search cottages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Cottages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCottages.map((cottage) => (
          <Card
            key={cottage._id}
            className="border-border bg-card shadow-card hover:shadow-natural transition-all duration-200"
          >
            <CardHeader className="p-0">
              <div className="h-48 w-full flex items-center justify-center overflow-hidden relative rounded-t-lg">
                <img
                  src={cottage.image}
                  alt={cottage.name}
                  className="object-cover h-full w-full"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.png";
                  }}
                />
                <div className="absolute top-4 right-4">
                  <Badge variant={cottage.available ? "default" : "secondary"}>
                    {cottage.available ? "Available" : "Booked"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-lg text-foreground">
                  {cottage.name}
                </h3>
                <div className="flex items-center gap-1 text-muted-foreground text-sm">
                  <MapPin className="h-4 w-4" />
                  {cottage.location}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-warning text-warning" />
                  <span className="font-medium">{cottage.rating}</span>
                  <span className="text-muted-foreground text-sm">
                    ({cottage.reviews} reviews)
                  </span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground line-clamp-2">
                {cottage.description}
              </p>

              <div className="flex flex-wrap gap-1">
                {cottage.amenities &&
                  cottage.amenities.slice(0, 3).map((amenity: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {amenity}
                    </Badge>
                  ))}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">
                    Up to {cottage.capacity} guests
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-primary">
                    Rs. {cottage.pricePerNight}
                  </div>
                  <div className="text-xs text-muted-foreground">per night</div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setEditingCottage({
                      ...cottage,
                      amenities: cottage.amenities.join(", "),
                    });
                    setIsEditDialogOpen(true);
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => handleDelete(cottage._id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <Label
                  htmlFor={`availability-${cottage._id}`}
                  className="text-sm"
                >
                  Available for booking
                </Label>
                <Switch
                  id={`availability-${cottage._id}`}
                  checked={cottage.available}
                  onCheckedChange={() =>
                    handleToggleAvailable(cottage._id, cottage.available)
                  }
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Cottage Dialog */}
      {editingCottage && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-card border-border max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Cottage</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cottage Name</Label>
                  <Input
                    value={editingCottage.name}
                    onChange={(e) =>
                      setEditingCottage({
                        ...editingCottage,
                        name: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Location</Label>
                  <Input
                    value={editingCottage.location}
                    onChange={(e) =>
                      setEditingCottage({
                        ...editingCottage,
                        location: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Capacity</Label>
                  <Input
                    type="number"
                    value={editingCottage.capacity}
                    onChange={(e) =>
                      setEditingCottage({
                        ...editingCottage,
                        capacity: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Price per Night</Label>
                  <Input
                    type="number"
                    value={editingCottage.pricePerNight}
                    onChange={(e) =>
                      setEditingCottage({
                        ...editingCottage,
                        pricePerNight: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={editingCottage.description}
                  onChange={(e) =>
                    setEditingCottage({
                      ...editingCottage,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label>Amenities (comma separated)</Label>
                <Input
                  value={editingCottage.amenities}
                  onChange={(e) =>
                    setEditingCottage({
                      ...editingCottage,
                      amenities: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label>Image</Label>
                <Input
                  value={editingCottage.image}
                  onChange={(e) =>
                    setEditingCottage({
                      ...editingCottage,
                      image: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-gradient-primary"
                  onClick={() => {
                    handleUpdate(editingCottage._id, editingCottage);
                    setIsEditDialogOpen(false);
                  }}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Empty State */}
      {filteredCottages.length === 0 && !loading && (
        <Card className="border-border bg-card shadow-card">
          <CardContent className="p-12 text-center">
            <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No cottages found
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm
                ? "Try adjusting your search criteria"
                : "Start by adding your first cottage listing"}
            </p>
            <Button
              className="bg-gradient-primary"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Cottage
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Cottages;
