"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { DailyStats, CardState } from "@/types";
import {
  getTodayStats,
  getRecentStats,
  getStreakDays,
  getAllCardStates,
} from "@/lib/storage";

function calcRetention(daysSinceReview: number, interval: number): number {
  if (interval <= 0) return 0;
  const stability = interval * 1.5;
  return Math.exp(-daysSinceReview / stability) * 100;
}

interface MemoryStage {
  label: string;
  count: number;
  color: string;
  gradientFrom: string;
  href: string;
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export default function DashboardContent() {
  const [todayLearned, setTodayLearned] = useState(0);
  const [todayReviewed, setTodayReviewed] = useState(0);
  const [streak, setStreak] = useState(0);
  const [totalLearned, setTotalLearned] = useState(0);
  const [recentStats, setRecentStats] = useState<DailyStats[]>([]);
  const [memoryStages, setMemoryStages] = useState<MemoryStage[]>([]);
  const [dueCount, setDueCount] = useState(0);
  const [avgRetention, setAvgRetention] = useState(0);
  const [curvePoints, setCurvePoints] = useState<{ day: number; retention: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const today = await getTodayStats();
        setTodayLearned(today.learned);
        setTodayReviewed(today.reviewed);

        const s = await getStreakDays();
        setStreak(s);

        const cards = await getAllCardStates();
        const learnedCards = cards.filter((c) => c.repetitions > 0);
        setTotalLearned(learnedCards.length);

        const recent = await getRecentStats(14);
        setRecentStats(recent);

        analyzeMemory(learnedCards);
      } catch (e) {
        console.error("加载数据失败:", e);
      } finally {
        setLoading(false);
      }
    }

