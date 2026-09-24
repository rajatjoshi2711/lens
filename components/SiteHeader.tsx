"use client";

import { useState } from "react";
import { AdminLoginModal } from "./AdminLoginModal";
import { Logo } from "./Logo";

export function SiteHeader() {
  const [adminOpen, setAdminOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="ef-container-marketing site-header-inner">
        <Logo onSecretTrigger={() => setAdminOpen(true)} />
      </div>
      <AdminLoginModal open={adminOpen} onClose={() => setAdminOpen(false)} />
    </header>
  );
}
