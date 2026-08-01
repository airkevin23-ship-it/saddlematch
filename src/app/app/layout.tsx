import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { APP_NAME } from "@/lib/constants";
import { HorseshoeIcon } from "@/components/western-icons";
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
      <header className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-line bg-cream/90 backdrop-blur">
        <Link href="/app/discover" className="flex items-center gap-1.5 font-extrabold text-lg tracking-tight text-ink">
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
        </nav>
        <div className="sm:hidden">
          <SignOutButton />
        </div>
      </header>
      <main className="flex-1 pb-20 sm:pb-0">{children}</main>
      <nav
        aria-label="App navigation"
        className="sm:hidden fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-line bg-card/95 backdrop-blur px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_24px_rgba(27,25,23,0.06)]"
      >
        <Link href="/app/discover" className="min-h-12 flex items-center justify-center rounded-xl text-xs font-semibold text-ink-soft hover:bg-cream hover:text-ink">
          Discover
        </Link>
        <Link href="/app/matches" className="min-h-12 flex items-center justify-center rounded-xl text-xs font-semibold text-ink-soft hover:bg-cream hover:text-ink">
          Matches
        </Link>
        <Link href="/app/profile" className="min-h-12 flex items-center justify-center rounded-xl text-xs font-semibold text-ink-soft hover:bg-cream hover:text-ink">
          Profile
        </Link>
        <Link href="/app/upgrade" className="min-h-12 flex items-center justify-center rounded-xl text-xs font-bold text-brand hover:bg-brand-soft">
          Plus
        </Link>
      </nav>
    </div>
  );
}
