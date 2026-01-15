import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Abo - Ton copilote abonnements',
  description: 'CRM pour solopreneurs et créateurs de SaaS qui gèrent des abonnements via Stripe',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
