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
    // SaddleMatch is a phone app. On anything wider than a handset we letterbox
    // it into a phone-width column rather than stretching profile cards across a
    // 2000px monitor, so it reads as an app on every screen.
    <div className="flex min-h-screen justify-center bg-line/40">
      <div className="relative flex min-h-screen w-full max-w-[480px] flex-col bg-cream shadow-[0_0_60px_rgba(27,25,23,0.10)]">
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
        <main className="flex-1 pb-24">{children}</main>
        <BottomNav avatarUrl={profile?.photo_urls?.[0] ?? null} />
      </div>
    </div>
  );
}
