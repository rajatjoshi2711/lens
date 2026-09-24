"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

type AdminLoginModalProps = {
  open: boolean;
  onClose: () => void;
};

/**
 * Admin sign-in dialog opened from the hidden logo trigger.
 * Phase 5 connects this form to Better Auth email + password sign-in.
 */
export function AdminLoginModal({ open, onClose }: AdminLoginModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="tm-dialog"
      aria-labelledby="admin-login-title"
      onClose={onClose}
      onClick={(e) => {
        // Close when the backdrop (the dialog element itself) is clicked.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        className="tm-dialog-body"
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <div className="tm-dialog-head">
          <div>
            <p className="tm-eyebrow">Lens admin</p>
            <h2 id="admin-login-title" className="tm-dialog-title">
              Sign in
            </h2>
            <p className="tm-dialog-desc">For the Talent Muscle team.</p>
          </div>
          <button type="button" className="tm-icon-btn" aria-label="Close" onClick={onClose}>
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        <div className="tm-field">
          <label htmlFor="admin-email">Work email</label>
          <input
            id="admin-email"
            name="email"
            type="email"
            className="tm-input"
            autoComplete="username"
            required
          />
        </div>
        <div className="tm-field">
          <label htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            name="password"
            type="password"
            className="tm-input"
            autoComplete="current-password"
            required
          />
        </div>

        <p className="tm-notice">Admin sign-in is not connected yet.</p>

        <button type="submit" className="tm-btn tm-btn-primary tm-btn-lg tm-btn-block" disabled>
          Sign in
        </button>
        <button type="button" className="tm-btn tm-btn-link" style={{ alignSelf: "center" }} disabled>
          Forgot your password?
        </button>
      </form>
    </dialog>
  );
}
