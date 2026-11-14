import { useSyncExternalStore } from "react";

const KEY = "eduguard-theme";
const listeners = new Set<() => void>();

export const THEME_BOOT_SCRIPT = `try{if(localStorage.getItem("${KEY}")==="dark")document.documentElement.classList.add("dark")}catch(e){}`;

function isDark() {
  return typeof document !== "undefined" && document.documentElement.classList.contains("dark");
}

export function useDarkMode(): [boolean, () => void] {
  const dark = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    isDark,
    () => false,
  );
  const toggle = () => {
    const next = !isDark();
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem(KEY, next ? "dark" : "light");
    listeners.forEach((l) => l());
  };
  return [dark, toggle];
}
