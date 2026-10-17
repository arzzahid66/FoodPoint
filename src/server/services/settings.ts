import "server-only";
import { cache } from "react";
import { db } from "@/server/db";

export const getSettings = cache(async () => {
  return db.setting.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
});
