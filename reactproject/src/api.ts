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
  replyCount: number
  createdAt: string
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
