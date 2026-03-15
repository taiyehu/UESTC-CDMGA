import request from '@/utils/request'

export interface TeamMemberOption {
  identityId: number
  account: string
}

export interface TeamRow {
  teamId: number
  members: TeamMemberOption[]
}

export const fetchCourseTeams = (courseId: number | string, page: number, size = 10) => {
  return request({
    url: `/team/course/${courseId}`,
    method: 'get',
    params: {
      page: page - 1,
      size,
    },
  })
}

export const searchTeamMemberOptions = async (courseId: number | string, keyword: string, size = 20) => {
  const res = await request({
    url: `/team/course/${courseId}/member-options`,
    method: 'get',
    params: {
      keyword,
      size,
    },
  })
  if (Array.isArray(res)) return res
  if (Array.isArray(res?.data)) return res.data
  if (Array.isArray(res?.data?.data)) return res.data.data
  return []
}

export const saveCourseTeam = (courseId: number | string, payload: { team_id: number; member_ids: number[] }) => {
  return request({
    url: `/team/course/${courseId}/save`,
    method: 'post',
    data: payload,
  })
}
