import { NextResponse } from "next/server";

import { requireUserRole } from "@/lib/auth/session";
import { uploadPropertyPhotoToStorage } from "@/lib/storage-server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await requireUserRole("agency").catch(() => null);

  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);

  if (!formData) {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const files = formData.getAll("files");
  const urls: string[] = [];

  for (const file of files) {
    if (!(file instanceof File)) continue;

    try {
      const url = await uploadPropertyPhotoToStorage(file);
      urls.push(url);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Error al subir foto" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ urls });
}
