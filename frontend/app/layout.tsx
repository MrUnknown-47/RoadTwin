import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RoadTwin AI — Highway Safety Digital Twin Command Center",
  description: "Dynamic AI-powered digital twin for real-time accident prevention & emergency mobility on Yamuna Expressway.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0B1120] text-slate-100 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
