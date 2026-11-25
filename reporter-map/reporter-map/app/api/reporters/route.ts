import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { makeSampleReporters } from "@/lib/sample-reporters";

/**
 * GET /api/reporters
 * Replace the body with your DB query, e.g. (Prisma):
 *   const reporters = await prisma.reporter.findMany({
 *     where: { tenantId }, select: { id, name, phone, role, mandalId, paper: true },
 *   });
 * Each reporter needs a `mandalId` matching /public/geo/telangana-mandals.json.
 */
export async function GET() {
  const file = path.join(process.cwd(), "public/geo/telangana-mandals.json");
  const geo = JSON.parse(await readFile(file, "utf8"));
  const ids: string[] = geo.features.map((f: { properties: { id: string } }) => f.properties.id);
  return NextResponse.json(makeSampleReporters(ids));
}
