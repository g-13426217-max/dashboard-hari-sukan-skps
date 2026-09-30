import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/admin-auth";
import { createResult, getDashboardData } from "@/lib/data";

const schema = z.object({
  eventId: z.coerce.number().int().positive(),
  participantId: z.coerce.number().int().positive(),
  position: z.coerce.number().int().min(1).max(20),
  points: z.coerce.number().int().min(0).max(100),
});

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Akses admin diperlukan." }, { status: 403 });
  }
  try {
    await createResult(schema.parse(await request.json()));
    return NextResponse.json(await getDashboardData(), { status: 201 });
  } catch (error) {
    console.error("result_create_failed", error);
    return NextResponse.json(
      { error: "Keputusan tidak dapat disimpan. Semak acara dan peserta." },
      { status: 400 },
    );
  }
}
