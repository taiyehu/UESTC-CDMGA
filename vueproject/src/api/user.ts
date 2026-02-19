import request from '@/utils/request'

export interface PageParams {
  page: number
  pageSize?: number
  size?: number
  [key: string]: any
}

export const fetchUsersData = (params: PageParams) => {
  const pageSize = params.pageSize ?? params.size ?? 10
  return request({
    url: '/identity/allaccount',
    method: 'get',
    params: {
      page: params.page - 1, // 后端从0开始计数
      size: pageSize,
    },
  })
}

export const deleteUserData = (userId: number | string) => {
  return request({
    url: `/identity/${userId}`,
    method: 'delete',
  })
}
