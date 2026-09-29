"use client";

import Link from "next/link";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { AdminLoginModal } from "./AdminLoginModal";
import { Logo } from "./Logo";
import { SignOutButton } from "./SignOutButton";

export function SiteHeader() {
  const [adminOpen, setAdminOpen] = useState(false);
  const { data: session } = authClient.useSession();

  return (
    <header className="site-header">
      <div className="container site-header-inner">
        <Logo onSecretTrigger={() => setAdminOpen(true)} />
        {session?.user && (
          <nav className="header-account" aria-label="Account">
            <Link href="/report" className="tm-btn tm-btn-ghost">
              Your report
            </Link>
            <SignOutButton />
          </nav>
        )}
      </div>
      <AdminLoginModal open={adminOpen} onClose={() => setAdminOpen(false)} />
    </header>
  );
}
