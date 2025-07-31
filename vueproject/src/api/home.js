import request from "@/utils/request";

export const getCurrentCourse = () => {
    return request({
        url: '/home/',
        method: 'get'
    })
}
