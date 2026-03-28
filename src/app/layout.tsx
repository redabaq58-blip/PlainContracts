import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { Toaster } from "@/components/ui/Toaster";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "PlainContracts — Understand Any Contract in 15 Seconds",
  description:
    "Paste your contract and know exactly what you're agreeing to. 6 plain-language outputs including red flags, obligations, negotiation emails, and key dates. Free. No sign-up.",
  openGraph: {
    title: "PlainContracts — Understand Any Contract in 15 Seconds",
    description:
      "Paste your contract and know exactly what you're agreeing to. Free contract translation tool powered by Claude AI.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
