import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import PageShell from '../components/PageShell'
import { readForumPost } from '../mail'
import { api, createForumReply, deleteForumReply, fetchForumPost, likeForumPost, likeForumReply, reportForumPost, reportForumReply, uploadForumReplyImage, type ForumPostDetail, type ForumReply } from '../api'
import './ForumPostPage.css'

function groupReplies(replies: ForumReply[], sort: 'latest' | 'likes') {
  const groups = new Map<number, { root: ForumReply; children: ForumReply[] }>()
  for (const reply of replies) if (!reply.parentReplyId) groups.set(reply.id, { root: reply, children: [] })
  for (const reply of replies) {
    if (!reply.parentReplyId) continue
    const rootId = reply.rootReplyId || reply.parentReplyId
    const group = groups.get(rootId)
    if (group) group.children.push(reply)
    else groups.set(rootId, { root: reply, children: [] })
  }
  const result = [...groups.values()]
  for (const group of result) group.children.sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id - b.id)
  if (sort === 'likes') result.sort((a, b) => Number(b.root.likeCount || 0) - Number(a.root.likeCount || 0) || b.root.createdAt.localeCompare(a.root.createdAt) || b.root.id - a.root.id)
  else result.sort((a, b) => a.root.createdAt.localeCompare(b.root.createdAt) || a.root.id - b.root.id)
  return result
}

