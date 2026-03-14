import { fetchCourseByIdData, fetchCourseData } from '@/api/course'
import type { Course } from '@/api/types'

function toCourseShape(raw: Record<string, any>): Course {
  return {
    id: Number(raw.id),
    title: String(raw.title ?? ''),
    category: String(raw.category ?? ''),
    startTime: String(raw.startTime ?? raw.start_time ?? ''),
    endTime: String(raw.endTime ?? raw.end_time ?? ''),
    description: String(raw.description ?? ''),
    image: String(raw.image ?? ''),
    isDeleted: Boolean(raw.isDeleted ?? raw.is_deleted ?? false),
    createdAt: String(raw.createdAt ?? raw.created_at ?? ''),
    updatedAt: String(raw.updatedAt ?? raw.updated_at ?? ''),
  }
}

function pickCourseFromPayload(payload: any, courseId: number): Course | null {
  if (!payload) return null

  if (Array.isArray(payload)) {
    const matched = payload.find((item) => Number(item?.id) === courseId)
    return matched ? toCourseShape(matched) : null
  }

  if (typeof payload === 'object') {
    if (Number(payload.id) === courseId) return toCourseShape(payload)

    if (payload.data) {
      const nested = pickCourseFromPayload(payload.data, courseId)
      if (nested) return nested
    }

    if (Array.isArray(payload.content)) {
      const matched = payload.content.find((item: unknown) => {
        if (!item || typeof item !== 'object') return false
        return Number((item as Record<string, unknown>).id) === courseId
      })
      return matched ? toCourseShape(matched) : null
    }
  }

  return null
}

export async function loadCourseById(courseId: number): Promise<Course | null> {
  try {
    const byIdResponse = await fetchCourseByIdData(courseId)
    const byIdCourse = pickCourseFromPayload(byIdResponse?.data, courseId)
    if (byIdCourse) return byIdCourse
  } catch {
    // Fallback to list endpoint when backend does not expose /course/:id query endpoint.
  }

  const listResponse = await fetchCourseData()
  return pickCourseFromPayload(listResponse?.data, courseId)
}
