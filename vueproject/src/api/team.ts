import request from '@/utils/request'

export interface TeamMemberOption {
  identityId: number
  account: string
}

export interface TeamRow {
  teamId: number
  members: TeamMemberOption[]
}

export interface TeamPanelMember {
  identityId: number
  account: string
  avatar?: string
}

export interface TeamPanel {
  teamId: number
  totalScore: number
  members: TeamPanelMember[]
}

export interface TeamJoinOption {
  teamId: number
  memberCount: number
  memberAccounts: string[]
}

export interface BingoBoardCellState {
  issueId: number
  maxScore: 2 | 3 | 5
  myCompleted: boolean
  myScore: number
}

export interface BingoBoardState {
  hasTeam: boolean
  teamId: number | null
  cells: BingoBoardCellState[]
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

export const fetchMyTeamPanel = async (courseId: number | string, identityId: number | string): Promise<TeamPanel | null> => {
  const res = await request({
    url: `/team/course/${courseId}/my`,
    method: 'get',
    params: { identityId },
  })
  if (res?.data?.code === 0) return (res.data.data || null) as TeamPanel | null
  if (res?.data && !('code' in res.data)) return (res.data || null) as TeamPanel | null
  return null
}

export const fetchMyTeamScore = async (courseId: number | string, identityId: number | string): Promise<number> => {
  const res = await request({
    url: `/team/course/${courseId}/my-score`,
    method: 'get',
    params: { identityId },
  })
  if (res?.data?.code === 0) return Number(res.data.data || 0)
  if (typeof res?.data === 'number') return Number(res.data)
  return 0
}

export const fetchBingoBoardState = async (courseId: number | string, identityId: number | string): Promise<BingoBoardState | null> => {
  const res = await request({
    url: `/team/course/${courseId}/board-state`,
    method: 'get',
    params: { identityId },
  })
  if (res?.data?.code === 0) return (res.data.data || null) as BingoBoardState | null
  if (res?.data && !('code' in res.data)) return (res.data || null) as BingoBoardState | null
  return null
}

export const createMyTeam = (courseId: number | string, identityId: number | string) => {
  return request({
    url: `/team/course/${courseId}/create`,
    method: 'post',
    data: { identity_id: identityId },
  })
}

export const joinCourseTeam = (courseId: number | string, identityId: number | string, teamId: number | string) => {
  return request({
    url: `/team/course/${courseId}/join`,
    method: 'post',
    data: {
      identity_id: identityId,
      team_id: teamId,
    },
  })
}

export const inviteCourseTeamMember = (courseId: number | string, ownerIdentityId: number | string, targetIdentityId: number | string) => {
  return request({
    url: `/team/course/${courseId}/invite`,
    method: 'post',
    data: {
      owner_identity_id: ownerIdentityId,
      target_identity_id: targetIdentityId,
    },
  })
}

export const leaveCourseTeam = (courseId: number | string, identityId: number | string) => {
  return request({
    url: `/team/course/${courseId}/leave`,
    method: 'post',
    data: {
      identity_id: identityId,
    },
  })
}

export const searchJoinTeamOptions = async (
  courseId: number | string,
  identityId: number | string,
  keyword: string
): Promise<TeamJoinOption[]> => {
  const res = await request({
    url: `/team/course/${courseId}/join-options`,
    method: 'get',
    params: { identityId, keyword },
  })
  if (res?.data?.code === 0 && Array.isArray(res.data.data)) return res.data.data as TeamJoinOption[]
  if (Array.isArray(res?.data)) return res.data as TeamJoinOption[]
  return []
}
