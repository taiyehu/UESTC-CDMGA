import request from '@/utils/request'
import axios from 'axios'

export interface IssuePayload {
  issue_id: number
  image: string
  text: string
  file: string
  song_name?: string
}

export const fetchCourseIssues = (courseId: number | string, page: number, size: number) => {
  return request({
    url: `/issue/course/${courseId}`,
    method: 'get',
    params: {
      page: page - 1,
      size,
    },
  })
}

export const upsertCourseIssue = (courseId: number | string, payload: IssuePayload) => {
  return request({
    url: `/issue/course/${courseId}/upsert`,
    method: 'post',
    data: payload,
  })
}

export const uploadIssueImage = async (courseId: number | string, file: File) => {
  const formData = new FormData()
  formData.append('image', file)
  formData.append('courseId', String(courseId))
  const res = await axios.post('/api/issue/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  if (res.data?.code === 0) return String(res.data.data || '')
  throw new Error(res.data?.message || '图片上传失败')
}

export const uploadIssueFile = async (courseId: number | string, file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('courseId', String(courseId))
  const res = await axios.post('/api/issue/upload-file', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  if (res.data?.code === 0) return String(res.data.data || '')
  throw new Error(res.data?.message || '文件上传失败')
}
