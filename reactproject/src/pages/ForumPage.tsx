import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageShell from '../components/PageShell'
import { createForumPost, fetchForumPage, likeForumPost, reportForumPost, uploadForumFile, uploadForumImage, type ForumPost } from '../api'

function fmt(value?: string) { if (!value) return ''; const d = new Date(value); return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('zh-CN') }

export default function ForumPage() {
  const [posts, setPosts] = useState<ForumPost[]>([])
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

  async function load(nextPage = page, nextSort = sort, nextMine = mine) {
    setLoading(true); setError('')
    try { const data = await fetchForumPage(nextPage, 10, nextSort, nextMine); setPosts(data.list); setTotal(data.total); setPage(nextPage) }
    catch (e) { setError(e instanceof Error ? e.message : '加载失败') }
    finally { setLoading(false) }
  }
  useEffect(() => { void load(0, 'latest', false) }, [])

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
    <PageShell title="FORUM" subtitle="社团大厅" actions={<button className="page-btn primary" type="button" onClick={() => setShowEditor((v) => !v)}>{showEditor ? '收起' : '发帖'}</button>}>
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
      <div className="forum-list">
        {posts.map((post) => (
          <article className="page-card forum-row" key={post.id}>
            <div className="forum-main">
              <Link to={`/forum/${post.id}`}><h3>{post.title}</h3></Link>
              <p className="meta">{post.authorName} · {fmt(post.createdAt)} · {post.replyCount} 回复</p>
              {post.images && post.images.length > 0 && <div className="forum-thumbs">{post.images.slice(0, 3).map((img) => <img key={img.id} src={img.url} alt="帖子图片" />)}</div>}
              {post.files && post.files.length > 0 && <div className="forum-files">{post.files.map((file) => <a key={file.id} href={file.url} target="_blank" rel="noreferrer">▧ {file.name}</a>)}</div>}
              <div className="forum-actions"><button className="page-btn small" type="button" disabled={liking === post.id} onClick={() => void like(post)}>{post.liked ? '♥' : '♡'} {post.likeCount} 点赞</button><button className="page-btn small" type="button" onClick={() => void report(post)}>举报</button><Link className="page-btn small" to={`/forum/${post.id}`}>查看 →</Link></div>
            </div>
          </article>
        ))}
      </div>
      {total > 10 && <div className="page-pager"><button className="page-btn" disabled={page === 0} onClick={() => void load(page - 1)}>上一页</button><span>{page + 1} / {Math.ceil(total / 10)}</span><button className="page-btn" disabled={(page + 1) * 10 >= total} onClick={() => void load(page + 1)}>下一页</button></div>}
    </PageShell>
  )
}
