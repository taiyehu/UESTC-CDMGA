import request from '@/utils/request'

/**
 *
 * @typedef {Object} Identity
 * @property {Number} Identity.id
 * @property {String} Identity.account
 * @property {String} Identity.password
 * @property {Array<Object>} Identity.scores
 * @property {String} Identity.role
 * @property {Boolean} Identity.isDeleted
 * @property {Date} Identity.createAt
 * @property {Date} Identity.updateAt
 */

export const fetchUsersData = (params) => {
    return request({
        url: '/identity/allaccount',
        method: 'get',
        params: {
            page: params.page - 1,  // 后端从0开始计数
            size: params.pageSize,
        }
    })
}

export const deleteUserData = (userId) => {
    return request({
        url: `/identity/${userId}`,
        method: 'delete'
    })
}
/**
 *
 * @param {Identity} Identity
 * @returns {*}
 */
export const createIdentityData = (Identity) => {
    return request({
        url: '/identity/',
        method: 'post',
        headers : {
            "Content-Type" : 'application/json'
        },
        data: Identity
    })
}
/**
 *
 * @param {Identity} Identity
 * @returns {*}
 */
export const updateIdentityData = (Identity) => {
    return request({
        url: '/identity/',
        method: 'put',
        headers : {
            "Content-Type" : 'application/json'
        },
        data: Identity
    })
}

export const deleteIdentityData = (id) => {
    return request({
        url: `/identity/${id}` ,
        method: 'delete'
    })
}
