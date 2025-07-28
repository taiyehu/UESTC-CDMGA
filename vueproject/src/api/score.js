import request from '@/utils/request'

/**
 * 模拟成绩提交
 * @param {Object} handleScore - 模拟成绩
 * @param {Number} handleScore.course_id
 * @returns {Promise}
 */
export const handleSubmitScore = (handleScore) => {
    return request({
        url: '/score/submit',
        method: 'post',
        headers : {
            "Content-Type" : 'application/json'
        },
        data: handleScore
    })
}
