import request from '@/utils/request'
import type { Score } from '@/api/types'
/**
 * ģ��ɼ��ύ
 * @param {Object} handleScore - ģ��ɼ�
 * @param {Number} handleScore.course_id
 * @returns {Promise}
 */
export const Test_handleSubmitScore = (handleScore:Score) => {
  return request({
    url: '/score/submit',
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
    },
    data: handleScore,
  })
}
/**
 *
 * @param {Number} identityId
 * @param {Number} courseId
 * @returns {Promise}
 */
export const checkSubmitted = (identityId: number | string, courseId: number | string) => {
  return request({
    url: '/score/exists',
    method: 'get',
    params: {
      identityId: identityId,
      courseId: courseId,
    },
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
export const handleSubmitScore = (handleScore: Partial<Score>) => {
  return request({
    url: '/score/post',
    method: 'post',
    data: handleScore,
  })
}
/**
 *
 * @param {Object} updateData
 * @Param {String} course_id
 */
export const handleUpdateScore = (updateData: Partial<Score> | Record<string, any>, score_id: number | string) => {
  return request({
    url: `/score/update/${score_id}`,
    method: 'put',
    data: updateData,
  })
}
export const fetchScore = (params: { page: number; pageSize?: number; size?: number }) => {
  const pageSize = params.pageSize ?? params.size ?? 10
  return request({
    url: '/score/',
    method: 'get',
    params: {
      page: params.page - 1,
      size: pageSize,
    },
  })
}
export const fetchUnScoredScores = (params: { page: number; pageSize?: number; size?: number }) => {
  const pageSize = params.pageSize ?? params.size ?? 10
  return request({
    url: '/score/unscored',
    method: 'get',
    params: {
      page: params.page - 1,
      size: pageSize,
    },
  })
}
