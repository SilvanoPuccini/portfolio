import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const ALLOWED: Record<string, string> = {
  "Reactjs+Typescript.pdf": "Reactjs+Typescript.pdf",
  "typescript.pdf": "typescript.pdf",
  "Javascript-Avanzado.pdf": "Javascript-Avanzado.pdf",
  "html.pdf": "html.pdf",
  "Angular.pdf": "Angular.pdf",
  "vuejs.pdf": "vuejs.pdf",
  "Python-Avanzado.pdf": "Python-Avanzado.pdf",
  "Git-Github.pdf": "Git-Github.pdf",
  "linux-terminal.pdf": "linux-terminal.pdf",
  "SQL.pdf": "SQL.pdf",
  "css-experto.pdf": "css-experto.pdf",
  "Certificado-Django-Avanzado.pdf": "Certificado-Django-Avanzado.pdf",
  "Certificado-Java-backend.pdf": "Certificado-Java-backend.pdf",
  "Certificado-Rust.pdf": "Certificado-Rust.pdf",
  "docker.pdf": "docker.pdf",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  const fileName = ALLOWED[decodeURIComponent(name)];

  if (!fileName) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const filePath = path.join(
    /* turbopackIgnore: true */ process.cwd(),
    "src",
    "assets",
    "certificates",
    fileName,
  );

  try {
    const buffer = await readFile(filePath);
    return new NextResponse(buffer, {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `inline; filename="${fileName}"`,
        "cache-control": "public, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Certificate not found." }, { status: 404 });
  }
}
