import CustomModuleUpload from "@/components/CustomModuleUpload";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "添加自定义词库 - OpenWords",
};

export default function CustomNewPage() {
  return (
    <main className="min-h-screen">
      <CustomModuleUpload />
    </main>
  );
}
