import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { APP_NAME } from "@/lib/constants";
import SignOutButton from "./sign-out-button";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-line bg-cream/90 backdrop-blur">
        <Link href="/app/discover" className="flex items-center gap-2 font-extrabold text-lg tracking-tight text-ink">
          <img src="/saddlematch-logo.png" alt="" className="h-7 w-7 object-contain" />
          {APP_NAME}
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-ink-soft">
          <Link href="/app/discover" className="hover:text-ink transition-colors">
            Discover
          </Link>
          <Link href="/app/matches" className="hover:text-ink transition-colors">
            Matches
          </Link>
          <Link href="/app/profile" className="hover:text-ink transition-colors">
            Profile
          </Link>
          <Link
            href="/app/upgrade"
            className="text-brand hover:text-brand-dark font-semibold"
          >
            Plus
          </Link>
          <SignOutButton />
        </nav>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
