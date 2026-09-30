"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarPlus,
  ChevronLeft,
  House,
  ImagePlus,
  Medal,
  Plus,
  Save,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Toaster } from "@/components/ui/sonner";
import type { DashboardData, SportsEvent } from "@/lib/data";

const statusLabels: Record<SportsEvent["status"], string> = {
  belum_mula: "Belum mula",
  sedang_berlangsung: "Sedang berlangsung",
  selesai: "Selesai",
};

async function sendJson(path: string, method: "POST" | "PATCH", body: unknown) {
  const response = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = (await response.json()) as DashboardData & { error?: string };
  if (!response.ok) throw new Error(result.error ?? "Tindakan tidak berjaya.");
  return result as DashboardData;
}

export function AdminDashboard({
  initialData,
  adminName,
}: {
  initialData: DashboardData;
  adminName: string;
}) {
  const [data, setData] = useState(initialData);
  const [busy, setBusy] = useState(false);
  const [uploadingParticipantId, setUploadingParticipantId] = useState<number | null>(null);
  const [houseId, setHouseId] = useState(String(initialData.houses[0]?.id ?? ""));
  const [bulkNames, setBulkNames] = useState("");
  const [resultEventId, setResultEventId] = useState(
    String(initialData.events[0]?.id ?? ""),
  );
  const [participantId, setParticipantId] = useState(
    String(initialData.participants[0]?.id ?? ""),
  );
  const [position, setPosition] = useState("1");
  const [points, setPoints] = useState("5");

  const parsedEntries = useMemo(
    () =>
      bulkNames
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [name, className] = line.split(/[,\t]/).map((part) => part.trim());
          return { name, className: className || null };
        })
        .filter((entry) => entry.name.length >= 2),
    [bulkNames],
  );

  function updatePosition(value: string) {
    setPosition(value);
    const pointMap: Record<string, string> = { "1": "5", "2": "3", "3": "2", "4": "1" };
    setPoints(pointMap[value] ?? "0");
  }

  async function run(action: () => Promise<DashboardData>, success: string) {
    setBusy(true);
    try {
      const updated = await action();
      setData(updated);
      toast.success(success);
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Tindakan tidak berjaya.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (
            tool: {
              name: string;
              title: string;
              description: string;
              inputSchema: object;
              annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
              execute: (input: unknown) => Promise<unknown>;
            },
            options: { signal: AbortSignal },
          ) => void | Promise<void>;
        };
      }
    ).modelContext;
    if (!context?.registerTool) return;

    const lifecycle = new AbortController();
    void Promise.resolve(
      context.registerTool(
        {
          name: "add_sports_participants_bulk",
          title: "Tambah peserta secara pukal",
          description:
            "Tambah beberapa peserta ke dalam satu rumah sukan menggunakan nama dan kelas pilihan.",
          inputSchema: {
            type: "object",
            properties: {
              houseId: { type: "integer", minimum: 1 },
              entries: {
                type: "array",
                minItems: 1,
                maxItems: 300,
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string", minLength: 2 },
                    className: { type: ["string", "null"] },
                  },
                  required: ["name", "className"],
                  additionalProperties: false,
                },
              },
            },
            required: ["houseId", "entries"],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          async execute(input) {
            const updated = await sendJson(
              "/api/admin/participants",
              "POST",
              input,
            );
            setData(updated);
            return { totalParticipants: updated.stats.totalParticipants };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => undefined);

    void Promise.resolve(
      context.registerTool(
        {
          name: "record_sports_result",
          title: "Rekod keputusan acara",
          description:
            "Rekod kedudukan dan mata peserta untuk satu acara Hari Sukan.",
          inputSchema: {
            type: "object",
            properties: {
              eventId: { type: "integer", minimum: 1 },
              participantId: { type: "integer", minimum: 1 },
              position: { type: "integer", minimum: 1, maximum: 20 },
              points: { type: "integer", minimum: 0, maximum: 100 },
            },
            required: ["eventId", "participantId", "position", "points"],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          async execute(input) {
            const updated = await sendJson("/api/admin/results", "POST", input);
            setData(updated);
            return { recorded: true, totalResults: updated.stats.totalResults };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => undefined);

    return () => lifecycle.abort();
  }, []);

  async function submitParticipants(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!houseId || !parsedEntries.length) {
      toast.error("Pilih rumah sukan dan masukkan sekurang-kurangnya satu nama.");
      return;
    }
    const success = await run(
      () =>
        sendJson("/api/admin/participants", "POST", {
          houseId: Number(houseId),
          entries: parsedEntries,
        }),
      `${parsedEntries.length} peserta berjaya ditambah.`,
    );
    if (success) setBulkNames("");
  }

  async function submitEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const success = await run(
      () =>
        sendJson("/api/admin/events", "POST", {
          name: form.get("name"),
          category: form.get("category"),
          status: form.get("status"),
        }),
      "Acara berjaya ditambah.",
    );
    if (success) event.currentTarget.reset();
  }

  async function submitResult(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run(
      () =>
        sendJson("/api/admin/results", "POST", {
          eventId: Number(resultEventId),
          participantId: Number(participantId),
          position: Number(position),
          points: Number(points),
        }),
      "Keputusan berjaya direkodkan dan markah dikemas kini.",
    );
  }

  async function uploadParticipantPhoto(participantId: number, file?: File) {
    if (!file) return;
    if (file.type !== "image/png") {
      toast.error("Sila pilih gambar dalam format PNG.");
      return;
    }

    setUploadingParticipantId(participantId);
    try {
      const form = new FormData();
      form.set("participantId", String(participantId));
      form.set("photo", file);
      const response = await fetch("/api/admin/participants", {
        method: "PATCH",
        body: form,
      });
      const result = (await response.json()) as DashboardData & { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Gambar tidak dapat dimuat naik.");
      setData(result);
      toast.success("Gambar peserta berjaya disimpan.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gambar tidak dapat dimuat naik.");
    } finally {
      setUploadingParticipantId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--stadium)] text-slate-950">
      <Toaster position="top-right" richColors />
      <div className="scoreboard-ribbon" aria-hidden="true" />
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1350px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
              <img
                src="/skps-logo-512.png"
                alt="Logo Sekolah Kebangsaan Pulau Sibu"
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <p className="text-[0.7rem] font-black uppercase tracking-[0.15em] text-cyan-700">
                Pengurusan data
              </p>
              <h1 className="text-lg font-black tracking-tight text-slate-900 sm:text-xl">
                Admin Hari Sukan
              </h1>
            </div>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard awam</span>
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1350px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <section className="mb-6 rounded-3xl bg-[#071831] p-5 text-white shadow-xl shadow-slate-900/10 sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-bold text-cyan-300">Log masuk sebagai</p>
              <h2 className="mt-1 text-xl font-black tracking-tight">{adminName}</h2>
            </div>
            <div className="flex flex-wrap gap-2 text-sm font-bold">
              <span className="rounded-xl bg-white/10 px-3 py-2">{data.houses.length} rumah</span>
              <span className="rounded-xl bg-white/10 px-3 py-2">{data.stats.totalParticipants} peserta</span>
              <span className="rounded-xl bg-white/10 px-3 py-2">{data.stats.totalEvents} acara</span>
            </div>
          </div>
        </section>

        <Tabs defaultValue="participants" className="gap-5">
          <div className="overflow-x-auto pb-1">
            <TabsList className="h-auto min-w-max rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
              <TabsTrigger value="houses" className="rounded-xl px-4 py-2.5 font-bold">
                <House /> Rumah sukan
              </TabsTrigger>
              <TabsTrigger value="participants" className="rounded-xl px-4 py-2.5 font-bold">
                <UsersRound /> Nama murid
              </TabsTrigger>
              <TabsTrigger value="events" className="rounded-xl px-4 py-2.5 font-bold">
                <CalendarPlus /> Acara
              </TabsTrigger>
              <TabsTrigger value="results" className="rounded-xl px-4 py-2.5 font-bold">
                <Medal /> Keputusan
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="houses">
            <Panel
              title="Dua rumah rasmi"
              description="Dashboard ditetapkan kepada Wira Biru dan Satria Merah. Markah dikira secara automatik daripada keputusan."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                {data.houses.map((house, index) => (
                  <article
                    key={house.id}
                    className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <span
                      className="absolute inset-x-0 top-0 h-1.5"
                      style={{ backgroundColor: house.color }}
                    />
                    <div className="flex items-center gap-4">
                      <div className="grid h-24 w-24 shrink-0 place-items-center rounded-2xl bg-white p-2 shadow-sm">
                        {house.logoUrl ? (
                          <img src={house.logoUrl} alt={`Logo ${house.name}`} className="h-full w-full object-contain" />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Kedudukan #{index + 1}</p>
                        <h3 className="mt-1 truncate text-xl font-black text-slate-900">{house.name}</h3>
                        <p className="mt-1 text-sm font-bold" style={{ color: house.color }}>
                          {house.shortCode} · {house.participants} peserta
                        </p>
                        <p className="mt-3 text-2xl font-black tabular-nums text-slate-900">{house.points} mata</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </Panel>
          </TabsContent>

          <TabsContent value="participants">
            <AdminGrid>
              <Panel title="Masukkan nama secara pukal" description="Satu baris untuk seorang murid. Gunakan format Nama, Kelas.">
                <form onSubmit={submitParticipants} className="space-y-4">
                  <Field label="Rumah sukan">
                    <Select value={houseId} onValueChange={setHouseId}>
                      <SelectTrigger className="h-11 w-full rounded-xl bg-white">
                        <SelectValue placeholder="Pilih rumah sukan" />
                      </SelectTrigger>
                      <SelectContent>
                        {data.houses.map((house) => <SelectItem key={house.id} value={String(house.id)}>{house.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Senarai nama">
                    <Textarea value={bulkNames} onChange={(event) => setBulkNames(event.target.value)} rows={10} className="min-h-64 rounded-xl bg-white font-medium leading-7" placeholder={"Nur Aisyah, Tahun 4\nSiti Hajar, Tahun 5\nNur Balqis, Tahun 6"} />
                  </Field>
                  <div className="flex items-center justify-between rounded-xl bg-cyan-50 px-4 py-3 text-sm font-bold text-cyan-800">
                    <span>{parsedEntries.length} nama dikesan</span>
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <Button disabled={busy || !parsedEntries.length} size="lg" className="w-full rounded-xl font-bold">
                    <Save /> Simpan semua nama
                  </Button>
                </form>
              </Panel>
              <Panel title="Senarai peserta" description={`${data.stats.totalParticipants} murid telah didaftarkan.`}>
                <div className="max-h-[570px] space-y-2 overflow-y-auto pr-1">
                  {data.participants.map((participant) => (
                    <div key={participant.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3">
                      <ParticipantAvatar
                        name={participant.name}
                        photoUrl={participant.photoUrl}
                        color={participant.houseColor}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-slate-900">{participant.name}</p>
                        <p className="truncate text-sm text-slate-500">{participant.className ?? "Kelas belum ditetapkan"} · {participant.houseName}</p>
                      </div>
                      <label className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
                        <ImagePlus className="h-4 w-4" />
                        <span className="hidden sm:inline">
                          {uploadingParticipantId === participant.id ? "Memuat naik…" : participant.photoUrl ? "Tukar PNG" : "Tambah PNG"}
                        </span>
                        <input
                          type="file"
                          accept="image/png"
                          className="sr-only"
                          disabled={uploadingParticipantId !== null}
                          onChange={(event) => {
                            void uploadParticipantPhoto(participant.id, event.target.files?.[0]);
                            event.currentTarget.value = "";
                          }}
                        />
                      </label>
                    </div>
                  ))}
                </div>
              </Panel>
            </AdminGrid>
          </TabsContent>

          <TabsContent value="events">
            <AdminGrid>
              <Panel title="Tambah acara" description="Nama acara dan kategori boleh diubah mengikut kejohanan.">
                <form onSubmit={submitEvent} className="space-y-4">
                  <Field label="Nama acara">
                    <Input name="name" placeholder="Contoh: Lari 80 Meter" required minLength={2} />
                  </Field>
                  <Field label="Kategori">
                    <Input name="category" placeholder="Contoh: Perempuan Bawah 10" required minLength={2} />
                  </Field>
                  <Field label="Status awal">
                    <Select name="status" defaultValue="belum_mula">
                      <SelectTrigger className="h-11 w-full rounded-xl bg-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Button disabled={busy} size="lg" className="w-full rounded-xl font-bold"><Plus /> Tambah acara</Button>
                </form>
              </Panel>
              <Panel title="Acara sedia ada" description="Tukar status untuk dipaparkan pada dashboard langsung.">
                <div className="space-y-3">
                  {data.events.map((sportsEvent) => (
                    <div key={sportsEvent.id} className="rounded-2xl border border-slate-200 p-4">
                      <div className="mb-3">
                        <p className="font-black text-slate-900">{sportsEvent.name}</p>
                        <p className="text-sm font-medium text-slate-500">{sportsEvent.category}</p>
                      </div>
                      <Select value={sportsEvent.status} onValueChange={(status) => run(() => sendJson("/api/admin/events", "PATCH", { id: sportsEvent.id, status }), "Status acara dikemas kini.")}>
                        <SelectTrigger className="h-10 w-full rounded-xl bg-white"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </Panel>
            </AdminGrid>
          </TabsContent>

          <TabsContent value="results">
            <AdminGrid>
              <Panel title="Rekod keputusan" description="Mata rumah dikira terus selepas keputusan disimpan.">
                <form onSubmit={submitResult} className="space-y-4">
                  <Field label="Acara">
                    <Select value={resultEventId} onValueChange={setResultEventId}>
                      <SelectTrigger className="h-11 w-full rounded-xl bg-white"><SelectValue placeholder="Pilih acara" /></SelectTrigger>
                      <SelectContent>{data.events.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name} · {item.category}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="Peserta">
                    <Select value={participantId} onValueChange={setParticipantId}>
                      <SelectTrigger className="h-11 w-full rounded-xl bg-white"><SelectValue placeholder="Pilih peserta" /></SelectTrigger>
                      <SelectContent>{data.participants.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name} · {item.houseName}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Kedudukan">
                      <Select value={position} onValueChange={updatePosition}>
                        <SelectTrigger className="h-11 w-full rounded-xl bg-white"><SelectValue /></SelectTrigger>
                        <SelectContent>{[1, 2, 3, 4].map((item) => <SelectItem key={item} value={String(item)}>Tempat {item}</SelectItem>)}</SelectContent>
                      </Select>
                    </Field>
                    <Field label="Mata">
                      <Input type="number" min={0} max={100} value={points} onChange={(event) => setPoints(event.target.value)} required />
                    </Field>
                  </div>
                  <Button disabled={busy || !resultEventId || !participantId} size="lg" className="w-full rounded-xl font-bold"><Medal /> Simpan keputusan</Button>
                </form>
              </Panel>
              <Panel title="Keputusan terkini" description="Rekod terbaru muncul dahulu.">
                <div className="space-y-2">
                  {data.recentResults.map((result) => (
                    <div key={result.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border border-slate-200 p-3">
                      <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-100 font-black text-amber-700">{result.position}</div>
                      <div className="min-w-0">
                        <p className="truncate font-bold text-slate-900">{result.participantName}</p>
                        <p className="truncate text-sm text-slate-500">{result.eventName}</p>
                      </div>
                      <p className="font-black tabular-nums text-cyan-700">+{result.points}</p>
                    </div>
                  ))}
                </div>
              </Panel>
            </AdminGrid>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

function ParticipantAvatar({
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

function AdminGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">{children}</div>;
}

function Panel({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_16px_45px_rgb(15_23_42/5%)] sm:p-6">
      <div className="mb-5">
        <h2 className="text-xl font-black tracking-tight text-slate-900">{title}</h2>
        <p className="mt-1 text-sm font-medium leading-6 text-slate-500">{description}</p>
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2 text-sm font-bold text-slate-700">
      <span>{label}</span>
      {children}
    </label>
  );
}
