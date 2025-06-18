import { useSyncExternalStore } from "react";

const MOBILE_BREAKPOINT = 768;

function subscribe(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
  mql.addEventListener("change", callback);
  return () => {
    window.removeEventListener("change", callback);
  };
}

function getSnapshot() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.innerWidth < MOBILE_BREAKPOINT;
}

export function useIsMobile() {
  const isMobile = useSyncExternalStore(subscribe, getSnapshot, () => false);

  return isMobile;
}
