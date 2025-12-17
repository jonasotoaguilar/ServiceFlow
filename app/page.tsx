import { WarrantyDashboard } from "@/components/WarrantyDashboard";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <WarrantyDashboard />
      </div>
    </main>
  );
}
