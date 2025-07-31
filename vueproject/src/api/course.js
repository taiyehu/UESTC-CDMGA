// src/api/course.js
import request from "@/utils/request";
export const fetchAllCourseData = (params) => {
    return request({
        url: '/course/allcourse', // 简洁路径
        method: 'get',
        params: {
            page: params.page - 1,
            size: params.pageSize
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

export const fetchAvailablecourseData = (params) => {
    return request({
        url: '/course/availablecourse',
        method: 'get',
        params: {
            page: params.page - 1,
            size: params.pageSize
        }
    })
}
/**
 *
 * @param {Object} courseRequest
 * @param {String} courseRequest.title
 * @param {String} courseRequest.category
 * @param {Date} courseRequest.startTime
 * @param {Date} courseRequest.endTime
 * @param {String} courseRequest.description
 * @param {String} courseRequest.image
 * @param {Date} courseRequest.createTime
 * @param {Date} courseRequest.updateTime
 * @returns
 */
export const postCourseData = (courseRequest) => {
    return request({
        url: '/course/post',
        method: 'post',
        headers : {
            "Content-Type" : 'application/json'
        },
        data: courseRequest
    })
}
