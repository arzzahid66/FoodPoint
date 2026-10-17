// Pakistan Standard Time is UTC+5 all year (no DST).
const PK_OFFSET_MS = 5 * 60 * 60 * 1000;

export function startOfTodayPK(now = new Date()) {
  const local = new Date(now.getTime() + PK_OFFSET_MS);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() - PK_OFFSET_MS);
}

const timeFmt = new Intl.DateTimeFormat("en-PK", { timeZone: "Asia/Karachi", hour: "numeric", minute: "2-digit" });
const dateTimeFmt = new Intl.DateTimeFormat("en-PK", {
  timeZone: "Asia/Karachi",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

export const formatTime = (d: Date) => timeFmt.format(d);
export const formatDateTime = (d: Date) => dateTimeFmt.format(d);
