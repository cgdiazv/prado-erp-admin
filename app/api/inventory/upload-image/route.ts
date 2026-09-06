import { NextRequest, NextResponse } from "next/server";
import { resolveCompanyId } from "@/lib/tenant";

const BUCKET = "product-images";
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Supabase storage is not configured (missing env vars)");
  }
  return { url, serviceKey };
}

async function ensureBucket(url: string, serviceKey: string) {
  const res = await fetch(`${url}/storage/v1/bucket`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true }),
  });
  // 409 / "already exists" is fine
  if (!res.ok) {
    const body = await res.text();
    if (!body.toLowerCase().includes("already exists") && res.status !== 409) {
      throw new Error(`Could not create storage bucket: ${body}`);
    }
  }
}

// POST /api/inventory/upload-image - Upload a product image, returns its public URL
export async function POST(request: NextRequest) {
  try {
    const companyId = await resolveCompanyId(request);
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "No se recibió ningún archivo" },
        { status: 400 }
      );
    }

    const ext = ALLOWED_TYPES[file.type];
    if (!ext) {
      return NextResponse.json(
        { success: false, error: "Formato no permitido. Usa JPG, PNG, WEBP o GIF" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: "La imagen supera el límite de 5 MB" },
        { status: 400 }
      );
    }

    const { url, serviceKey } = getSupabaseConfig();
    const path = `${companyId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const upload = async () =>
      fetch(`${url}/storage/v1/object/${BUCKET}/${path}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": file.type,
          "x-upsert": "false",
        },
        body: Buffer.from(await file.arrayBuffer()),
      });

    let res = await upload();

    if (!res.ok) {
      const body = await res.text();
      if (body.toLowerCase().includes("bucket not found")) {
        await ensureBucket(url, serviceKey);
        res = await upload();
        if (!res.ok) {
          throw new Error(`Upload failed after creating bucket: ${await res.text()}`);
        }
      } else {
        throw new Error(`Upload failed: ${body}`);
      }
    }

    const publicUrl = `${url}/storage/v1/object/public/${BUCKET}/${path}`;
    return NextResponse.json({ success: true, data: { url: publicUrl } }, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/inventory/upload-image error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
