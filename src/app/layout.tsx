import type { Metadata, Viewport } from "next";
import { Sora } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "LÍDER Treinamentos",
    template: "%s · LÍDER Treinamentos",
  },
  description:
    "Plataforma de treinamentos em Normas Regulamentadoras (NR) da LÍDER. Assista ao treinamento enviado pela sua empresa e emita seu certificado.",
  applicationName: "LÍDER Treinamentos",
};

export const viewport: Viewport = {
  themeColor: "#ba0e31",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#ba0e31",
          fontFamily: "var(--font-sora), system-ui, sans-serif",
        },
      }}
    >
      <html
        lang="pt-BR"
        className={`${sora.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col">{children}</body>
      </html>
    </ClerkProvider>
  );
}
