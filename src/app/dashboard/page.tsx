import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Dashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // if user is not authenticated, redirect to sign in
  if (!user) {
    redirect("/auth/signin");
  }

  // Dashboard for authenticated users only
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Section */}
      <section className="mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 gaming-gradient">
          Welcome back,{" "}
          {user.user_metadata?.full_name || user.email?.split("@")[0]}!
        </h1>
        <p className="text-xl text-muted-foreground">
          Ready to discover your next favorite game?
        </p>
      </section>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {/* Picks */}
        <Card className="gaming-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-400">
              🎯 Your Picks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Personalized game recommendations just for you
            </CardDescription>
            <Link href="/recommendations">
              <Button className="gaming-button w-full">
                View Recommendations
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Liked Games */}
        <Card className="gaming-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-400">
              ❤️ Liked Games
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Games you've liked and want to play
            </CardDescription>
            <Link href="/liked">
              <Button className="gaming-button w-full">View Liked Games</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Favorites */}
        <Card className="gaming-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-400">
              ⭐ Favorites
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Your all-time favorite games
            </CardDescription>
            <Link href="/favorites">
              <Button className="gaming-button w-full">View Favorites</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Played Games */}
        <Card className="gaming-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-400">
              ✅ Played Games
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Games you've completed or played before
            </CardDescription>
            <Link href="/played">
              <Button className="gaming-button w-full">
                View Played Games
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Browse Games */}
        <Card className="gaming-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-400">
              🔍 Browse Games
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Discover new games and explore genres
            </CardDescription>
            <Link href="/browse">
              <Button className="gaming-button w-full">Browse All Games</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Profile */}
        <Card className="gaming-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-400">
              👤 Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Manage your account and preferences
            </CardDescription>
            <Link href="/profile">
              <Button className="gaming-button w-full">View Profile</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <section className="text-center">
        <h2 className="text-2xl font-bold gaming-gradient mb-6">
          Quick Actions
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/games/grand-theft-auto-v">
            <Button className="gaming-button px-8 py-4 text-lg">
              Test Game Page
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
