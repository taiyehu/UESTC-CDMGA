import { api } from './api'

export type Mail = { id: number; kind: string; title: string; content: string; targetType: string | null; targetId: number | null; createdAt: string; readAt: string | null }
export type MailCounts = { unread: number; forumPosts: number }

export type MailCategory = 'all' | 'replies' | 'likes' | 'system' | 'review'
export async function fetchMail(page = 0, category: MailCategory = 'all'): Promise<{ list: Mail[]; total: number }> {
  const res = await api.get('/mail', { params: { page, size: 20, category } })
  if (res.data?.code !== 0) throw new Error(res.data?.message || '信箱加载失败')
  return res.data.data
}
export async function fetchMailCounts(): Promise<MailCounts> {
  const res = await api.get('/mail/counts')
  if (res.data?.code !== 0) throw new Error(res.data?.message || '未读数加载失败')
  return res.data.data
}
export async function readMail(id: number) { await api.post(`/mail/${id}/read`); window.dispatchEvent(new Event('mail-updated')) }
export async function readForumPost(id: number) { await api.post(`/mail/forum/${id}/read`); window.dispatchEvent(new Event('mail-updated')) }
export function mailTarget(mail: Mail): string | null {
  if (mail.targetType === 'bingo_score_admin') return '/admin/bingo-submissions'
  if (mail.kind === 'score_submitted' || mail.kind === 'score_processed' || mail.targetType === 'score_admin') return '/admin/scores'
  const id = Number(mail.targetId)
  if (!Number.isSafeInteger(id) || id <= 0) return null
  if (mail.targetType === 'course') return `/task/${id}`
  if (mail.targetType === 'activity') return `/activity/${id}`
  if (mail.targetType === 'forum') return `/forum/${id}`
  return null
}
