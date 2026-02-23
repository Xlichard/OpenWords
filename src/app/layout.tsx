import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenWords - 开源背单词",
  description:
    "开源背单词应用，支持四六级/考研/雅思/托福/GRE/医学词汇，基于间隔重复记忆算法",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased bg-gray-50 dark:bg-gray-900 min-h-screen">
        {/* Navigation */}
        <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link
              href="/"
              className="text-lg font-bold text-gray-900 dark:text-white hover:opacity-80 transition-opacity"
            >
              OpenWords
            </Link>
            <div className="flex items-center gap-6">
              <Link
                href="/"
                className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
              >
                词库
              </Link>
              <Link
                href="/custom/new"
                className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
              >
                自定义
              </Link>
              <Link
                href="/dashboard"
                className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
              >
                进度
              </Link>
            </div>
          </div>
        </nav>

        {children}
      </body>
    </html>
  );
}
