"use client";

import { useRef } from "react";
import {
  ADMIN_CLICK_COUNT,
  ADMIN_CLICK_WINDOW_MS,
  createClickBurst,
} from "@/lib/click-burst";

type LogoProps = {
  /** Called after 8 rapid clicks on the logo (hidden admin entry). */
  onSecretTrigger?: () => void;
};

/**
 * Text wordmark placeholder. Replace with the official logo file from
 * public/logo/ once supplied; do not draw a stand-in mark.
 */
export function Logo({ onSecretTrigger }: LogoProps) {
  const burst = useRef(createClickBurst(ADMIN_CLICK_COUNT, ADMIN_CLICK_WINDOW_MS));

  return (
    <button
      type="button"
      className="logo-button"
      aria-label="Lens home"
      onClick={() => {
        if (burst.current.click(Date.now())) onSecretTrigger?.();
      }}
    >
      <span className="logo-wordmark">
        Lens <span>by Talent Muscle</span>
      </span>
    </button>
  );
}
