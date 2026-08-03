import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { APP_NAME } from "@/lib/constants";
import { HorseshoeIcon } from "@/components/western-icons";
import SignOutButton from "./sign-out-button";
import { BottomNav, HeaderActions } from "@/components/app-nav";

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
    .select("id, photo_urls")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <header className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-line bg-cream/90 backdrop-blur">
        <Link href="/" aria-label="SaddleMatch home" className="flex items-center gap-1.5 font-extrabold text-lg tracking-tight text-ink">
          <HorseshoeIcon className="w-5 h-5 text-brand" />
          {APP_NAME}
        </Link>
        <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-ink-soft">
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
          <span className="flex items-center gap-1 border-l border-line pl-3">
            <HeaderActions />
          </span>
        </nav>
        <div className="flex items-center gap-1 sm:hidden">
          <HeaderActions />
          <SignOutButton />
        </div>
      </header>
      <main className="flex-1 pb-20 sm:pb-0">{children}</main>
      <BottomNav avatarUrl={profile?.photo_urls?.[0] ?? null} />
    </div>
  );
}
