import { Logo } from "@/components/ui/Logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg-cream flex flex-col items-center justify-center p-6 font-sans selection:bg-patron-gold/20">
      <div className="mb-8">
        <Logo width={260} height={51} />
      </div>
      {children}
    </div>
  );
}
