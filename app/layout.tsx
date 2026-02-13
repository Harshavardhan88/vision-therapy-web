import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { GamifiedBackground } from "@/components/ui/gamified-background";
import { MagicCursor } from "@/components/ui/magic-cursor";

import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AmblyoCare | Advanced Vision Therapy",
  description: "AI-powered VR vision therapy platform for Amblyopia treatment.",
  keywords: ["vision therapy", "amblyopia", "VR", "eye tracking", "medical"],
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AmblyoCare",
  },
};

export const viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevent zooming in VR
  viewportFit: "cover", // CRITICAL: Use full screen including notch area
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.className} antialiased bg-slate-950`}
      >
        <Script
          src="https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js"
          strategy="beforeInteractive"
        />
        <Script
          src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js"
          strategy="beforeInteractive"
        />
        <GamifiedBackground />
        <MagicCursor />
        {children}
      </body>
    </html>
  );
}
