"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function GamePoller() {
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 2000);

    return () => clearInterval(interval);
  }, [router]);

  return null;
}
