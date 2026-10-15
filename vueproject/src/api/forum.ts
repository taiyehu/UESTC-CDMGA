import request from '@/utils/request'

export type ForumImage = { id: number; url: string }
export type ForumFile = { id: number; url: string; name: string }
export type ForumSort = 'latest' | 'likes'
export type ForumTitle = { titleName?: string | null; titleTier?: string | null; titleAcquisitionMethod?: string | null }
export type ForumReply = ForumTitle & {
  id: number
  postId: number
  parentReplyId: number | null
  rootReplyId: number
  floorNumber: number | null
  parentAuthorName: string | null
  authorId: number
  authorName: string
  avatar?: string
  content: string
  status: string
  createdAt: string
  likeCount: number
  liked: boolean | number
  images: ForumImage[]
}
export type ForumPost = ForumTitle & {
  id: number
  authorId: number
  authorName: string
  avatar?: string
  title: string
  content: string
  status: string
  createdAt: string
  likeCount: number
  replyCount: number
  liked: boolean | number
  images: ForumImage[]
  files: ForumFile[]
  replies?: ForumReply[]
}
export type Page<T> = { list: T[]; total: number }
export type ForumReport = {
  id: number
  postId: number | null
  replyId: number | null
  replyPostId: number | null
  reporterName: string
  reason: string
  detail?: string
  status: string
  targetText: string
  createdAt: string
}

function data<T>(response: any): T {
  if (response.data?.code !== 0) throw new Error(response.data?.message || '请求失败')
  return response.data.data as T
}

export const forumApi = {
  async posts(page = 0, mine = false, sort: ForumSort = 'latest'): Promise<Page<ForumPost>> {
    return data(await request.get('/forum/posts', { params: { page, size: 10, mine, sort }, withCredentials: true }))
  },
  async post(id: number, replySort: ForumSort = 'latest'): Promise<ForumPost> {
    return data(await request.get(`/forum/posts/${id}`, { params: { replySort }, withCredentials: true }))
  },
  async myAvatar(identityId: number): Promise<string | null> {
    const response = await request.get(`/profile/identity/${identityId}`, { withCredentials: true })
    const profile = response.data?.data || response.data
    return Number(profile?.status) === 1 ? profile?.avatar || profile?.avatarUrl || null : null
  },
  async createPost(title: string, content: string): Promise<number> {
    const response = data<{ id: number }>(await request.post('/forum/posts', { title, content }, { withCredentials: true }))
    return response.id
  },
  async createReply(postId: number, content: string, parentReplyId: number | null): Promise<number> {
    const response = data<{ id: number }>(await request.post(`/forum/posts/${postId}/replies`, { content, parentReplyId }, { withCredentials: true }))
    return response.id
  },
  async editPost(id: number, title: string, content: string): Promise<void> {
    data(await request.patch(`/forum/posts/${id}`, { title, content }, { withCredentials: true }))
  },
  async deleteContent(type: 'post' | 'reply', id: number): Promise<void> {
    data(await request.delete(`/forum/${type}/${id}`, { withCredentials: true }))
  },
  async upload(type: 'post' | 'reply', id: number, file: File): Promise<void> {
    const form = new FormData()
    form.append('image', file)
    data(await request.post(`/forum/${type}/${id}/images`, form, { withCredentials: true, timeout: 30000 }))
  },
  async uploadFile(postId: number, file: File): Promise<void> {
    const form = new FormData()
    form.append('file', file)
    data(await request.post(`/forum/posts/${postId}/files`, form, { withCredentials: true, timeout: 30000 }))
  },
  async removeImage(id: number): Promise<void> {
    data(await request.delete(`/forum/images/${id}`, { withCredentials: true }))
  },
  async removeFile(id: number): Promise<void> {
    data(await request.delete(`/forum/files/${id}`, { withCredentials: true }))
  },
  async like(type: 'post' | 'reply', id: number): Promise<boolean> {
    return data<{ liked: boolean }>(await request.post(`/forum/${type}/${id}/like`, null, { withCredentials: true })).liked
  },
  async report(type: 'post' | 'reply', id: number, reason: string, detail = ''): Promise<void> {
    data(await request.post(`/forum/${type}/${id}/report`, { reason, detail }, { withCredentials: true }))
  },
  async adminPosts(page = 0): Promise<Page<ForumPost>> {
    return data(await request.get('/forum/admin/posts', { params: { page, size: 20 }, withCredentials: true }))
  },
  async adminReports(page = 0): Promise<Page<ForumReport>> {
    return data(await request.get('/forum/admin/reports', { params: { page, size: 20 }, withCredentials: true }))
  },
  async actions(type: 'post' | 'reply', id: number): Promise<any[]> {
    return data(await request.get(`/forum/admin/${type}/${id}/actions`, { withCredentials: true }))
  },
  async edits(type: 'post' | 'reply', id: number): Promise<any[]> {
    return data(await request.get(`/forum/admin/${type}/${id}/edits`, { withCredentials: true }))
  },
  async moderate(type: 'post' | 'reply', id: number, decision: 'retain' | 'delete', reason: string): Promise<void> {
    data(await request.post(`/forum/admin/${type}/${id}/moderate`, { decision, reason }, { withCredentials: true }))
  },
}
