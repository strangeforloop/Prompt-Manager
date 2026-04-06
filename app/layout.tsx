import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PromptVault",
  description: "Manage and organize your AI prompts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
