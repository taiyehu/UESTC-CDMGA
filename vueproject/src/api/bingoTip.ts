import request from '@/utils/request'

export type BingoTipItem = {
  id: number
  issueId: number
  tip: string
  teamId: number
  teamName?: string
  createdAt?: string
}

export const fetchCourseBingoTips = (courseId: number | string, page = 1, pageSize = 25, issueId?: number | string) => {
  const params: Record<string, any> = {
    page: page - 1,
    size: pageSize,
  }
  if (issueId !== undefined && issueId !== null && issueId !== '') {
    params.issue_id = issueId
  }

  return request({
    url: `/bingo-tip/course/${courseId}`,
    method: 'get',
    params,
  })
}

export const fetchCourseIssueBingoTips = async (courseId: number | string, issueId: number | string): Promise<BingoTipItem[]> => {
  const res = await request({
    url: `/bingo-tip/course/${courseId}/issue/${issueId}`,
    method: 'get',
  })

  if (res?.data?.code === 0) {
    return (res.data.data || []) as BingoTipItem[]
  }

  if (res?.data && !('code' in res.data)) {
    return (res.data || []) as BingoTipItem[]
  }

  return []
}

export const createCourseBingoTip = (courseId: number | string, payload: { issue_id: number; tip: string; team_id?: number; team_name?: string }) => {
  return request({
    url: `/bingo-tip/course/${courseId}/create`,
    method: 'post',
    data: payload,
  })
}

export const deleteCourseBingoTip = (courseId: number | string, tipId: number | string) => {
  return request({
    url: `/bingo-tip/course/${courseId}/tip/${tipId}`,
    method: 'delete',
  })
}
