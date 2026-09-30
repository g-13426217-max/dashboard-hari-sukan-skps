import { getParticipantPhoto } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const participantId = Number(id);
  if (!Number.isInteger(participantId) || participantId <= 0) {
    return new Response("Gambar tidak ditemui.", { status: 404 });
  }

  const object = await getParticipantPhoto(participantId);
  if (!object) return new Response("Gambar tidak ditemui.", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("Content-Type", "image/png");
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  headers.set("ETag", object.httpEtag);
  return new Response(object.body, { headers });
}
