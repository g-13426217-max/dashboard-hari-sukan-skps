import { NextResponse } from "next/server";
import { getDashboardData } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getDashboardData();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    console.error("dashboard_load_failed", error);
    return NextResponse.json(
      { error: "Data keputusan sedang tidak tersedia. Cuba sebentar lagi." },
      { status: 503 },
    );
  }
}
