import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/admin-auth";
import {
  createEvent,
  getDashboardData,
  updateEventStatus,
} from "@/lib/data";

const statusSchema = z.enum(["belum_mula", "sedang_berlangsung", "selesai"]);

const createSchema = z.object({
  name: z.string().trim().min(2).max(80),
  category: z.string().trim().min(2).max(80),
  status: statusSchema.default("belum_mula"),
});

const updateSchema = z.object({
  id: z.coerce.number().int().positive(),
  status: statusSchema,
});

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Akses admin diperlukan." }, { status: 403 });
  }
  try {
    await createEvent(createSchema.parse(await request.json()));
    return NextResponse.json(await getDashboardData(), { status: 201 });
  } catch (error) {
    console.error("event_create_failed", error);
    return NextResponse.json(
      { error: "Acara tidak dapat ditambah. Lengkapkan nama dan kategori." },
      { status: 400 },
    );
  }
}

export async function PATCH(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Akses admin diperlukan." }, { status: 403 });
  }
  try {
    const input = updateSchema.parse(await request.json());
    await updateEventStatus(input.id, input.status);
    return NextResponse.json(await getDashboardData());
  } catch (error) {
    console.error("event_update_failed", error);
    return NextResponse.json(
      { error: "Status acara tidak dapat dikemas kini." },
      { status: 400 },
    );
  }
}
