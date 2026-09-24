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
 * The supplied Talent Muscle lockup (raster, includes "An EmergeFlow Company").
 * Never recolour, stretch, crop, or redraw it.
 */
export function Logo({ onSecretTrigger }: LogoProps) {
  const burst = useRef(createClickBurst(ADMIN_CLICK_COUNT, ADMIN_CLICK_WINDOW_MS));

  return (
    <button
      type="button"
      className="logo-button"
      aria-label="Talent Muscle, an EmergeFlow company"
      onClick={() => {
        if (burst.current.click(Date.now())) onSecretTrigger?.();
      }}
    >
      <span className="logo-lockup">
        <Image
          src="/brand/logo-horizontal.png"
          alt=""
          width={1319}
          height={465}
          priority
        />
      </span>
    </button>
  );
}
