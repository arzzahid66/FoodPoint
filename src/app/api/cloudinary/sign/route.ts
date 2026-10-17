import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/guard";

const FOLDER = "foodpoint";

/** Returns signed upload params so the browser can upload straight to Cloudinary (OWNER only). */
export async function POST() {
  const user = await getCurrentUser();
  if (!user || user.role !== "OWNER") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const { CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_CLOUD_NAME } = process.env;
  if (!CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET || !CLOUDINARY_CLOUD_NAME) {
    return NextResponse.json({ error: "Image uploads are not configured" }, { status: 500 });
  }

  const timestamp = Math.round(Date.now() / 1000);
  // Cloudinary signature: sha1 of the alphabetically sorted params + API secret.
  const toSign = `folder=${FOLDER}&timestamp=${timestamp}`;
  const signature = createHash("sha1").update(toSign + CLOUDINARY_API_SECRET).digest("hex");

  return NextResponse.json({
    cloudName: CLOUDINARY_CLOUD_NAME,
    apiKey: CLOUDINARY_API_KEY,
    folder: FOLDER,
    timestamp,
    signature,
  });
}
