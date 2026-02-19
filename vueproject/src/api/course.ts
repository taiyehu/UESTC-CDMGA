// src/api/course.js
import request from '@/utils/request'

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
