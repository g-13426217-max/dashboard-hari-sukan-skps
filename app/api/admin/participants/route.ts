import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/admin-auth";
import {
  addParticipants,
  getDashboardData,
  saveParticipantPhoto,
} from "@/lib/data";

const schema = z.object({
  houseId: z.coerce.number().int().positive(),
  entries: z
    .array(
      z.object({
        name: z.string().trim().min(2).max(80),
        className: z.string().trim().max(40).nullable(),
      }),
    )
    .min(1)
    .max(300),
});

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Akses admin diperlukan." }, { status: 403 });
  }

  try {
    const input = schema.parse(await request.json());
    await addParticipants(input.houseId, input.entries);
    return NextResponse.json(await getDashboardData(), { status: 201 });
  } catch (error) {
    console.error("participants_create_failed", error);
    return NextResponse.json(
      { error: "Senarai nama tidak dapat disimpan. Semak format setiap baris." },
      { status: 400 },
    );
  }
}

export async function PATCH(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Akses admin diperlukan." }, { status: 403 });
  }

  try {
    const form = await request.formData();
    const participantId = z.coerce.number().int().positive().parse(form.get("participantId"));
    const file = form.get("photo");
    if (!(file instanceof File)) throw new Error("Fail PNG diperlukan.");
    await saveParticipantPhoto(participantId, file);
    return NextResponse.json(await getDashboardData());
  } catch (error) {
    console.error("participant_photo_upload_failed", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Gambar peserta tidak dapat dimuat naik.",
      },
      { status: 400 },
    );
  }
}
