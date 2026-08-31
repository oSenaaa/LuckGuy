"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { useTheme } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: isDark ? "#e8506b" : "#ba0e31",
          fontFamily: "var(--font-sora), system-ui, sans-serif",
          borderRadius: "0.625rem",
          ...(isDark
            ? {
                colorBackground: "#1e1a1b",
                colorText: "#ededed",
                colorTextSecondary: "#a5a1a2",
                colorInputBackground: "#241f20",
                colorInputText: "#ededed",
                colorNeutral: "#ededed",
              }
            : {}),
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}
