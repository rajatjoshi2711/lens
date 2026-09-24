"use client";

import Link from "next/link";
import { useState } from "react";
import { AdminLoginModal } from "./AdminLoginModal";
import { Logo } from "./Logo";

export function SiteHeader() {
  const [adminOpen, setAdminOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="container site-header-inner">
        <Logo onSecretTrigger={() => setAdminOpen(true)} />
        <Link href="/" className="product-name" aria-label="Lens home">
          Lens
        </Link>
      </div>
      <AdminLoginModal open={adminOpen} onClose={() => setAdminOpen(false)} />
    </header>
  );
}
