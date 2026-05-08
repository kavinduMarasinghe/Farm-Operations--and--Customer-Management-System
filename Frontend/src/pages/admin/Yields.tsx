import { useState, useEffect } from "react";
import { BarChart3, Plus, TrendingUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface YieldRecord {
  id: string;
  crop: string;
  field: string;
  season: string;
  year: number;
  yield: number;
  quality: "excellent" | "good" | "fair" | "poor";
  harvestDate: string;
  notes: string;
}

export default function Yields() {
  const [yields, setYields] = useState<YieldRecord[]>([]);
  const [newYield, setNewYield] = useState({
    crop: "",
    field: "",
    season: "",
    year: new Date().getFullYear(),
    yield: "",
    quality: "good" as YieldRecord["quality"],
    harvestDate: "",
    notes: ""
  });

  // Backend runs on 8070 in this project
  const API_URL = import.meta.env.VITE_API_BASE_URL ? `${import.meta.env.VITE_API_BASE_URL.replace(/\/$/,"")}/yields` : "http://localhost:8070/api/yields";

  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => setYields(data))
      .catch((err) => console.error("Error fetching yields:", err));
  }, []);

  const addYield = async () => {
    if (!newYield.crop || !newYield.field || !newYield.yield || !newYield.harvestDate) {
      alert("Please fill all required fields");
      return;
    }

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newYield,
          yield: parseFloat(newYield.yield as unknown as string)
        }),
      });

      const data = await res.json();
      setYields([data, ...yields]);

      setNewYield({
        crop: "",
        field: "",
        season: "",
        year: new Date().getFullYear(),
        yield: "",
        quality: "good",
        harvestDate: "",
        notes: ""
      });
    } catch (err) {
      console.error("Error adding yield:", err);
    }
  };

  const deleteYield = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      if (res.ok) {
        setYields(yields.filter((y) => y.id !== id));
      }
    } catch (err) {
      console.error("Error deleting yield:", err);
    }
  };

  const getQualityBadge = (quality: YieldRecord["quality"]) => {
    const variants = {
      excellent: "bg-farm-green/20 text-farm-green",
      good: "bg-farm-yellow/20 text-farm-brown",
      fair: "bg-farm-brown/20 text-farm-brown",
      poor: "bg-destructive/20 text-destructive",
    } as Record<string, string>;
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${variants[quality]}`}>
        {quality.charAt(0).toUpperCase() + quality.slice(1)}
      </span>
    );
  };

  const crops = ["Tea", "Rubber", "Coconut", "Paddy", "Cabbage", "Strawberries", "Carrot", "Sunflower"];
  const fields = ["North Field A", "North Field B", "South Field A", "South Field B", "East Field C", "West Field D"];
  const seasons = ["Season 1", "Season 2", "Season 4", "Season 5"];

  const currentYearYields = yields.filter((y) => y.year === new Date().getFullYear());
  const averageYield =
    currentYearYields.length > 0 ? currentYearYields.reduce((sum, y) => sum + y.yield, 0) / currentYearYields.length : 0;
  const totalHarvested = currentYearYields.reduce((sum, y) => sum + y.yield, 0);
  const excellentQualityCount = currentYearYields.filter((y) => y.quality === "excellent").length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
          <BarChart3 className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Crop Yields</h1>
          <p className="text-muted-foreground">Track and analyze harvest performance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-farm-green" />
            <div>
              <p className="text-sm text-muted-foreground">Avg Yield/Acre</p>
              <p className="text-2xl font-bold text-foreground">{averageYield.toFixed(1)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-farm-yellow" />
            <div>
              <p className="text-sm text-muted-foreground">Total Harvested</p>
              <p className="text-2xl font-bold text-foreground">{totalHarvested.toFixed(0)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-farm-brown" />
            <div>
              <p className="text-sm text-muted-foreground">Records This Year</p>
              <p className="text-2xl font-bold text-foreground">{currentYearYields.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-farm-green" />
            <div>
              <p className="text-sm text-muted-foreground">Excellent Quality</p>
              <p className="text-2xl font-bold text-foreground">{excellentQualityCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" /> Record New Yield
          </CardTitle>
          <CardDescription>Log harvest data and crop performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Crop Type</Label>
              <Select value={newYield.crop} onValueChange={(v) => setNewYield({ ...newYield, crop: v })}>
                <SelectTrigger><SelectValue placeholder="Select crop" /></SelectTrigger>
                <SelectContent>
                  {crops.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Field Location</Label>
              <Select value={newYield.field} onValueChange={(v) => setNewYield({ ...newYield, field: v })}>
                <SelectTrigger><SelectValue placeholder="Select field" /></SelectTrigger>
                <SelectContent>
                  {fields.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Season</Label>
              <Select value={newYield.season} onValueChange={(v) => setNewYield({ ...newYield, season: v })}>
                <SelectTrigger><SelectValue placeholder="Select season" /></SelectTrigger>
                <SelectContent>
                  {seasons.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Year</Label>
              <Input type="number" value={newYield.year} onChange={(e) => setNewYield({ ...newYield, year: parseInt(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Yield (bushels/acre)</Label>
              <Input type="number" value={newYield.yield} onChange={(e) => setNewYield({ ...newYield, yield: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Quality</Label>
              <Select value={newYield.quality} onValueChange={(v: YieldRecord["quality"]) => setNewYield({ ...newYield, quality: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Harvest Date</Label>
              <Input type="date" value={newYield.harvestDate} onChange={(e) => setNewYield({ ...newYield, harvestDate: e.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Notes</Label>
              <Input value={newYield.notes} onChange={(e) => setNewYield({ ...newYield, notes: e.target.value })} />
            </div>
            <div className="flex items-end">
              <Button onClick={addYield} className="w-full">
                <Plus className="w-4 h-4 mr-2" /> Record Yield
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Yield Records</CardTitle>
          <CardDescription>Historical crop performance data</CardDescription>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 text-left">Crop</th>
                <th className="py-2 text-left">Field</th>
                <th className="py-2 text-left">Season/Year</th>
                <th className="py-2 text-left">Yield</th>
                <th className="py-2 text-left">Quality</th>
                <th className="py-2 text-left">Harvest Date</th>
                <th className="py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {yields.map((y) => (
                <tr key={y.id} className="border-b hover:bg-muted/50">
                  <td>{y.crop}</td>
                  <td>{y.field}</td>
                  <td>{y.season} {y.year}</td>
                  <td>{y.yield} bu/acre</td>
                  <td>{getQualityBadge(y.quality)}</td>
                  <td>{new Date(y.harvestDate).toLocaleDateString()}</td>
                  <td>
                    <Button variant="outline" size="sm" onClick={() => deleteYield(y.id)} className="text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {yields.length === 0 && (
                <tr><td colSpan={7} className="py-6 text-center text-muted-foreground">No yield records</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
