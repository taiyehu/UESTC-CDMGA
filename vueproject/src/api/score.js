import request from '@/utils/request'
import types from '@/api/types'
/**
 * ģ��ɼ��ύ
 * @param {Object} handleScore - ģ��ɼ�
 * @param {Number} handleScore.course_id
 * @returns {Promise}
 */
export const Test_handleSubmitScore = (handleScore) => {
    return request({
        url: '/score/submit',
        method: 'post',
        headers : {
            "Content-Type" : 'application/json'
        },
        data: handleScore
    })
}
/**
 *
 * @param {Number} identityId
 * @param {Number} courseId
 * @returns {Promise}
 */
export const  checkSubmitted = (identityId,courseId) => {
    return request({
        url: '/score/exists',
        method: 'get',
        params: {
            identityId: identityId,
            courseId: courseId
        }
    })
}
/**
 *
 * @param {Object} handleScore - �ύ�ĳɼ���Ϣ
 * @Param {String} handleScore.course_id
 * @Param {Number} handleScore.identity_id
 * @param {String} handleScore.upload_time
 * @param {string} handleScore.image
 */
export const handleSubmitScore = (handleScore) => {
    return request({
        url: '/score/post',
        method: 'post',
        data: handleScore
    })
}
/**
 *
 * @param {Object} updateData
 * @Param {String} course_id
 */
export const handleUpdateScore = (updateData, score_id) => {
    return request({
        url: `/score/update/${score_id}`,
        method: 'put',
        data: updateData
    });
}
export const fetchScore = (params) => {
    return request({
        url: '/score/',
        method: 'get' ,
        params: {
            page: params.page - 1,
            size: params.pageSize,
        }
    })
}
export const fetchUnScoredScores = (params) => {
    return request({
        url: '/score/unscored',
        method: 'get' ,
        params: {
            page: params.page - 1,
            size: params.pageSize,
        }
    })
}
