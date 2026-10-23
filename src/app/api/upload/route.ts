import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken } from "../../../lib/auth";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// Maximum upload limits
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB

// Allowed MIME types & extension mappings
const ALLOWED_TYPES: Record<string, { ext: string; mediaType: "DOCUMENT" | "IMAGE" | "AUDIO"; maxSize: number }> = {
  // Documents
  "application/pdf": { ext: ".pdf", mediaType: "DOCUMENT", maxSize: MAX_FILE_SIZE },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { ext: ".docx", mediaType: "DOCUMENT", maxSize: MAX_FILE_SIZE },
  "application/msword": { ext: ".doc", mediaType: "DOCUMENT", maxSize: MAX_FILE_SIZE },
  
  // Images
  "image/jpeg": { ext: ".jpg", mediaType: "IMAGE", maxSize: MAX_IMAGE_SIZE },
  "image/png": { ext: ".png", mediaType: "IMAGE", maxSize: MAX_IMAGE_SIZE },
  "image/webp": { ext: ".webp", mediaType: "IMAGE", maxSize: MAX_IMAGE_SIZE },

  // Audio
  "audio/mpeg": { ext: ".mp3", mediaType: "AUDIO", maxSize: MAX_FILE_SIZE },
  "audio/mp3": { ext: ".mp3", mediaType: "AUDIO", maxSize: MAX_FILE_SIZE },
  "audio/wav": { ext: ".wav", mediaType: "AUDIO", maxSize: MAX_FILE_SIZE },
  "audio/x-wav": { ext: ".wav", mediaType: "AUDIO", maxSize: MAX_FILE_SIZE },
  "audio/x-m4a": { ext: ".m4a", mediaType: "AUDIO", maxSize: MAX_FILE_SIZE },
  "audio/mp4": { ext: ".m4a", mediaType: "AUDIO", maxSize: MAX_FILE_SIZE },
  "audio/ogg": { ext: ".ogg", mediaType: "AUDIO", maxSize: MAX_FILE_SIZE }
};

// Validate file signatures (Magic Bytes) to prevent mime-type spoofing
function validateMagicBytes(buffer: Buffer, ext: string): boolean {
  if (buffer.length < 4) return false;

  // PDF: %PDF (25 50 44 46)
  if (ext === ".pdf") {
    return buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
  }

  // PNG: 89 50 4E 47
  if (ext === ".png") {
    return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
  }

  // JPEG: FF D8 FF
  if (ext === ".jpg" || ext === ".jpeg") {
    return buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
  }

  // WEBP: RIFF ... WEBP
  if (ext === ".webp") {
    return buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";
  }

  // DOCX: PK.. (ZIP archive)
  if (ext === ".docx") {
    return buffer[0] === 0x50 && buffer[1] === 0x4B && buffer[2] === 0x03 && buffer[3] === 0x04;
  }

  // Audio WAV: RIFF ... WAVE
  if (ext === ".wav") {
    return buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WAVE";
  }

  // Audio MP3: ID3 or sync frame (FF FB / FF F3 / FF F2 / 49 44 33)
  if (ext === ".mp3") {
    const isId3 = buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33;
    const isMpegSync = buffer[0] === 0xFF && (buffer[1] & 0xE0) === 0xE0;
    return isId3 || isMpegSync;
  }

  // Audio M4A: ....ftypM4A or ....ftypmp42
  if (ext === ".m4a") {
    const box = buffer.toString("ascii", 4, 8);
    return box === "ftyp";
  }

  // Audio OGG: OggS (4F 67 67 53)
  if (ext === ".ogg") {
    return buffer.toString("ascii", 0, 4) === "OggS";
  }

  // DOC (legacy compound binary file)
  if (ext === ".doc") {
    return buffer[0] === 0xD0 && buffer[1] === 0xCF && buffer[2] === 0x11 && buffer[3] === 0xE0;
  }

  return true;
}

export async function POST(request: Request) {
  try {
    // 1. Session verification
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("afriJournalSession");
    if (!sessionCookie?.value) {
      return NextResponse.json(
        { success: false, error: "Authentication required to upload media." },
        { status: 401 }
      );
    }

    const userId = verifySessionToken(sessionCookie.value);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Invalid session. Please sign in again." },
        { status: 401 }
      );
    }

    // 2. Parse Form Data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file was attached." },
        { status: 400 }
      );
    }

    // 3. Validate MIME Type & Extension Whitelist
    const mimeType = (file.type || "").toLowerCase().trim();
    const typeConfig = ALLOWED_TYPES[mimeType];

    if (!typeConfig) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Unsupported file format. Allowed formats: PDF, DOCX, JPG, PNG, WEBP, MP3, WAV, M4A, OGG." 
        },
        { status: 400 }
      );
    }

    // 4. Validate File Size
    if (file.size > typeConfig.maxSize) {
      const maxMb = Math.round(typeConfig.maxSize / (1024 * 1024));
      return NextResponse.json(
        { success: false, error: `File exceeds maximum allowed size of ${maxMb}MB.` },
        { status: 400 }
      );
    }

    // 5. Convert to Buffer and Validate Magic Bytes
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!validateMagicBytes(buffer, typeConfig.ext)) {
      return NextResponse.json(
        { success: false, error: "File content does not match its declared format (security verification failed)." },
        { status: 400 }
      );
    }

    // 6. Sanitize Filename & Generate Secure Path
    const rawName = file.name || `upload${typeConfig.ext}`;
    const baseName = path.basename(rawName, path.extname(rawName))
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .substring(0, 50);

    const randomSuffix = crypto.randomBytes(6).toString("hex");
    const safeStoredFilename = `${Date.now()}_${randomSuffix}_${baseName}${typeConfig.ext}`;

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const targetFilePath = path.join(uploadsDir, safeStoredFilename);
    fs.writeFileSync(targetFilePath, buffer);

    const publicUrl = `/uploads/${safeStoredFilename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: file.name,
      mediaType: typeConfig.mediaType,
      size: file.size
    });

  } catch (error: any) {
    console.error("Secure upload handler error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process file upload." },
      { status: 500 }
    );
  }
}
