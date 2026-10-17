/** Resize and encode user images before uploading them. URLs remain immutable after upload. */
export async function optimizeImage(
  input: Blob | File,
  { maxSide, quality, format = 'image/webp' }: { maxSide: number; quality: number; format?: 'image/webp' | 'image/jpeg' },
): Promise<File> {
  const source = input instanceof File ? input : new File([input], 'image.png', { type: input.type })
  // Animated GIFs and SVGs must retain their original behavior.
  if (!source.type.startsWith('image/') || ['image/svg+xml', 'image/gif'].includes(source.type)) return source

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(source)
  } catch {
    return source
  }
  try {
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const context = canvas.getContext('2d')
    if (!context) return source
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, format, quality))
    if (!blob || blob.type !== format) return source
    // Keep an already small image if resizing did not improve it.
    if (scale === 1 && blob.size >= source.size) return source
    return new File([blob], `${source.name.replace(/\.[^.]+$/, '')}.${format === 'image/jpeg' ? 'jpg' : 'webp'}`, { type: format })
  } finally {
    bitmap.close()
  }
}

/** Create a .gz file for downloads or archival; callers choose when that format is appropriate. */
export async function compressFileGzip(file: File): Promise<File> {
  if (typeof CompressionStream === 'undefined') throw new Error('此浏览器不支持 gzip 文件压缩')
  const compressedStream = file.stream().pipeThrough(new CompressionStream('gzip'))
  const blob = await new Response(compressedStream).blob()
  return new File([blob], `${file.name}.gz`, { type: 'application/gzip' })
}
