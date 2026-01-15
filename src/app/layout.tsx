import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";

export const metadata: Metadata = {
  title: "Abo - Ton copilote abonnements",
  description: "CRM pour solopreneurs et créateurs de SaaS qui gèrent des abonnements via Stripe",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="bg-gray-50 antialiased font-sans">
        <Navigation />
        <main className="pb-20 md:pb-0 md:pl-64 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
