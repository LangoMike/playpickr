import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect authenticated users to dashboard, unauthenticated to home
  if (user) {
    redirect("/dashboard");
  } else {
    redirect("/home");
  }
}
