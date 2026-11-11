import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GÖDEL HYPERCHIP · Quantum Persistent Memory · Aumnium Technology",
  description:
    "Photorealistic interactive render of the AUMNIUM GÖDEL Hyperchip — a quantum persistent memory PCIe carrier featuring a YIG magnonic core, Si3N4 photonic mesh, DFB laser bank, and UQB+RQB non-ergodic memory substrate.",
  keywords: [
    "AUMNIUM",
    "GÖDEL Hyperchip",
    "Quantum Memory",
    "Non-ergodic",
    "YIG",
    "Photonic",
    "PCIe",
    "Aumnium Technology",
  ],
  authors: [{ name: "Aumnium Technology Pvt Ltd" }],
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
