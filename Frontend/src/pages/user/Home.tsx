import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Sprout, 
  Users, 
  BookOpen, 
  Award, 
  ArrowRight,
  Leaf,
  Tractor,
  Sun,
  CheckCircle
} from "lucide-react";

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleDashboardClick = () => {
    navigate("/profile"); // ✅ send logged-in customers to profile (or dashboard if you add one)
  };

  return (
    <div className="w-full bg-gradient-to-b from-background to-muted/20">
      {/* Welcome Message for Logged-in Users */}
      {user && (
        <div className="bg-primary/5 border-b border-primary/10">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
            <Alert className="border-primary/20 bg-primary/5">
              <CheckCircle className="h-4 w-4 text-primary" />
              <AlertDescription className="text-primary">
                Welcome back, <strong>{user.fullName || user.name}</strong>! 
                <button 
                  onClick={handleDashboardClick}
                  className="ml-2 underline hover:no-underline text-primary hover:text-primary/80"
                >
                  Go to Dashboard
                </button>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="w-full mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
              <Sprout className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              {user ? (
                <>Welcome back to <span className="text-primary">FarmerHub</span></>
              ) : (
                <>Welcome to <span className="text-primary">FarmerHub</span></>
              )}
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Empowering farmers through modern techniques and sustainable practices. 
              Join our community of successful farmers today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <>
                  <Button 
                    size="lg" 
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={handleDashboardClick}
                  >
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Link to="/marketplace">
                    <Button size="lg" variant="outline">
                      Explore Marketplace
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/auth/register">
                    <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to="/auth/login">
                    <Button size="lg" variant="outline">
                      Already a Member? Login
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="w-full">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Choose FarmerHub?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We provide training and resources to help you succeed in agriculture
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-4">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Expert Training
                </h3>
                <p className="text-muted-foreground">
                  Learn from experienced professionals with proven track records
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-4">
                  <Tractor className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Modern Techniques
                </h3>
                <p className="text-muted-foreground">
                  Stay updated with the latest technologies and sustainable practices
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Community Support
                </h3>
                <p className="text-muted-foreground">
                  Connect with fellow farmers and build lasting relationships
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="w-full">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="inline-flex items-center justify-center w-12 h-12 bg-success/10 rounded-full mb-4">
                <Users className="h-6 w-6 text-success" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-2">500+</div>
              <div className="text-muted-foreground">Farmers Trained</div>
            </div>
            
            <div>
              <div className="inline-flex items-center justify-center w-12 h-12 bg-success/10 rounded-full mb-4">
                <BookOpen className="h-6 w-6 text-success" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-2">25+</div>
              <div className="text-muted-foreground">Programs</div>
            </div>
            
            <div>
              <div className="inline-flex items-center justify-center w-12 h-12 bg-success/10 rounded-full mb-4">
                <Award className="h-6 w-6 text-success" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-2">95%</div>
              <div className="text-muted-foreground">Success Rate</div>
            </div>
            
            <div>
              <div className="inline-flex items-center justify-center w-12 h-12 bg-success/10 rounded-full mb-4">
                <Leaf className="h-6 w-6 text-success" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-2">100%</div>
              <div className="text-muted-foreground">Sustainable</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary/5">
        <div className="w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
            <Sun className="h-8 w-8 text-primary" />
          </div>
          {user ? (
            <>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Continue Your Farming Journey
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Access your profile, track your progress, and explore new opportunities
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={handleDashboardClick}
                >
                  Go to Dashboard
                </Button>
                <Link to="/marketplace">
                  <Button size="lg" variant="outline">
                    Explore Marketplace
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Ready to Start Your Farming Journey?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Join thousands of successful farmers who have transformed their lives
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/auth/register">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    Join FarmerHub Today
                  </Button>
                </Link>
                <Link to="/auth/login">
                  <Button size="lg" variant="outline">
                    Already a Member? Login
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
