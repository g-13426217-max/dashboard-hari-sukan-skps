import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/admin-auth";
import { createHouse, getDashboardData } from "@/lib/data";

const schema = z.object({
  name: z.string().trim().min(2).max(40),
  shortCode: z.string().trim().min(2).max(5),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Akses admin diperlukan." }, { status: 403 });
  }

  try {
    const input = schema.parse(await request.json());
    await createHouse({ ...input, shortCode: input.shortCode.toUpperCase() });
    return NextResponse.json(await getDashboardData(), { status: 201 });
  } catch (error) {
    console.error("house_create_failed", error);
    return NextResponse.json(
      { error: "Rumah sukan tidak dapat ditambah. Semak nama dan singkatan." },
      { status: 400 },
    );
  }
}
