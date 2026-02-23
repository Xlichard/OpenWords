import DashboardContent from "@/components/DashboardContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "学习进度 - OpenWords",
};

export default function DashboardPage() {
  return (
    <main className="min-h-screen">
      <DashboardContent />
    </main>
  );
}
