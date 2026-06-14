import { KarmaNavbar } from '@/components/KarmaNavbar';

export default function KarmaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <KarmaNavbar />
      <main className="flex-1 pb-20">
        {children}
      </main>
    </div>
  );
}
