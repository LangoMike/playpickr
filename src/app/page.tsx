import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="text-center py-16">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 gaming-gradient">
          Discover Your Next Game
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          PlayPickr uses AI-powered recommendations to help you find games
          you'll love. Browse, like, and discover your next gaming adventure.
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" className="text-lg px-8 gaming-button">
            Start Discovering
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="text-lg px-8 border-purple-500 text-purple-400 hover:bg-purple-500/10"
          >
            Browse Games
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          Why Choose PlayPickr?
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="gaming-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-400 justify-center">
                🎮 AI Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Get personalized game recommendations based on your preferences
                and gaming history.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="gaming-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-400 justify-center">
                ⭐ Smart Discovery
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Find similar games to ones you love and discover hidden gems in
                your favorite genres.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="gaming-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-400 justify-center">
                📱 Modern Experience
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Clean, responsive design that works perfectly on desktop and
                mobile devices.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center py-16 gaming-card rounded-lg">
        <h2 className="text-3xl font-bold mb-4 gaming-gradient">
          Ready to Find Your Next Game?
        </h2>
        <p className="text-muted-foreground mb-8">
          Join thousands of gamers discovering their next favorite titles.
        </p>
        <Button size="lg" className="text-lg px-8 gaming-button">
          Get Started Free
        </Button>
      </section>
    </div>
  );
}
