import LearnedWords from "@/components/LearnedWords";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "已学习词汇 - OpenWords",
};

export default function LearnedPage() {
  return (
    <main className="min-h-screen">
      <LearnedWords />
    </main>
  );
}
