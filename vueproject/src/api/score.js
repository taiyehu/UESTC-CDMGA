import request from '@/utils/request'

/**
 * ģ��ɼ��ύ
 * @param {Object} handleScore - ģ��ɼ�
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
