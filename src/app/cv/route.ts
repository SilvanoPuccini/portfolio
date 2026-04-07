import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { siteContent } from "@/content/site";

export async function GET() {
  const filePath = path.join(
    /* turbopackIgnore: true */ process.cwd(),
    "docs",
    "assets",
    "cv",
    siteContent.metadata.cv.fileName,
  );

  try {
    const fileBuffer = await readFile(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${siteContent.metadata.cv.fileName}"`,
        "cache-control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "CV file not found." },
      { status: 404 },
    );
  }
}
