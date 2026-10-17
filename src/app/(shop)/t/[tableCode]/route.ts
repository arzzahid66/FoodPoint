import { NextResponse, type NextRequest } from "next/server";
import { getActiveTableByCode } from "@/server/services/menu";
import { TABLE_COOKIE } from "@/lib/constants";

/** Target of the table QR code: remembers the table in a cookie, then opens the menu. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ tableCode: string }> }) {
  const { tableCode } = await params;
  const table = await getActiveTableByCode(tableCode);
  const url = new URL("/", request.url);
  if (!table) {
    url.searchParams.set("table", "invalid");
    return NextResponse.redirect(url);
  }
  const response = NextResponse.redirect(url);
  response.cookies.set(TABLE_COOKIE, table.code, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 6, // a dining visit
  });
  return response;
}
