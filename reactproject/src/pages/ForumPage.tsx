import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageShell from '../components/PageShell'
import { api } from '../api'
import { readForumPost } from '../mail'
import { createForumPost, fetchForumPage, fetchForumPost, likeForumPost, reportForumPost, uploadForumFile, uploadForumImage, type ForumPost, type ForumPostDetail } from '../api'

function fmt(value?: string) { if (!value) return ''; const d = new Date(value); return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('zh-CN') }

export default function ForumPage() {
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [unreadPosts, setUnreadPosts] = useState<Record<number, number>>({})
  useEffect(() => { void api.get('/mail/forum-unread').then((res) => { const counts: Record<number, number> = {}; for (const row of res.data?.data ?? []) counts[Number(row.postId)] = Number(row.unread); setUnreadPosts(counts) }).catch(() => {}) }, [])
  const [hotPosts, setHotPosts] = useState<ForumPost[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [showEditor, setShowEditor] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [mine, setMine] = useState(false)
  const [sort, setSort] = useState<'latest' | 'likes'>('latest')
  const [liking, setLiking] = useState<number | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [expandedPost, setExpandedPost] = useState<ForumPostDetail | null>(null)
  const [expandedLoading, setExpandedLoading] = useState(false)
  const [commentPage, setCommentPage] = useState(0)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  async function toggleDetails(post: ForumPost) {
    if (expandedId === post.id) { setExpandedId(null); setExpandedPost(null); return }
    setExpandedId(post.id); setExpandedPost(null); setExpandedLoading(true); setCommentPage(0)
    try { setExpandedPost(await fetchForumPost(post.id)); if (unreadPosts[post.id]) { void readForumPost(post.id).then(() => setUnreadPosts((current) => { const next = { ...current }; delete next[post.id]; return next })).catch(() => {}) } }
    catch (e) { setNotice(e instanceof Error ? e.message : '动态详情加载失败') }
    finally { setExpandedLoading(false) }
  }

  async function load(nextPage = page, nextSort = sort, nextMine = mine) {
    setLoading(true); setError('')
    try { const data = await fetchForumPage(nextPage, 10, nextSort, nextMine); setPosts(data.list); setTotal(data.total); setPage(nextPage) }
    catch (e) { setError(e instanceof Error ? e.message : '加载失败') }
    finally { setLoading(false) }
  }
  useEffect(() => { void load(0, 'latest', false) }, [])
  useEffect(() => {
    if (!previewImage) return
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setPreviewImage(null) }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [previewImage])
  useEffect(() => {
    void fetchForumPage(0, 3, 'likes', false).then((data) => setHotPosts(data.list)).catch(() => setHotPosts([]))
  }, [])

  const activeUsers = posts.reduce<ForumPost[]>((users, post) => {
    if (post.authorId && !users.some((user) => user.authorId === post.authorId)) users.push(post)
    return users
  }, []).slice(0, 3)

  async function publish() {
    if (!title.trim() || !content.trim()) { setError('请填写标题和正文'); return }
    setSubmitting(true); setError(''); setNotice('')
    try {
      const id = await createForumPost(title.trim(), content.trim())
      for (const file of images) await uploadForumImage(id, file)
      for (const file of files) await uploadForumFile(id, file)
      setTitle(''); setContent(''); setImages([]); setFiles([]); setShowEditor(false); setNotice('发布成功')
      await load(0, sort, mine)
    } catch (e) { setError(e instanceof Error ? e.message : '发帖失败') }
    finally { setSubmitting(false) }
  }

  async function like(post: ForumPost) {
    if (liking !== null) return
    setLiking(post.id)
    try { const liked = await likeForumPost(post.id); setPosts((rows) => rows.map((r) => r.id === post.id ? { ...r, liked, likeCount: Math.max(0, Number(r.likeCount || 0) + (liked ? 1 : -1)) } : r)); if (sort === 'likes') await load(page, sort, mine) }
    catch (e) { setNotice(e instanceof Error ? e.message : '点赞失败') }
    finally { setLiking(null) }
  }

  async function report(post: ForumPost) {
    const reason = window.prompt('请输入举报原因', '')
    if (reason === null) return
    if (!reason.trim()) { setNotice('请填写举报原因'); return }
    try { await reportForumPost(post.id, reason.trim()); setNotice('举报已提交') }
    catch (e) { setNotice(e instanceof Error ? e.message : '举报失败') }
  }

  return (
    <PageShell wide title="FORUM" subtitle="社团大厅" actions={<button className="page-btn primary" type="button" onClick={() => setShowEditor((v) => !v)}>{showEditor ? '收起' : '发帖'}</button>}>
      <div className="forum-layout">
        <aside className="forum-sidebar" aria-label="论坛概览">
          <section className="page-card forum-sidebar-section">
            <h2>热点内容</h2>
            {hotPosts.map((post, index) => <Link className="forum-hot-item" to={`/forum/${post.id}`} key={post.id}>
              <span className="forum-hot-rank">{String(index + 1).padStart(2, '0')}</span>
              <span className="forum-hot-copy"><strong>{post.title}</strong><small>{post.likeCount ?? 0} 赞 · {post.replyCount ?? 0} 评论</small></span>
            </Link>)}
            {!hotPosts.length && <p className="meta">暂无热点内容</p>}
          </section>
          <section className="page-card forum-sidebar-section">
            <h2>活跃用户</h2>
            <div className="forum-active-users">
              {activeUsers.map((user) => <Link to={user.authorId ? `/profile/${user.authorId}` : '/profile'} className="forum-active-user" key={user.authorId} title={user.authorName}>
                <img src={user.avatar || '/club-logo.jpg'} alt="" />
                <span>{user.authorName}</span>
              </Link>)}
            </div>
            {!activeUsers.length && <p className="meta">暂无活跃用户</p>}
          </section>
        </aside>
        <div className="forum-main-column">
      <div className="forum-toolbar">
        <div className="forum-tabs"><button className={!mine ? 'on' : ''} type="button" onClick={() => { setMine(false); void load(0, sort, false) }}>全部动态</button><button className={mine ? 'on' : ''} type="button" onClick={() => { setMine(true); void load(0, sort, true) }}>我的帖子</button></div>
        <div className="forum-tabs"><button className={sort === 'latest' ? 'on' : ''} type="button" onClick={() => { setSort('latest'); void load(0, 'latest', mine) }}>最新</button><button className={sort === 'likes' ? 'on' : ''} type="button" onClick={() => { setSort('likes'); void load(0, 'likes', mine) }}>最多点赞</button></div>
      </div>
      {showEditor && (
        <div className="page-card editor">
          <input className="page-input" placeholder="起一个标题" maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea className="page-input area" placeholder="这一刻想和大家分享什么？" maxLength={10000} value={content} onChange={(e) => setContent(e.target.value)} />
          <label className="forum-upload">帖子图片（最多 6 张）<input type="file" accept="image/*" multiple onChange={(e) => setImages(Array.from(e.target.files || []).slice(0, 6))} /></label>
          {images.length > 0 && <p className="meta">已选择 {images.length} 张图片</p>}
          <label className="forum-upload">帖子附件（最多 3 个）<input type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files || []).slice(0, 3))} /></label>
          {files.length > 0 && <p className="meta">已选择 {files.length} 个附件</p>}
          <div className="page-actions-row"><button className="page-btn primary" type="button" disabled={submitting} onClick={() => void publish()}>{submitting ? '发布中…' : '发布'}</button></div>
        </div>
      )}
      {notice && <div className="page-card">{notice}</div>}
      {loading && <div className="page-card">载入中…</div>}
      {error && <div className="page-card error">{error}</div>}
      {!loading && !error && !posts.length && <div className="page-card">暂无帖子，等你开第一贴。</div>}
      <div className="forum-list forum-feed">
        {posts.map((post) => (
          <article className="page-card forum-row feed-post" key={post.id}>
            <header className="feed-author">
              <Link to={post.authorId ? `/profile/${post.authorId}` : '/profile'} className="feed-avatar"><img src={post.avatar || '/club-logo.jpg'} alt="" /></Link>
              <div className="feed-author-meta">
                <div className="feed-author-identity">
                  <Link to={post.authorId ? `/profile/${post.authorId}` : '/profile'} className="feed-author-name">{post.authorName}</Link>
                  {post.titleName && post.titleTier && <span className={`feed-title-badge ${post.titleTier}`} title={post.titleAcquisitionMethod || '称号'}>{post.titleName}</span>}
                </div>
                <time className="meta" dateTime={post.createdAt}>{fmt(post.createdAt)}</time>
              </div>
              <button className="feed-report" type="button" onClick={() => void report(post)}>举报</button>
            </header>
            <div className="feed-content-toggle">
              <Link to={`/forum/${post.id}`}><strong>{post.title}</strong>{unreadPosts[post.id] > 0 && <span className="mail-badge">{unreadPosts[post.id]}</span>}</Link>
              <div className={expandedId === post.id ? 'feed-preview expanded' : 'feed-preview'}>
                <p className="feed-content">{post.content || '查看这条动态的正文和评论'}</p>
                <div className="feed-expand-row">
                  <span className="feed-expand-rule" aria-hidden="true" />
                  <button className="feed-expand" type="button" aria-label={expandedId === post.id ? '收起正文' : '展开正文'} aria-expanded={expandedId === post.id} onClick={() => void toggleDetails(post)}>{expandedId === post.id ? <>收起 <span aria-hidden="true">↑</span></> : <>展开 <span aria-hidden="true">↓</span></>}</button>
                  <span className="feed-expand-rule" aria-hidden="true" />
                </div>
              </div>
            </div>
            {post.images && post.images.length > 0 && <div className={expandedId === post.id ? 'feed-media expanded' : 'feed-media'}>{post.images.slice(0, expandedId === post.id ? undefined : 3).map((img, index) => <button type="button" key={img.id} aria-label={`查看第 ${index + 1} 张图片`} onClick={() => setPreviewImage(img.url)}><img src={img.url} alt="动态图片" loading="lazy" /></button>)}</div>}
            {post.files && post.files.length > 0 && <div className="forum-files">{post.files.slice(0, 3).map((file) => <a key={file.id} href={file.url} target="_blank" rel="noreferrer">▧ {file.name}</a>)}</div>}
            <div className="forum-actions feed-actions">
              <button className="feed-action" type="button" disabled={liking === post.id} onClick={() => void like(post)}>{post.liked ? '♥' : '♡'} <span>{post.likeCount ?? 0}</span></button>
              <button className="feed-action" type="button" aria-expanded={expandedId === post.id} onClick={() => void toggleDetails(post)}>▤ <span>{post.replyCount ?? 0} 评论</span></button>
              <Link className="feed-action feed-open" to={`/forum/${post.id}`}>查看完整动态 <span>→</span></Link>
            </div>
            {expandedId === post.id && <section className="feed-comments" aria-label={`${post.title} 评论`}>
              {expandedLoading && <p className="meta">正在加载评论…</p>}
              {!expandedLoading && expandedPost && <>
                {expandedPost.replies.length === 0 ? <p className="meta">还没有评论</p> : expandedPost.replies.slice(commentPage * 10, commentPage * 10 + 10).map((reply) => <article className={`feed-comment${reply.parentReplyId ? ' forum-preview-nested' : ''}`} key={reply.id}>
                  <Link to={reply.authorId ? `/profile/${reply.authorId}` : '/profile'} className="feed-comment-avatar"><img src={reply.avatar || '/club-logo.jpg'} alt="" /></Link>
                  <div className="feed-comment-body"><div><Link to={reply.authorId ? `/profile/${reply.authorId}` : '/profile'} className="feed-comment-name">{reply.authorName}</Link>{reply.parentReplyId && reply.parentAuthorName && <span className="meta"> 回复 @{reply.parentAuthorName}</span>}<time className="meta" dateTime={reply.createdAt}>{fmt(reply.createdAt)}</time></div><p>{reply.content}</p></div>
                </article>)}
                {expandedPost.replies.length > 10 && <div className="feed-comment-pager"><button className="page-btn small" type="button" disabled={commentPage === 0} onClick={() => setCommentPage((v) => v - 1)}>上一页</button><span>{commentPage + 1} / {Math.ceil(expandedPost.replies.length / 10)}</span><button className="page-btn small" type="button" disabled={(commentPage + 1) * 10 >= expandedPost.replies.length} onClick={() => setCommentPage((v) => v + 1)}>下一页</button></div>}
                <Link className="feed-all-comments" to={`/forum/${post.id}`}>查看全部动态与评论 →</Link>
              </>}
            </section>}
          </article>
        ))}
      </div>
      {total > 10 && <div className="page-pager"><button className="page-btn" disabled={page === 0} onClick={() => void load(page - 1)}>上一页</button><span>{page + 1} / {Math.ceil(total / 10)}</span><button className="page-btn" disabled={(page + 1) * 10 >= total} onClick={() => void load(page + 1)}>下一页</button></div>}
        </div>
      </div>
      {previewImage && <div className="forum-image-viewer" role="dialog" aria-modal="true" aria-label="图片预览" onClick={() => setPreviewImage(null)}>
        <button className="forum-image-close" type="button" aria-label="关闭图片预览" onClick={() => setPreviewImage(null)}>×</button>
        <img src={previewImage} alt="动态大图" onClick={(event) => event.stopPropagation()} />
      </div>}
    </PageShell>
  )
}
