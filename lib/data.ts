import { env } from "cloudflare:workers";

export type HouseStanding = {
  id: number;
  name: string;
  shortCode: string;
  color: string;
  logoUrl: string | null;
  points: number;
  participants: number;
  gold: number;
};

export type Participant = {
  id: number;
  name: string;
  className: string | null;
  houseId: number;
  houseName: string;
  houseColor: string;
  photoUrl: string | null;
};

export type SportsEvent = {
  id: number;
  name: string;
  category: string;
  status: "belum_mula" | "sedang_berlangsung" | "selesai";
  sequence: number;
};

export type RecentResult = {
  id: number;
  eventId: number;
  eventName: string;
  category: string;
  participantName: string;
  participantPhotoUrl: string | null;
  houseName: string;
  houseColor: string;
  position: number;
  points: number;
  recordedAt: string;
};

export type DashboardData = {
  houses: HouseStanding[];
  participants: Participant[];
  events: SportsEvent[];
  recentResults: RecentResult[];
  stats: {
    totalParticipants: number;
    totalEvents: number;
    completedEvents: number;
    totalResults: number;
  };
  updatedAt: string;
};

function database(): D1Database {
  if (!env.DB) throw new Error("Pangkalan data tidak tersedia.");
  return env.DB;
}

function now() {
  return new Date().toISOString();
}

