import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const houses = sqliteTable(
  "houses",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    shortCode: text("short_code").notNull(),
    color: text("color").notNull(),
    logoUrl: text("logo_url"),
    isActive: integer("is_active").notNull().default(1),
    createdAt: text("created_at").notNull(),
  },
  (table) => [uniqueIndex("idx_houses_name").on(table.name)],
);

export const participants = sqliteTable(
  "participants",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    className: text("class_name"),
    houseId: integer("house_id")
      .notNull()
      .references(() => houses.id, { onDelete: "cascade" }),
    photoKey: text("photo_key"),
    photoUpdatedAt: text("photo_updated_at"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("idx_participants_house_id").on(table.houseId)],
);

export const events = sqliteTable(
  "events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    category: text("category").notNull(),
    status: text("status", {
      enum: ["belum_mula", "sedang_berlangsung", "selesai"],
    })
      .notNull()
      .default("belum_mula"),
    sequence: integer("sequence").notNull().default(0),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("idx_events_status_sequence").on(table.status, table.sequence)],
);

export const results = sqliteTable(
  "results",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    participantId: integer("participant_id")
      .notNull()
      .references(() => participants.id, { onDelete: "cascade" }),
    houseId: integer("house_id")
      .notNull()
      .references(() => houses.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    points: integer("points").notNull(),
    recordedAt: text("recorded_at").notNull(),
  },
  (table) => [
    uniqueIndex("idx_results_event_participant").on(
      table.eventId,
      table.participantId,
    ),
    index("idx_results_event_id").on(table.eventId),
    index("idx_results_recorded_at").on(table.recordedAt),
  ],
);
