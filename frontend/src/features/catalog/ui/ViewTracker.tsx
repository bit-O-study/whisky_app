"use client";

import { useEffect, useRef } from "react";

interface Props {
  liquorId: number;
}

const SESSION_KEY_PREFIX = "liquor-view-";

export default function ViewTracker({ liquorId }: Props) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    // Dedupe within a single browser session so reload/refresh doesn't double-count.
    // Anonymous-but-stable: scoped to sessionStorage so a fresh tab/visit DOES count again.
    try {
      const key = `${SESSION_KEY_PREFIX}${liquorId}`;
      if (window.sessionStorage.getItem(key)) return;
      window.sessionStorage.setItem(key, "1");
    } catch {
      // private mode etc — fall through and just always count
    }

    fetch(`/api/liquors/${liquorId}/view`, {
      method: "POST",
      keepalive: true,
    }).catch(() => undefined);
  }, [liquorId]);

  return null;
}
