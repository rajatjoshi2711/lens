"use client";

import { CircleAlert } from "lucide-react";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

/** Starts Google sign-in; Better Auth returns the candidate to /claim. */
export function GoogleSignInButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setLoading(true);
    setError(null);
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/claim",
      errorCallbackURL: "/teaser?signin=failed",
    });
    // On success the browser is already navigating to Google.
    if (error) {
      setError("Google sign-in isn't available right now. Try again in a few minutes.");
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className={`tm-btn tm-btn-primary tm-btn-lg tm-btn-block is-elevated${loading ? " is-loading" : ""}`}
        onClick={start}
        disabled={loading}
        aria-busy={loading}
      >
        {loading && <span className="tm-spinner" aria-hidden="true" />}
        Continue with Google
      </button>
      {error && (
        <p className="dropzone-error" role="alert">
          <CircleAlert size={16} strokeWidth={1.5} aria-hidden="true" />
          {error}
        </p>
      )}
    </>
  );
}
