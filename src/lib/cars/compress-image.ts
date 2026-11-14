export const PHOTO_ACCEPT = ["image/jpeg", "image/png", "image/webp"] as const
export const PHOTO_MAX_BYTES = 10 * 1024 * 1024

const MAX_SIDE = 1600
const QUALITY = 0.8

export type CompressedImage = { blob: Blob; extension: "webp" | "jpg" }

/**
 * Стискає фото на клієнті: найбільша сторона до 1600px, WebP з якістю ~0.8
 * (зазвичай 200–400 KB). Браузери без WebP-кодування в canvas (старий Safari)
 * отримують JPEG. EXIF-орієнтація враховується.
 */
export async function compressImage(file: File): Promise<CompressedImage> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" })
  try {
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)

    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Canvas is not supported")
    ctx.imageSmoothingQuality = "high"
    ctx.drawImage(bitmap, 0, 0, width, height)

    const webp = await toBlob(canvas, "image/webp")
    if (webp?.type === "image/webp") return { blob: webp, extension: "webp" }

    const jpeg = await toBlob(canvas, "image/jpeg")
    if (!jpeg) throw new Error("Couldn't encode the image")
    return { blob: jpeg, extension: "jpg" }
  } finally {
    bitmap.close()
  }
}

const toBlob = (canvas: HTMLCanvasElement, type: string) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, QUALITY))
