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
      className="modal"
      aria-labelledby="admin-login-title"
      onClose={onClose}
      onClick={(e) => {
        // Close when the backdrop (the dialog element itself) is clicked.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        className="modal-body"
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <div className="modal-head">
          <div>
            <p className="ef-eyebrow">Admin</p>
            <h2 id="admin-login-title" className="ef-h3">
              Sign in
            </h2>
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label="Close"
            onClick={onClose}
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        <div className="field">
          <label htmlFor="admin-email">Email</label>
          <input
            id="admin-email"
            name="email"
            type="email"
            autoComplete="username"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>

        <p className="notice">Admin sign-in is not connected yet.</p>

        <button type="submit" className="ef-btn ef-btn-primary btn-block" disabled>
          Sign in
        </button>
        <button type="button" className="ef-btn ef-btn-text" disabled>
          Forgot password?
        </button>
      </form>
    </dialog>
  );
}
