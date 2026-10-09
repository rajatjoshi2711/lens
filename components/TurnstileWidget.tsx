"use client";

import Script from "next/script";
import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export type TurnstileHandle = { reset: () => void };

type Props = {
  siteKey: string;
  onToken: (token: string | null) => void;
  /** Called with a candidate-facing message when the widget cannot run. */
  onError: (message: string | null) => void;
  ref?: Ref<TurnstileHandle>;
};

/**
 * Cloudflare Turnstile, rendered explicitly so the page knows when a token
 * is ready, expired, or failed. Invisible unless Cloudflare needs a click.
 */
export function TurnstileWidget({ siteKey, onToken, onError, ref }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);

  const render = useCallback(() => {
    if (!window.turnstile || !container.current || widgetId.current) return;
    widgetId.current = window.turnstile.render(container.current, {
      sitekey: siteKey,
      appearance: "interaction-only",
      "refresh-expired": "auto",
      callback: (token: string) => {
        onError(null);
        onToken(token);
      },
      "expired-callback": () => onToken(null),
      "error-callback": (code: string) => {
        onToken(null);
        // 110200: this domain is not on the widget's hostname list.
        console.warn(`[turnstile] widget error ${code}`);
        onError("We couldn't run the browser check. Refresh the page and try again.");
        return true; // Handled; stops Cloudflare logging it again.
      },
    });
  }, [siteKey, onToken, onError]);

  useEffect(() => {
    // The script may already be loaded from an earlier page visit.
    if (scriptReady || window.turnstile) render();
    return () => {
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = null;
    };
  }, [scriptReady, render]);

  useImperativeHandle(ref, () => ({
    reset: () => {
      onToken(null);
      if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current);
    },
  }));

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onError={() => onError("We couldn't load the browser check. Check your connection or ad blocker, then refresh.")}
      />
      <div ref={container} className="turnstile-slot" />
    </>
  );
}
