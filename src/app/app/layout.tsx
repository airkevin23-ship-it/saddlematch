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
    // Full-bleed on phones. The previous version letterboxed the app into a
    // 480px column against a contrasting background, which looked like a phone
    // mock-up on a desktop but wasted the screen on an actual handset and would
    // be actively wrong inside a native shell. The width is still capped on
    // large screens so cards do not stretch across a monitor, but the backdrop
    // now matches the app so there are no visible side bars.
    <div className="min-h-screen bg-cream">
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col bg-cream">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-cream/90 px-4 py-3 backdrop-blur">
          <Link href="/" aria-label="SaddleMatch home" className="flex items-center gap-1.5 text-lg font-extrabold tracking-tight text-ink">
            <HorseshoeIcon className="h-5 w-5 text-brand" />
            {APP_NAME}
          </Link>
          <div className="flex items-center gap-1">
            <HeaderActions />
            <SignOutButton />
          </div>
        </header>
        <main className="flex-1 pb-[calc(6rem+env(safe-area-inset-bottom))]">{children}</main>
        <BottomNav avatarUrl={profile?.photo_urls?.[0] ?? null} />
      </div>
    </div>
  );
}
