// src/api/course.js
import request from '@/utils/request'
import axios from 'axios'

export interface PageParams {
  page: number
  pageSize?: number
  size?: number
  [key: string]: any
}

export const fetchAllCourseData = (params: PageParams) => {
  const pageSize = params.pageSize ?? params.size ?? 10
  return request({
    url: '/course/allcourse', // 简洁路径
    method: 'get',
    params: {
      page: params.page - 1,
      size: pageSize,
    },
  })
}

export const deleteCourseData = (courseId: number | string) => {
  return request({
    url: `/course/${courseId}`, // 简洁路径
    method: 'delete',
  })
}

export const fetchCourseData = () => {
  return request({
    url: '/course/', // 简洁路径
    method: 'get',
  })
}

export const fetchCourseByIdData = (courseId: number | string) => {
  return request({
    url: `/course/${courseId}`,
    method: 'get',
  })
}

export const fetchAvailablecourseData = (params: PageParams) => {
  const pageSize = params.pageSize ?? params.size ?? 10
  return request({
    url: '/course/availablecourse',
    method: 'get',
    params: {
      page: params.page - 1,
      size: pageSize,
    },
  })
}

export interface UpdateCoursePayload {
  title: string
  category: string
  startTime: string
  endTime: string
  description: string
  image: string
}

export const updateCourseData = (courseId: number | string, payload: UpdateCoursePayload) => {
  return request({
    url: `/course/update/${courseId}`,
    method: 'put',
    data: payload,
  })
}

export const uploadCourseImage = async (file: File) => {
  const formData = new FormData()
  formData.append('image', file)
  const res = await axios.post('/api/course/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  if (res.data?.code === 0) return String(res.data.data || '')
  throw new Error(res.data?.message || '图片上传失败')
}