export async function ensureSeedData() {
  const db = database();
  const initialized = await db
    .prepare("SELECT value FROM settings WHERE key = ?")
    .bind("initialized")
    .first<{ value: string }>();

  if (!initialized) {
    const createdAt = now();
    const statements = [
      db
        .prepare(
          "INSERT OR IGNORE INTO houses (id, name, short_code, color, logo_url, is_active, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)",
        )
        .bind(1, "Wira Biru", "WBR", "#2563eb", "/house-wira-biru.png", createdAt),
      db
        .prepare(
          "INSERT OR IGNORE INTO houses (id, name, short_code, color, logo_url, is_active, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)",
        )
        .bind(2, "Satria Merah", "SMR", "#dc2626", "/house-satria-merah.png", createdAt),
    db
      .prepare(
        "INSERT OR IGNORE INTO participants (id, name, class_name, house_id, created_at) VALUES (?, ?, ?, ?, ?)",
      )
      .bind(1, "Aisyah", "Tahun 4", 1, createdAt),
    db
      .prepare(
        "INSERT OR IGNORE INTO participants (id, name, class_name, house_id, created_at) VALUES (?, ?, ?, ?, ?)",
      )
      .bind(2, "Balqis", "Tahun 5", 2, createdAt),
    db
      .prepare(
        "INSERT OR IGNORE INTO participants (id, name, class_name, house_id, created_at) VALUES (?, ?, ?, ?, ?)",
      )
      .bind(5, "Maryam", "Tahun 5", 1, createdAt),
    db
      .prepare(
        "INSERT OR IGNORE INTO participants (id, name, class_name, house_id, created_at) VALUES (?, ?, ?, ?, ?)",
      )
      .bind(6, "Sofea", "Tahun 6", 2, createdAt),
    db
      .prepare(
        "INSERT OR IGNORE INTO events (id, name, category, status, sequence, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .bind(1, "Lari 100 Meter", "Perempuan Bawah 12", "selesai", 1, createdAt),
    db
      .prepare(
        "INSERT OR IGNORE INTO events (id, name, category, status, sequence, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .bind(2, "Lompat Jauh", "Perempuan Bawah 12", "selesai", 2, createdAt),
    db
      .prepare(
        "INSERT OR IGNORE INTO events (id, name, category, status, sequence, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .bind(3, "Lari 200 Meter", "Perempuan Bawah 12", "sedang_berlangsung", 3, createdAt),
    db
      .prepare(
        "INSERT OR IGNORE INTO events (id, name, category, status, sequence, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .bind(4, "4 × 100 Meter", "Terbuka", "belum_mula", 4, createdAt),
    db
      .prepare(
        "INSERT OR IGNORE INTO results (event_id, participant_id, house_id, position, points, recorded_at) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .bind(1, 1, 1, 1, 5, createdAt),
    db
      .prepare(
        "INSERT OR IGNORE INTO results (event_id, participant_id, house_id, position, points, recorded_at) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .bind(1, 2, 2, 2, 3, createdAt),
    db
      .prepare(
        "INSERT OR IGNORE INTO results (event_id, participant_id, house_id, position, points, recorded_at) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .bind(2, 5, 1, 2, 3, createdAt),
    db
      .prepare(
        "INSERT OR IGNORE INTO results (event_id, participant_id, house_id, position, points, recorded_at) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .bind(2, 6, 2, 3, 2, createdAt),
    db
      .prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)")
      .bind("initialized", createdAt),
    ];

    await db.batch(statements);
  }

  await ensureTwoHouseConfiguration();
}

async function ensureTwoHouseConfiguration() {
  const db = database();
  const configured = await db
    .prepare("SELECT value FROM settings WHERE key = ?")
    .bind("two_house_config_v1")
    .first<{ value: string }>();
  if (configured) return;

  const configuredAt = now();
  await db.batch([
    db.prepare("UPDATE houses SET is_active = 0"),
    db
      .prepare(
        "UPDATE houses SET name = ?, short_code = ?, color = ?, logo_url = ?, is_active = 1 WHERE id = ?",
      )
      .bind("Wira Biru", "WBR", "#2563eb", "/house-wira-biru.png", 1),
    db
      .prepare(
        "UPDATE houses SET name = ?, short_code = ?, color = ?, logo_url = ?, is_active = 1 WHERE id = ?",
      )
      .bind("Satria Merah", "SMR", "#dc2626", "/house-satria-merah.png", 2),
    db
      .prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)")
      .bind("two_house_config_v1", configuredAt),
  ]);
}

export async function getDashboardData(): Promise<DashboardData> {
  await ensureSeedData();
  const db = database();

  const [housesQuery, participantsQuery, eventsQuery, resultsQuery, statsQuery] =
    await Promise.all([
      db
        .prepare(
          `SELECT h.id, h.name, h.short_code AS shortCode, h.color, h.logo_url AS logoUrl,
             COALESCE(rs.points, 0) AS points,
             COALESCE(ps.participants, 0) AS participants,
             COALESCE(rs.gold, 0) AS gold
           FROM houses h
           LEFT JOIN (
             SELECT house_id, COUNT(*) AS participants
             FROM participants
             GROUP BY house_id
           ) ps ON ps.house_id = h.id
           LEFT JOIN (
             SELECT house_id, SUM(points) AS points,
               SUM(CASE WHEN position = 1 THEN 1 ELSE 0 END) AS gold
             FROM results
             GROUP BY house_id
           ) rs ON rs.house_id = h.id
           WHERE h.is_active = 1
           ORDER BY points DESC, gold DESC, h.name ASC`,
        )
        .all<HouseStanding>(),
      db
        .prepare(
          `SELECT p.id, p.name, p.class_name AS className, p.house_id AS houseId,
             h.name AS houseName, h.color AS houseColor,
             CASE WHEN p.photo_key IS NOT NULL
               THEN '/api/participants/' || p.id || '/photo?v=' || COALESCE(p.photo_updated_at, '')
               ELSE NULL END AS photoUrl
           FROM participants p
           JOIN houses h ON h.id = p.house_id
           WHERE h.is_active = 1
           ORDER BY p.name ASC`,
        )
        .all<Participant>(),
      db
        .prepare(
          `SELECT id, name, category, status, sequence
           FROM events
           ORDER BY CASE status WHEN 'sedang_berlangsung' THEN 0 WHEN 'belum_mula' THEN 1 ELSE 2 END,
                    sequence ASC, id ASC`,
        )
        .all<SportsEvent>(),
      db
        .prepare(
          `SELECT r.id, r.event_id AS eventId, e.name AS eventName, e.category,
             p.name AS participantName,
             CASE WHEN p.photo_key IS NOT NULL
               THEN '/api/participants/' || p.id || '/photo?v=' || COALESCE(p.photo_updated_at, '')
               ELSE NULL END AS participantPhotoUrl,
             h.name AS houseName, h.color AS houseColor,
             r.position, r.points, r.recorded_at AS recordedAt
           FROM results r
           JOIN events e ON e.id = r.event_id
           JOIN participants p ON p.id = r.participant_id
           JOIN houses h ON h.id = r.house_id
           WHERE h.is_active = 1
           ORDER BY r.recorded_at DESC, r.id DESC
           LIMIT 12`,
        )
        .all<RecentResult>(),
      db
        .prepare(
          `SELECT
             (SELECT COUNT(*) FROM participants p JOIN houses h ON h.id = p.house_id WHERE h.is_active = 1) AS totalParticipants,
             (SELECT COUNT(*) FROM events) AS totalEvents,
             (SELECT COUNT(*) FROM events WHERE status = 'selesai') AS completedEvents,
             (SELECT COUNT(*) FROM results r JOIN houses h ON h.id = r.house_id WHERE h.is_active = 1) AS totalResults`,
        )
        .first<DashboardData["stats"]>(),
    ]);

  return {
    houses: housesQuery.results,
    participants: participantsQuery.results,
    events: eventsQuery.results,
    recentResults: resultsQuery.results,
    stats: statsQuery ?? {
      totalParticipants: 0,
      totalEvents: 0,
      completedEvents: 0,
      totalResults: 0,
    },
    updatedAt: now(),
  };
}

export async function createHouse(input: {
  name: string;
  shortCode: string;
  color: string;
}) {
  const db = database();
  const active = await db
    .prepare("SELECT COUNT(*) AS total FROM houses WHERE is_active = 1")
    .first<{ total: number }>();
  if ((active?.total ?? 0) >= 2) {
    throw new Error("Dashboard ini ditetapkan untuk dua rumah sukan sahaja.");
  }
  return db
    .prepare(
      "INSERT INTO houses (name, short_code, color, created_at) VALUES (?, ?, ?, ?)",
    )
    .bind(input.name, input.shortCode, input.color, now())
    .run();
}

export async function addParticipants(
  houseId: number,
  entries: Array<{ name: string; className: string | null }>,
) {
  const db = database();
  const house = await db
    .prepare("SELECT id FROM houses WHERE id = ? AND is_active = 1")
    .bind(houseId)
    .first<{ id: number }>();
  if (!house) throw new Error("Rumah sukan tidak aktif.");
  const createdAt = now();
  const statements = entries.map((entry) =>
    db
      .prepare(
        "INSERT INTO participants (name, class_name, house_id, created_at) VALUES (?, ?, ?, ?)",
      )
      .bind(entry.name, entry.className, houseId, createdAt),
  );
  return db.batch(statements);
}

export async function createEvent(input: {
  name: string;
  category: string;
  status: SportsEvent["status"];
}) {
  const db = database();
  const sequence = await db
    .prepare("SELECT COALESCE(MAX(sequence), 0) + 1 AS nextSequence FROM events")
    .first<{ nextSequence: number }>();
  return db
    .prepare(
      "INSERT INTO events (name, category, status, sequence, created_at) VALUES (?, ?, ?, ?, ?)",
    )
    .bind(input.name, input.category, input.status, sequence?.nextSequence ?? 1, now())
    .run();
}

export async function updateEventStatus(
  id: number,
  status: SportsEvent["status"],
) {
  return database()
    .prepare("UPDATE events SET status = ? WHERE id = ?")
    .bind(status, id)
    .run();
}

export async function createResult(input: {
  eventId: number;
  participantId: number;
  position: number;
  points: number;
}) {
  const db = database();
  const participant = await db
    .prepare("SELECT house_id AS houseId FROM participants WHERE id = ?")
    .bind(input.participantId)
    .first<{ houseId: number }>();
  if (!participant) throw new Error("Peserta tidak ditemui.");

  await db.batch([
    db
      .prepare(
        `INSERT INTO results (event_id, participant_id, house_id, position, points, recorded_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(event_id, participant_id) DO UPDATE SET
           house_id = excluded.house_id,
           position = excluded.position,
           points = excluded.points,
           recorded_at = excluded.recorded_at`,
      )
      .bind(
        input.eventId,
        input.participantId,
        participant.houseId,
        input.position,
        input.points,
        now(),
      ),
    db
      .prepare("UPDATE events SET status = 'selesai' WHERE id = ?")
      .bind(input.eventId),
  ]);
}

export async function saveParticipantPhoto(participantId: number, file: File) {
  const bucket = env.BUCKET;
  if (!bucket) throw new Error("Storan gambar tidak tersedia.");
  if (file.type !== "image/png") {
    throw new Error("Sila pilih fail PNG.");
  }
  if (file.size <= 0 || file.size > 5 * 1024 * 1024) {
    throw new Error("Saiz fail PNG mestilah tidak melebihi 5 MB.");
  }

  const participant = await database()
    .prepare(
      `SELECT p.id FROM participants p
       JOIN houses h ON h.id = p.house_id
       WHERE p.id = ? AND h.is_active = 1`,
    )
    .bind(participantId)
    .first<{ id: number }>();
  if (!participant) throw new Error("Peserta tidak ditemui.");

  const bytes = new Uint8Array(await file.arrayBuffer());
  const pngSignature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (!pngSignature.every((value, index) => bytes[index] === value)) {
    throw new Error("Fail yang dipilih bukan imej PNG yang sah.");
  }

  const key = `participants/${participantId}.png`;
  const updatedAt = now();
  await bucket.put(key, bytes, {
    httpMetadata: { contentType: "image/png" },
    customMetadata: { participantId: String(participantId) },
  });
  await database()
    .prepare(
      "UPDATE participants SET photo_key = ?, photo_updated_at = ? WHERE id = ?",
    )
    .bind(key, updatedAt, participantId)
    .run();
}

export async function getParticipantPhoto(participantId: number) {
  const bucket = env.BUCKET;
  if (!bucket) return null;
  const participant = await database()
    .prepare("SELECT photo_key AS photoKey FROM participants WHERE id = ?")
    .bind(participantId)
    .first<{ photoKey: string | null }>();
  if (!participant?.photoKey) return null;
  return bucket.get(participant.photoKey);
}