export default function ForumPostPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = (() => { try { return JSON.parse(sessionStorage.getItem('userInfo') || 'null') } catch { return null } })()
  const [post, setPost] = useState<ForumPostDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [reply, setReply] = useState('')
  const [replyImage, setReplyImage] = useState<File | null>(null)
  const [replyTarget, setReplyTarget] = useState<ForumReply | null>(null)
  const [replySort, setReplySort] = useState<'latest' | 'likes'>('latest')
  const replyEditorRef = useRef<HTMLDivElement>(null)
  const [sending, setSending] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [replyNotice, setReplyNotice] = useState('')
  const [replyPage, setReplyPage] = useState(0)
  const isOwn = Boolean(post && user && Number(post.authorId) === Number(user.id))

  async function load() {
    const postId = Number(id)
    if (!Number.isFinite(postId)) { setError('帖子编号无效'); setLoading(false); return }
    setReplyPage(0)
    setLoading(true)
    try { setPost(await fetchForumPost(postId, replySort)); void readForumPost(postId).catch(() => {}) }
    catch (e) { setError(e instanceof Error ? e.message : '加载失败') }
    finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [id, replySort])

  function chooseReply(target: ForumReply) {
    setReplyTarget(target)
    replyEditorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  async function sendReply() {
    const postId = Number(id); if (!reply.trim() || !postId) return
    setSending(true); setError('')
    try {
      const replyId = await createForumReply(postId, reply.trim(), replyTarget?.id ?? null)
      let uploadFailed = false
      if (replyImage) { try { await uploadForumReplyImage(replyId, replyImage) } catch { uploadFailed = true } }
      setReply(''); setReplyImage(null); setReplyTarget(null); await load()
      if (uploadFailed) setReplyNotice('回复已发布，图片上传失败')
    }
    catch (e) { setError(e instanceof Error ? e.message : '回复失败') }
    finally { setSending(false) }
  }

  function openEdit() {
    if (!post) return
    setEditTitle(post.title); setEditContent(post.content); setEditOpen(true); setNotice('')
  }

  async function saveEdit() {
    if (!post || !editTitle.trim() || !editContent.trim()) { setNotice('标题和正文不能为空'); return }
    setSaving(true); setNotice('')
    try { await api.patch(`/forum/posts/${post.id}`, { title: editTitle.trim(), content: editContent.trim() }); setEditOpen(false); setNotice('帖子已更新'); await load() }
    catch (e) { setNotice(e instanceof Error ? e.message : '更新失败') }
    finally { setSaving(false) }
  }

  async function removePost() {
    if (!post || !window.confirm('确定删除这篇帖子吗？')) return
    try { await api.delete(`/forum/post/${post.id}`); navigate('/forum') }
    catch (e) { setNotice(e instanceof Error ? e.message : '删除失败') }
  }

  async function likeReply(target: ForumReply) {
    try {
      const liked = await likeForumReply(target.id)
      setPost((current) => current ? { ...current, replies: current.replies.map((item) => item.id === target.id ? { ...item, liked, likeCount: Math.max(0, Number(item.likeCount || 0) + (liked ? 1 : -1)) } : item) } : current)
    } catch (e) { setReplyNotice(e instanceof Error ? e.message : '点赞失败') }
  }

  async function reportReply(target: ForumReply) {
    const reason = window.prompt('请输入举报原因', '')
    if (reason === null) return
    try { await reportForumReply(target.id, reason.trim() || '未填写原因'); setReplyNotice('举报已提交') }
    catch (e) { setReplyNotice(e instanceof Error ? e.message : '举报失败') }
  }

  async function removeReply(target: ForumReply) {
    if (!window.confirm(`确定删除 ${target.authorName} 的回复吗？`)) return
    try { await deleteForumReply(target.id); setReplyNotice('回复已删除'); await load() }
    catch (e) { setReplyNotice(e instanceof Error ? e.message : '删除失败') }
  }

  function renderReply(target: ForumReply, nested = false) {
    return <article className={`forum-thread-item${nested ? ' nested' : ''}`} key={target.id}>
      <Link to={target.authorId ? `/profile/${target.authorId}` : '/profile'}><img className="forum-thread-avatar" src={target.avatar || '/club-logo.jpg'} alt="" /></Link>
      <div className="forum-thread-body">
        <div className="forum-thread-heading"><Link to={target.authorId ? `/profile/${target.authorId}` : '/profile'}>{target.authorName}</Link>{Number(target.authorId) === Number(post?.authorId) && <span className="forum-thread-tag">楼主</span>}{target.status && target.status !== 'visible' && <span className="forum-thread-tag">{target.status === 'hidden' ? '举报后隐藏' : '已删除'}</span>}{!nested && target.floorNumber && <span className="forum-thread-floor">{target.floorNumber} 楼</span>}</div>
        {target.parentReplyId && target.parentAuthorName && <div className="forum-thread-parent">回复 @{target.parentAuthorName}</div>}
        <p className="forum-thread-content">{target.content}</p>
        {target.images?.map((image) => <a href={image.url} target="_blank" rel="noreferrer" key={image.id}><img className="forum-thread-image" src={image.url} alt="回复图片" /></a>)}
        <div className="forum-thread-actions"><time>{new Date(target.createdAt).toLocaleString('zh-CN')}</time>{(!target.status || target.status === 'visible') && <><button type="button" onClick={() => void likeReply(target)}>{target.liked ? '♥' : '♡'} {target.likeCount ?? 0}</button><button type="button" onClick={() => chooseReply(target)}>回复</button>{Number(target.authorId) !== Number(user?.id) && <button type="button" onClick={() => void reportReply(target)}>举报</button>}</>}{(Number(target.authorId) === Number(user?.id) || Number(post?.authorId) === Number(user?.id)) && target.status !== 'deleted' && <button type="button" onClick={() => void removeReply(target)}>删除</button>}</div>
      </div>
    </article>
  }

  const replyGroups = groupReplies(post?.replies ?? [], replySort)

  return (
    <PageShell hideHead>
      <div className="page-actions-row"><Link className="page-btn" to="/forum">← 返回论坛</Link></div>
      {loading && <div className="page-card">载入中…</div>}
      {error && <div className="page-card error">{error}</div>}
      {!loading && !error && !post && <div className="page-card">帖子不存在</div>}
      {post && (
        <>
          <article className="page-card post-detail">
            <div className="card-k">{post.authorName} · {new Date(post.createdAt).toLocaleString('zh-CN')}</div>
            <h2>{post.title}</h2>
            <p className="post-content">{post.content}</p>
            {post.files && post.files.length > 0 && <div className="forum-files">{post.files.map((file) => <a key={file.id} href={file.url} target="_blank" rel="noreferrer">▧ {file.name}</a>)}</div>}
            {post.images && post.images.length > 0 && <div className="forum-thumbs">{post.images.map((img) => <img key={img.id} src={img.url} alt="帖子图片" />)}</div>}
            <div className="forum-actions">
              <button className="page-btn small" type="button" onClick={async () => { try { const liked = await likeForumPost(post.id); setPost({ ...post, liked, likeCount: Math.max(0, Number(post.likeCount || 0) + (liked ? 1 : -1)) }) } catch (e) { setNotice(e instanceof Error ? e.message : '点赞失败') } }}>{post.liked ? '♥' : '♡'} {post.likeCount} 点赞</button>
              <button className="page-btn small" type="button" onClick={async () => { const reason = window.prompt('请输入举报原因', ''); if (reason === null) return; try { await reportForumPost(post.id, reason.trim() || '未填写原因'); setNotice('举报已提交') } catch (e) { setNotice(e instanceof Error ? e.message : '举报失败') } }}>举报</button>
              {isOwn && <><button className="page-btn small" type="button" onClick={openEdit}>编辑</button><button className="page-btn small" type="button" onClick={() => void removePost()}>删除</button></>}
            </div>
            {notice && <p className="meta">{notice}</p>}
          </article>
          <section className="section-block">
            <div className="forum-thread-section-head"><h2>评论 {post.replies?.length ?? 0}</h2><div className="forum-thread-sort"><button type="button" className={replySort === 'latest' ? 'active' : ''} onClick={() => setReplySort('latest')}>时间顺序</button><button type="button" className={replySort === 'likes' ? 'active' : ''} onClick={() => setReplySort('likes')}>最多点赞</button></div></div>
            <div className="page-card forum-thread-panel">
              {post.status === 'visible' && <div className="forum-thread-editor" ref={replyEditorRef}><strong>{replyTarget ? `回复 @${replyTarget.authorName}` : '发表你的评论'}</strong>{replyTarget && <button className="forum-thread-cancel" type="button" onClick={() => setReplyTarget(null)}>取消指定回复</button>}<textarea className="page-input area" maxLength={3000} placeholder="发一条友善的评论吧…" value={reply} onChange={(e) => setReply(e.target.value)} /><label className="forum-thread-upload">添加图片（最多 1 张）<input type="file" accept="image/*" onChange={(e) => { setReplyImage(e.target.files?.[0] ?? null); e.target.value = '' }} /></label>{replyImage && <span className="forum-thread-file">{replyImage.name} <button type="button" onClick={() => setReplyImage(null)}>移除</button></span>}<div className="page-actions-row"><button className="page-btn primary" type="button" disabled={sending || !reply.trim()} onClick={() => void sendReply()}>{sending ? '发送中…' : '发布评论'}</button></div></div>}
              {replyGroups.length === 0 && <p className="forum-thread-empty">还没有评论，来聊聊吧。</p>}
              {replyGroups.slice(replyPage * 10, replyPage * 10 + 10).map((group) => <div className="forum-thread" key={group.root.id}>{renderReply(group.root)}{group.children.length > 0 && <div className="forum-thread-children">{group.children.map((child) => renderReply(child, true))}</div>}</div>)}
              {replyNotice && <p className="meta">{replyNotice}</p>}
            </div>
            {replyGroups.length > 10 && <div className="page-pager"><button className="page-btn" type="button" disabled={replyPage === 0} onClick={() => setReplyPage((v) => v - 1)}>上一页</button><span>{replyPage + 1} / {Math.ceil(replyGroups.length / 10)}</span><button className="page-btn" type="button" disabled={(replyPage + 1) * 10 >= replyGroups.length} onClick={() => setReplyPage((v) => v + 1)}>下一页</button></div>}
          </section>
        </>
      )}
      {editOpen && post && (
        <div className="score-modal-mask" role="dialog" aria-modal="true" aria-label="编辑帖子">
          <div className="score-modal">
            <div className="score-modal-head"><div><div className="card-k">EDIT POST</div><h2>编辑帖子</h2></div><button className="icon-btn" type="button" aria-label="关闭" onClick={() => setEditOpen(false)}>×</button></div>
            <label className="score-label">标题</label><input className="page-input" maxLength={120} value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            <label className="score-label">正文</label><textarea className="page-input area" maxLength={10000} value={editContent} onChange={(e) => setEditContent(e.target.value)} />
            <div className="page-actions-row"><button className="page-btn primary" type="button" disabled={saving} onClick={() => void saveEdit()}>{saving ? '保存中…' : '保存'}</button><button className="page-btn" type="button" onClick={() => setEditOpen(false)}>取消</button></div>
          </div>
        </div>
      )}
    </PageShell>
  )
}