    function analyzeMemory(cards: CardState[]) {
      const now = new Date();
      const nowStr = now.toISOString();
      let newCount = 0, shortCount = 0, longCount = 0, matureCount = 0;
      let due = 0;
      let totalRet = 0;

      for (const card of cards) {
        if (card.interval < 1) newCount++;
        else if (card.interval < 7) shortCount++;
        else if (card.interval < 30) longCount++;
        else matureCount++;

        if (card.nextReview <= nowStr) due++;

        const daysSince = (now.getTime() - new Date(card.lastReview).getTime()) / (1000 * 60 * 60 * 24);
        totalRet += calcRetention(daysSince, card.interval);
      }

      setDueCount(due);
      setAvgRetention(cards.length > 0 ? Math.round(totalRet / cards.length) : 0);

      setMemoryStages([
        { label: "新学", count: newCount, color: "text-blue-500", gradientFrom: "from-blue-500/10", href: "/dashboard/stage/new" },
        { label: "短期记忆", count: shortCount, color: "text-amber-500", gradientFrom: "from-amber-500/10", href: "/dashboard/stage/short" },
        { label: "长期记忆", count: longCount, color: "text-emerald-500", gradientFrom: "from-emerald-500/10", href: "/dashboard/stage/long" },
        { label: "已熟练", count: matureCount, color: "text-purple-500", gradientFrom: "from-purple-500/10", href: "/dashboard/stage/mature" },
      ]);

      const points: { day: number; retention: number }[] = [];
      for (let d = 0; d <= 30; d++) {
        points.push({ day: d, retention: Math.round(Math.exp(-d / 7) * 100) });
      }
      setCurvePoints(points);
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-mesh flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-sm text-gray-400 animate-pulse">加载中...</span>
        </div>
      </div>
    );
  }

  // Build full 14-day array
  const chartDays: DailyStats[] = [];
  const statsMap = new Map(recentStats.map((s) => [s.date, s]));
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    chartDays.push(statsMap.get(dateStr) ?? { date: dateStr, learned: 0, reviewed: 0 });
  }
  const maxDaily = Math.max(...chartDays.map((s) => s.learned + s.reviewed), 1);
  const totalNewLearned = chartDays.reduce((s, d) => s + d.learned, 0);
  const totalReviewCount = chartDays.reduce((s, d) => s + d.reviewed, 0);

  const stageBarColors = ["bg-blue-400", "bg-amber-400", "bg-emerald-400", "bg-purple-400"];

  return (
    <div className="min-h-screen bg-mesh">
      {/* Top gradient */}
      <div className="absolute top-0 left-0 right-0 h-72 bg-gradient-to-b from-blue-500/8 via-purple-500/5 to-transparent pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-fade-up">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              学习进度
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              坚持每天学习，养成好习惯
            </p>
          </div>
          <Link
            href="/"
            className="glass-card px-4 py-2 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-white/70 dark:hover:bg-white/10 transition-all"
          >
            ← 返回
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="今日新学" value={todayLearned} icon="📖" color="text-blue-500" glowColor="blue" href="/dashboard/today-learned" delay={0} />
          <StatCard label="今日复习" value={todayReviewed} icon="🔄" color="text-emerald-500" glowColor="emerald" href="/dashboard/today-reviewed" delay={1} />
          <StatCard label="连续打卡" value={streak} suffix="天" icon="🔥" color="text-orange-500" glowColor="orange" delay={2} />
          <StatCard label="累计已学" value={totalLearned} icon="📚" color="text-purple-500" glowColor="purple" href="/dashboard/learned" delay={3} />
        </div>

        {/* Ebbinghaus Memory Analysis */}
        <div className="glass-card rounded-2xl p-6 mb-8 animate-fade-up stagger-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-xl">🧠</span> 艾宾浩斯记忆分析
          </h2>

          {totalLearned === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="text-4xl mb-3 animate-float">🧠</div>
              <p>开始学习后将显示记忆分析</p>
            </div>
          ) : (
            <>
              {/* Retention & Due summary */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1 glass rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-blue-500">{avgRetention}%</div>
                  <div className="text-xs text-gray-500 mt-1">平均记忆保持率</div>
                </div>
                <div className="flex-1 glass rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-red-500">{dueCount}</div>
                  <div className="text-xs text-gray-500 mt-1">待复习单词</div>
                </div>
              </div>

              {/* Memory stages distribution - now links */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  记忆阶段分布
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {memoryStages.map((stage, i) => (
                    <Link
                      key={stage.label}
                      href={stage.href}
                      className={`glass rounded-xl p-3 text-center hover:scale-105 hover:shadow-lg transition-all duration-300 animate-scale-in`}
                      style={{ animationDelay: `${i * 0.08}s` }}
                    >
                      <div className={`text-xl font-bold ${stage.color}`}>{stage.count}</div>
                      <div className="text-xs text-gray-500 mt-1">{stage.label}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">点击查看 ›</div>
                    </Link>
                  ))}
                </div>
                {totalLearned > 0 && (
                  <div className="flex mt-3 rounded-full h-3 overflow-hidden glass">
                    {memoryStages.map((stage, i) => {
                      const width = (stage.count / totalLearned) * 100;
                      return (
                        <div
                          key={stage.label}
                          className={`${stageBarColors[i]} transition-all duration-700 ease-out`}
                          style={{ width: `${width}%` }}
                          title={`${stage.label}: ${stage.count}`}
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Ebbinghaus Forgetting Curve */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  艾宾浩斯遗忘曲线
                </h3>
                <div className="relative h-40 ml-10">
                  {/* Grid */}
                  <div className="absolute inset-0 border-l border-b border-gray-200/60 dark:border-gray-600/60">
                    <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-gray-200/50 dark:border-gray-700/50" />
                    <div className="absolute left-0 right-0 top-1/4 border-t border-dashed border-gray-200/30 dark:border-gray-700/30" />
                    <div className="absolute left-0 right-0 top-3/4 border-t border-dashed border-gray-200/30 dark:border-gray-700/30" />
                  </div>
                  {/* Y labels */}
                  <div className="absolute -left-9 top-0 text-xs text-gray-400">100%</div>
                  <div className="absolute -left-7 top-1/2 -translate-y-1/2 text-xs text-gray-400">50%</div>
                  <div className="absolute -left-5 bottom-0 text-xs text-gray-400">0%</div>
                  {/* SVG */}
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 160" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <polygon fill="url(#blueGrad)"
                      points="0,0 10,16 10,4 30,24 30,6 70,32 70,8 140,24 140,6 300,24 300,160 0,160" />
                    <polyline fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      points="0,0 10,16 10,4 30,24 30,6 70,32 70,8 140,24 140,6 300,24" />
                    <polyline fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="6 4" strokeLinecap="round"
                      points={curvePoints.map((p) => `${(p.day / 30) * 300},${160 - (p.retention / 100) * 160}`).join(" ")} />
                  </svg>
                  {/* X labels */}
                  <div className="absolute -bottom-5 left-0 text-xs text-gray-400">0天</div>
                  <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-gray-400">15天</div>
                  <div className="absolute -bottom-5 right-0 text-xs text-gray-400">30天</div>
                </div>
                <div className="flex gap-6 mt-8 text-xs text-gray-400 ml-10">
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-0.5 bg-blue-500 rounded-full inline-block" /> 间隔复习
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-0.5 inline-block rounded-full" style={{ borderTop: "2px dashed #ef4444" }} /> 不复习
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Activity Chart */}
        <div className="glass-card rounded-2xl p-6 animate-fade-up stagger-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="text-xl">📊</span> 最近 14 天
            </h2>
            <div className="flex gap-4 text-xs">
              <span className="glass px-3 py-1.5 rounded-full">新学 <strong className="text-blue-500">{totalNewLearned}</strong></span>
              <span className="glass px-3 py-1.5 rounded-full">复习 <strong className="text-emerald-500">{totalReviewCount}</strong></span>
            </div>
          </div>

          <div className="flex items-end gap-1.5 h-48 mt-2">
            {chartDays.map((stat, i) => {
              const total = stat.learned + stat.reviewed;
              const height = (total / maxDaily) * 100;
              const learnedPct = total > 0 ? (stat.learned / total) * 100 : 0;
              const dateLabel = stat.date.slice(5).replace("-", "/");
              const isToday = stat.date === todayStr();
              return (
                <div key={stat.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                  {/* Tooltip */}
                  <div className="absolute -top-16 left-1/2 -translate-x-1/2 glass bg-gray-900/90 dark:bg-gray-900/95 text-white text-xs rounded-xl px-3.5 py-2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-10 shadow-xl scale-90 group-hover:scale-100">
                    <div className="font-medium mb-0.5">{stat.date}</div>
                    <div className="flex gap-2">
                      <span className="text-blue-400">新学 {stat.learned}</span>
                      <span className="text-emerald-400">复习 {stat.reviewed}</span>
                    </div>
                  </div>
                  {/* Bar */}
                  <div
                    className="w-full rounded-lg overflow-hidden relative transition-all duration-500 ease-out group-hover:scale-x-110"
                    style={{
                      height: `${height}%`,
                      minHeight: total > 0 ? "8px" : "3px",
                      animationDelay: `${i * 0.05}s`,
                    }}
                  >
                    {total > 0 ? (
                      <>
                        <div className="bg-gradient-to-t from-blue-600 via-blue-500 to-blue-400 transition-all" style={{ height: `${learnedPct}%` }} />
                        <div className="bg-gradient-to-t from-emerald-600 via-emerald-500 to-emerald-400 transition-all" style={{ height: `${100 - learnedPct}%` }} />
                      </>
                    ) : (
                      <div className="w-full h-full bg-gray-200/60 dark:bg-gray-700/60 rounded-lg" />
                    )}
                  </div>
                  {/* Date label */}
                  {(i % 2 === 0 || isToday) ? (
                    <span className={`text-[10px] font-medium ${isToday ? "text-blue-500" : "text-gray-400"}`}>
                      {isToday ? "今天" : dateLabel}
                    </span>
                  ) : (
                    <span className="text-[10px] text-transparent select-none">.</span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex gap-4 mt-4 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-gradient-to-t from-blue-600 to-blue-400 inline-block" /> 新学
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-gradient-to-t from-emerald-600 to-emerald-400 inline-block" /> 复习
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  suffix,
  icon,
  color,
  glowColor,
  href,
  delay,
}: {
  label: string;
  value: number;
  suffix?: string;
  icon: string;
  color: string;
  glowColor: string;
  href?: string;
  delay: number;
}) {
  const glowMap: Record<string, string> = {
    blue: "hover:shadow-blue-500/15",
    emerald: "hover:shadow-emerald-500/15",
    orange: "hover:shadow-orange-500/15",
    purple: "hover:shadow-purple-500/15",
  };

  const content = (
    <div className={`glass-card rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${glowMap[glowColor] || ""} ${href ? "cursor-pointer" : ""} animate-fade-up stagger-${delay + 1}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        {href && (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-gray-400">
            <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      <div className={`text-3xl font-bold ${color} tracking-tight`}>
        {value}
        {suffix && <span className="text-sm font-normal ml-1 opacity-70">{suffix}</span>}
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 font-medium">{label}</div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}
