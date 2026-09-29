"use client";

import Image from "next/image";
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
 * The Lens by Talent Muscle lockup (raster). Never recolour, stretch, or redraw it.
 * Clicking it returns home; 8 rapid clicks open the admin sign-in instead.
 */
export function Logo({ onSecretTrigger }: LogoProps) {
  const burst = useRef(createClickBurst(ADMIN_CLICK_COUNT, ADMIN_CLICK_WINDOW_MS));

  return (
    <button
      type="button"
      className="logo-button"
      aria-label="Lens by Talent Muscle"
      onClick={() => {
        if (burst.current.click(Date.now())) onSecretTrigger?.();
      }}
    >
      <Image
        src="/brand/lens-logo.png"
        alt=""
        width={665}
        height={320}
        className="logo-lens"
        sizes="140px"
        loading="eager"
      />
    </button>
  );
}
