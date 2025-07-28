// src/api/course.js
import request from "@/utils/request";
export const fetchAllCourseData = (params) => {
    return request({
        url: '/course/allcourse', // 简洁路径
        method: 'get',
        params: {
            page: params.page - 1,
            size: params.pageSize,
        }
    })
}

export const deleteCourseData = (courseId) => {
    return request({
        url: `/course/${courseId}`, // 简洁路径
        method: 'delete'
    })
}

export const fetchCourseData = () => {
    return request({
        url: '/course/', // 简洁路径
        method: 'get'
    })
}
