import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export default function Home() {
  // Public landing page for unauthenticated users
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="text-center py-16">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 gaming-gradient">
          Discover Your Next Game
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          PlayPickr uses AI-powered recommendations to help you find games
          you&apos;ll love. Browse, like, and discover your next gaming
          adventure.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/auth/signin">
            <Button size="lg" className="text-lg px-8 gaming-button">
              Get Started Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <h2 className="text-3xl font-bold text-center mb-12 gaming-gradient">
          Why Choose PlayPickr?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="gaming-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-400 justify-center">
                🎯 Smart Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Our AI learns from your preferences to suggest games you&apos;ll
                actually want to play.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="gaming-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-400 justify-center">
                🔍 Discover Similar Games
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
      <section className="text-center py-16">
        <h2 className="text-3xl font-bold mb-4 gaming-gradient">
          Ready to Find Your Next Game?
        </h2>
        <p className="text-muted-foreground mb-8">
          Join thousands of gamers discovering their next favorite titles.
        </p>
      </section>
    </div>
  );
}
