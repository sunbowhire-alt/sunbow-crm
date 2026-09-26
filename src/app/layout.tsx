import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sunbow CRM",
  description: "Sales, customers and manufacturing management for Sunbow Tents Manufacture.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
