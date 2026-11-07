import axios from 'axios'

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 12000,
})

export type Course = {
  id: number
  title: string
  category?: string | null
  startTime: string
  endTime: string
  description?: string | null
  image?: string | null
  award?: { cost?: number; totalStock?: number; remainingStock?: number } | null
}

export type Activity = {
  id: number
  name: string
  startTime: string
  endTime: string
  description?: string | null
  activityBanner?: string | null
}

export type DailyMember = {
  identityId?: number
  account?: string
  description?: string | null
  avatar?: string | null
}

export type Checkin = {
  date: string
  checkedIn: boolean
  fortune?: { fortuneLevel?: string; fortuneText?: string } | null
}

export type ForumPost = {
  id: number
  title: string
  authorName: string
  authorId?: number
  avatar?: string | null
  titleName?: string | null
  titleTier?: string | null
  titleAcquisitionMethod?: string | null
  content?: string
  status?: string
  replyCount: number
  createdAt: string
  likeCount?: number
  liked?: boolean | number
  images?: { id: number; url: string }[]
  files?: { id: number; url: string; name: string }[]
}

export async function login(account: string, password: string) {
  const res = await api.post('/identity/login', { account, password })
  if (res.data?.code !== 0) throw new Error(res.data?.message || '登录失败')
  return res.data.data
}

export async function fetchCourses(): Promise<Course[]> {
  const res = await api.get('/course/standalone')
  return Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
}

export async function fetchActivities(): Promise<Activity[]> {
  const res = await api.get('/activity/list')
  const list = res.data?.list ?? res.data?.data?.list ?? []
  return Array.isArray(list) ? list : []
}

export async function fetchDailyMember(): Promise<DailyMember | null> {
  const res = await api.get('/profile/daily')
  return res.data?.data ?? res.data ?? null
}

export async function fetchCheckin(): Promise<Checkin | null> {
  const res = await api.get('/checkin/today')
  return res.data?.data ?? null
}

export async function submitCheckin(): Promise<Checkin | null> {
  const res = await api.post('/checkin')
  if (res.data?.code !== 0) throw new Error(res.data?.message || '签到失败')
  return res.data?.data ?? null
}

export async function fetchForum(): Promise<ForumPost[]> {
  const res = await api.get('/forum/posts', { params: { page: 0, size: 3, sort: 'latest' } })
  return res.data?.data?.list ?? []
}

export type RankRow = {
  identityId: number
  account: string
  avatar?: string | null
  description?: string | null
  totalScore: number
}

export type ForumReply = {
  id: number
  authorId?: number
  authorName: string
  avatar?: string | null
  content: string
  createdAt: string
  floorNumber?: number | null
  likeCount?: number
  liked?: boolean | number
}

export type ForumPostDetail = ForumPost & {
  content: string
  replies: ForumReply[]
  images?: { id: number; url: string }[]
  files?: { id: number; url: string; name: string }[]
}

export async function register(account: string, password: string) {
  const res = await api.post('/identity/register', { account, password })
  if (res.data?.code !== 0) throw new Error(res.data?.message || '注册失败')
  return res.data.data
}

export async function fetchCourseCatalog(): Promise<Course[]> {
  const res = await api.get('/course/')
  const data = res.data?.data ?? res.data
  if (Array.isArray(data)) return data as Course[]
  return Array.isArray(data?.list) ? data.list as Course[] : []
}

export async function fetchCourseById(id: number): Promise<Course | null> {
  try {
    const res = await api.get(`/course/${id}`)
    const payload = res.data?.data ?? res.data
    if (payload && Number(payload.id) === id) return payload as Course
  } catch {
    // fall through to list
  }
  const list = await fetchCourses()
  return list.find((c) => Number(c.id) === id) ?? null
}

export async function fetchActivityById(id: number): Promise<Activity | null> {
  const res = await api.get(`/activity/${id}`)
  return (res.data?.data ?? res.data ?? null) as Activity | null
}

export async function fetchAssocCourses(activityId: number): Promise<Course[]> {
  const res = await api.get(`/activity/assoc-activity-courses/${activityId}`)
  const data = res.data?.data ?? res.data
  return Array.isArray(data) ? data : []
}

