import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AuthCodeErrorPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <Card className="gaming-card">
          <CardHeader>
            <CardTitle className="text-center text-red-400">
              Authentication Error
            </CardTitle>
            <CardDescription className="text-center">
              There was an error signing you in
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              The authentication process failed. This could be due to:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Expired or invalid authentication code</li>
              <li>• Network connectivity issues</li>
              <li>• Server configuration problems</li>
            </ul>
            <div className="flex flex-col gap-2">
              <Link href="/auth/signin">
                <Button className="gaming-button w-full">Try Again</Button>
              </Link>
              <Link href="/home">
                <Button variant="outline" className="w-full">
                  Go Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
