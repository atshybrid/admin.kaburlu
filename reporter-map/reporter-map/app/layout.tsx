import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Telangana Reporter Coverage Map",
  description: "District & mandal-wise reporter coverage",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="te">
      <body>{children}</body>
    </html>
  );
}
