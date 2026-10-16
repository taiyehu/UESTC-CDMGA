/** Use a small server-generated image for legacy JPEG/PNG media in lists. */
export function mediaThumbnailUrl(path: string | undefined, size: number): string {
  if (!path || !/^\/(?:images|scores|avatars)\/.+\.(?:jpe?g|png)$/i.test(path)) return path || ''
  return `/api/media/thumb?path=${encodeURIComponent(path)}&size=${size}`
}

export function restoreOriginalImage(event: Event, originalUrl: string): void {
  const image = event.target as HTMLImageElement
  if (image.src !== new URL(originalUrl, window.location.href).href) image.src = originalUrl
}
