import request from '@/utils/request'

export const fetchUsersData = (params) => {
    return request({
        url: '/identity/allaccount',
        method: 'get',
        params: {
            page: params.page - 1,  // 后端从0开始计数
            size: params.pageSize,
            title: params.searchQuery,
            category: params.categoryFilter
        }
    })
}

export const deleteUserData = (userId) => {
    return request({
        url: `/identity/${userId}`,
        method: 'delete'
    })
}
