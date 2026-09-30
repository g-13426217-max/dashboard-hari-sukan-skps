"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Medal,
  RefreshCw,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardData, SportsEvent } from "@/lib/data";

const statusLabels: Record<SportsEvent["status"], string> = {
  belum_mula: "Belum mula",
  sedang_berlangsung: "Sedang berlangsung",
  selesai: "Selesai",
};

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("ms-MY", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(iso));
}

function ordinal(position: number) {
  if (position === 1) return "Johan";
  if (position === 2) return "Naib Johan";
  if (position === 3) return "Ketiga";
  return `Ke-${position}`;
}

export function LiveDashboard({ initialData }: { initialData: DashboardData }) {
  const [data, setData] = useState(initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [offline, setOffline] = useState(false);

  async function refresh() {
    setRefreshing(true);
    try {
      const response = await fetch("/api/dashboard", { cache: "no-store" });
      if (!response.ok) throw new Error("Gagal memuatkan data");
      setData(await response.json());
      setOffline(false);
    } catch {
      setOffline(true);
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    const interval = window.setInterval(refresh, 8000);
    return () => window.clearInterval(interval);
  }, []);

  const maxPoints = useMemo(
    () => Math.max(...data.houses.map((house) => house.points), 1),
    [data.houses],
  );
  const liveEvent = data.events.find(
    (event) => event.status === "sedang_berlangsung",
  );

  return (
    <main className="min-h-screen bg-[var(--stadium)] text-slate-950">
      <div className="scoreboard-ribbon" aria-hidden="true" />
      <header className="sports-hero relative isolate overflow-hidden border-b border-white/10 text-white">
        <div className="relative z-10 mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-white/25 bg-white/95 p-1.5 shadow-[0_10px_35px_rgb(0_0_0/28%)] sm:h-16 sm:w-16">
              <img
                src="/skps-logo-512.png"
                alt="Logo Sekolah Kebangsaan Pulau Sibu"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[0.72rem] font-bold uppercase tracking-[0.16em] text-cyan-300">
                SK Pulau Sibu
              </p>
              <h1 className="truncate text-xl font-black tracking-tight drop-shadow-lg sm:text-3xl">
                Dashboard Hari Sukan
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              disabled={refreshing}
              aria-label="Muat semula keputusan"
              className="grid h-11 w-11 place-items-center rounded-xl border border-white/15 bg-white/8 transition hover:bg-white/15 disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
            </button>
            <Link
              href="/admin"
              className="hidden items-center gap-2 rounded-xl border border-white/15 bg-white/8 px-4 py-2.5 text-sm font-bold transition hover:bg-white/15 sm:flex"
            >
              <ShieldCheck className="h-4 w-4" />
              Admin
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-[1.5fr_repeat(3,1fr)]">
          <div
            className={`relative overflow-hidden rounded-2xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-white p-5 shadow-sm ${liveEvent ? "live-event-spotlight" : ""}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.12em] text-cyan-700">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${offline ? "bg-amber-500" : "animate-pulse bg-emerald-500"}`}
                  />
                  {offline ? "Sambungan terganggu" : "Papan skor langsung"}
                </div>
                <p className="text-xl font-black tracking-tight text-slate-900">
                  {liveEvent
                    ? liveEvent.name
                    : "Tiada acara sedang berlangsung"}
                </p>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  {liveEvent?.category ??
                    `Dikemas kini ${formatTime(data.updatedAt)}`}
                </p>
              </div>
              <div className={liveEvent ? "live-activity-orbit" : ""}>
                <Activity className="h-7 w-7 shrink-0 text-cyan-600" />
              </div>
            </div>
            {liveEvent ? (
              <span className="live-status-pill mt-4 inline-flex items-center gap-2 rounded-full bg-red-600 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-white">
                <span className="h-2 w-2 rounded-full bg-white" />
                Live sekarang
              </span>
            ) : null}
          </div>
          <StatCard
            icon={<Users />}
            label="Jumlah peserta"
            value={data.stats.totalParticipants}
          />
          <StatCard
            icon={<CalendarClock />}
            label="Jumlah acara"
            value={data.stats.totalEvents}
          />
          <StatCard
            icon={<CheckCircle2 />}
            label="Acara selesai"
            value={data.stats.completedEvents}
          />
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_16px_45px_rgb(15_23_42/6%)] sm:p-6">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="section-kicker">Kedudukan semasa</p>
                <h2 className="section-title">Carta rumah sukan</h2>
              </div>
              <Trophy className="h-7 w-7 text-amber-500" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {data.houses.map((house, index) => (
                <article
                  key={house.id}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/80 p-4 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
                >
                  <div
                    className="absolute inset-y-0 left-0 w-1.5"
                    style={{ backgroundColor: house.color }}
                  />
                  <div className="flex items-start justify-between gap-4 pl-2">
                    <div className="flex min-w-0 items-center gap-3">
                      {house.logoUrl ? (
                        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white p-1.5 shadow-sm">
                          <img src={house.logoUrl} alt={`Logo ${house.name}`} className="h-full w-full object-contain" />
                        </div>
                      ) : null}
                      <div className="min-w-0">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-sm font-black text-slate-400">
                          #{index + 1}
                        </span>
                        <span className="rounded-md bg-white px-2 py-0.5 text-[0.7rem] font-black tracking-wider text-slate-500 shadow-sm">
                          {house.shortCode}
                        </span>
                      </div>
                      <h3 className="truncate text-lg font-black text-slate-900">
                        {house.name}
                      </h3>
                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        {house.participants} peserta · {house.gold} emas
                      </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className="text-3xl font-black tabular-nums tracking-tight"
                        style={{ color: house.color }}
                      >
                        {house.points}
                      </p>
                      <p className="text-[0.68rem] font-black uppercase tracking-widest text-slate-400">
                        mata
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${(house.points / maxPoints) * 100}%`,
                        backgroundColor: house.color,
                      }}
                    />
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-[#071831] p-4 text-white shadow-[0_16px_45px_rgb(7_24_49/18%)] sm:p-6">
            <div className="mb-4">
              <p className="section-kicker text-cyan-300">Perbandingan mata</p>
              <h2 className="section-title text-white">Momentum pertandingan</h2>
            </div>
            <div
              className="h-[292px] w-full"
              aria-label="Graf bar mata rumah sukan"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.houses}
                  margin={{ top: 20, right: 4, left: -20, bottom: 2 }}
                >
                  <CartesianGrid
                    stroke="rgba(255,255,255,.08)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="shortCode"
                    tick={{ fill: "#bae6fd", fontSize: 12, fontWeight: 800 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,.04)" }}
                    contentStyle={{
                      borderRadius: 12,
                      border: 0,
                      color: "#0f172a",
                      fontWeight: 700,
                    }}
                    formatter={(value) => [`${value} mata`, "Jumlah"]}
                  />
                  <Bar
                    dataKey="points"
                    radius={[8, 8, 2, 2]}
                    maxBarSize={58}
                  >
                    {data.houses.map((house) => (
                      <Cell key={house.id} fill={house.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_16px_45px_rgb(15_23_42/6%)] sm:p-6">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="section-kicker">Galeri kontinjen</p>
              <h2 className="section-title">Peserta mengikut rumah</h2>
            </div>
            <Users className="h-7 w-7 text-cyan-600" />
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            {data.houses.map((house) => {
              const houseParticipants = data.participants.filter(
                (participant) => participant.houseId === house.id,
              );
              return (
                <article
                  key={house.id}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50"
                >
                  <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-4 sm:px-5">
                    {house.logoUrl ? (
                      <img src={house.logoUrl} alt="" className="h-12 w-12 object-contain" />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-lg font-black text-slate-900">{house.name}</h3>
                      <p className="text-sm font-bold" style={{ color: house.color }}>
                        {houseParticipants.length} peserta
                      </p>
                    </div>
                  </div>
                  <div className="grid max-h-[360px] gap-2 overflow-y-auto p-3 sm:grid-cols-2 sm:p-4">
                    {houseParticipants.length ? (
                      houseParticipants.map((participant) => (
                        <div key={participant.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
                          <ParticipantPhoto
                            name={participant.name}
                            photoUrl={participant.photoUrl}
                            color={participant.houseColor}
                          />
                          <div className="min-w-0">
                            <p className="truncate font-black text-slate-900">{participant.name}</p>
                            <p className="truncate text-sm font-medium text-slate-500">
                              {participant.className ?? "Kelas belum ditetapkan"}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="col-span-full px-3 py-7 text-center text-sm font-medium text-slate-500">
                        Belum ada peserta untuk rumah ini.
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_16px_45px_rgb(15_23_42/6%)]">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6">
              <div>
                <p className="section-kicker">Keputusan rasmi</p>
                <h2 className="section-title">Keputusan terkini</h2>
              </div>
              <Medal className="h-6 w-6 text-amber-500" />
            </div>
            <div className="divide-y divide-slate-100">
              {data.recentResults.length ? (
                data.recentResults.slice(0, 8).map((result) => (
                  <div
                    key={result.id}
                    className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-5 py-4 sm:gap-4 sm:px-6"
                  >
                    <div className="relative">
                      <ParticipantPhoto
                        name={result.participantName}
                        photoUrl={result.participantPhotoUrl}
                        color={result.houseColor}
                      />
                      <span className="absolute -bottom-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-slate-950 px-1 text-[0.62rem] font-black text-white ring-2 ring-white">
                        {result.position}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="truncate font-black text-slate-900">
                          {result.participantName}
                        </span>
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: result.houseColor }}
                        />
                      </div>
                      <p className="truncate text-sm font-medium text-slate-500">
                        {result.eventName} · {ordinal(result.position)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-black tabular-nums text-slate-900">
                        +{result.points}
                      </p>
                      <p className="text-[0.68rem] font-bold uppercase tracking-wider text-slate-400">
                        mata
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="px-6 py-10 text-center font-medium text-slate-500">
                  Belum ada keputusan direkodkan.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_16px_45px_rgb(15_23_42/6%)] sm:p-6">
            <div className="mb-5">
              <p className="section-kicker">Atur cara</p>
              <h2 className="section-title">Senarai acara</h2>
            </div>
            <div className="space-y-3">
              {data.events.slice(0, 7).map((event, index) => (
                <div
                  key={event.id}
                  className={`flex items-center gap-3 rounded-2xl border border-slate-200 p-3.5 ${event.status === "sedang_berlangsung" ? "live-event-row" : ""}`}
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-sm font-black text-slate-600">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-black text-slate-900">
                      {event.name}
                    </p>
                    <p className="truncate text-sm font-medium text-slate-500">
                      {event.category}
                    </p>
                  </div>
                  <span
                    className={`hidden rounded-full px-2.5 py-1 text-[0.68rem] font-black uppercase tracking-wide sm:inline-flex ${
                      event.status === "selesai"
                        ? "bg-emerald-100 text-emerald-700"
                        : event.status === "sedang_berlangsung"
                          ? "live-status-pill bg-red-600 text-white"
                          : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {statusLabels[event.status]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="mt-6 flex flex-col gap-3 border-t border-slate-200 py-5 text-sm font-medium text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © 2026 SK Pulau Sibu · Data contoh boleh diganti melalui ruang
            admin.
          </p>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 font-bold text-cyan-700 sm:hidden"
          >
            Buka ruang admin <ChevronRight className="h-4 w-4" />
          </Link>
        </footer>
      </div>
    </main>
  );
}

function ParticipantPhoto({
  name,
  photoUrl,
  color,
}: {
  name: string;
  photoUrl: string | null;
  color: string;
}) {
  return (
    <div
      className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl border-2 bg-white text-sm font-black"
      style={{ borderColor: color, color }}
    >
      {photoUrl ? (
        <img src={photoUrl} alt={`Gambar ${name}`} className="h-full w-full object-cover" />
      ) : (
        name
          .split(/\s+/)
          .slice(0, 2)
          .map((part) => part[0])
          .join("")
          .toUpperCase()
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-500">{label}</p>
          <p className="mt-1 text-3xl font-black tabular-nums tracking-tight text-slate-900">
            {value}
          </p>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100 text-slate-600 [&>svg]:h-5 [&>svg]:w-5">
          {icon}
        </div>
      </div>
    </div>
  );
}