export async function fetchRanking(startYear = new Date().getFullYear()): Promise<RankRow[]> {
  const res = await api.get('/score/user-total-scores', { params: { startYear } })
  const data = res.data?.data ?? res.data ?? []
  return Array.isArray(data) ? data : []
}

export async function fetchForumPost(id: number): Promise<ForumPostDetail | null> {
  const res = await api.get(`/forum/posts/${id}`)
  const data = res.data?.data ?? null
  return data as ForumPostDetail | null
}

export async function createForumPost(title: string, content: string): Promise<number> {
  const res = await api.post('/forum/posts', { title, content })
  if (res.data?.code !== 0) throw new Error(res.data?.message || '发帖失败')
  return res.data?.data?.id
}

export type ProfileData = {
  id?: number
  account?: string
  avatar?: string | null
  description?: string | null
  status?: number | null
  university?: string | null
}

export async function fetchProfile(identityId: number): Promise<ProfileData | null> {
  const res = await api.get(`/profile/identity/${identityId}`)
  return (res.data?.data ?? res.data ?? null) as ProfileData | null
}

export async function fetchOnline(identityId: number): Promise<boolean | null> {
  try {
    const res = await api.get(`/identity/online/${identityId}`)
    return res.data?.code === 0 ? Boolean(res.data.data) : null
  } catch {
    return null
  }
}

export async function fetchScoredScores(identityId: number): Promise<any[]> {
  const res = await api.get('/score/user-course-scores', { params: { identityId } })
  return res.data?.code === 0 ? (res.data.data ?? []) : []
}

export async function fetchForumPage(page = 0, size = 10, sort: 'latest' | 'likes' = 'latest', mine = false): Promise<{ list: ForumPost[]; total: number }> {
  const res = await api.get('/forum/posts', { params: { page, size, sort, mine } })
  const data = res.data?.data ?? { list: [], total: 0 }
  return { list: data.list ?? [], total: data.total ?? 0 }
}

export async function createForumReply(postId: number, content: string): Promise<number> {
  const res = await api.post(`/forum/posts/${postId}/replies`, { content, parentReplyId: null })
  if (res.data?.code !== 0) throw new Error(res.data?.message || '回复失败')
  return res.data?.data?.id
}


export async function likeForumPost(id: number): Promise<boolean> {
  const res = await api.post(`/forum/post/${id}/like`)
  if (res.data?.code !== 0) throw new Error(res.data?.message || '点赞失败')
  return Boolean(res.data?.data?.liked)
}

export async function reportForumPost(id: number, reason: string): Promise<void> {
  const res = await api.post(`/forum/post/${id}/report`, { reason, detail: '' })
  if (res.data?.code !== 0) throw new Error(res.data?.message || '举报失败')
}

export async function uploadForumImage(postId: number, file: File): Promise<void> {
  const form = new FormData(); form.append('image', file)
  const res = await api.post(`/forum/post/${postId}/images`, form, { timeout: 30000 })
  if (res.data?.code !== 0) throw new Error(res.data?.message || '图片上传失败')
}


export async function uploadForumFile(postId: number, file: File): Promise<void> {
  const form = new FormData(); form.append('file', file)
  const res = await api.post(`/forum/post/${postId}/files`, form, { timeout: 30000 })
  if (res.data?.code !== 0) throw new Error(res.data?.message || '附件上传失败')
}


export async function likeForumReply(id: number): Promise<boolean> {
  const res = await api.post(`/forum/reply/${id}/like`)
  if (res.data?.code !== 0) throw new Error(res.data?.message || '点赞失败')
  return Boolean(res.data?.data?.liked)
}

export async function reportForumReply(id: number, reason: string): Promise<void> {
  const res = await api.post(`/forum/reply/${id}/report`, { reason, detail: '' })
  if (res.data?.code !== 0) throw new Error(res.data?.message || '举报失败')
}

export async function deleteForumReply(id: number): Promise<void> {
  const res = await api.delete(`/forum/reply/${id}`)
  if (res.data?.code !== 0) throw new Error(res.data?.message || '删除失败')
}
