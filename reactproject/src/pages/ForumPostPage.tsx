import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import PageShell from '../components/PageShell'
import { api, createForumReply, deleteForumReply, fetchForumPost, likeForumPost, likeForumReply, reportForumPost, reportForumReply, type ForumPostDetail } from '../api'

export default function ForumPostPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = (() => { try { return JSON.parse(sessionStorage.getItem('userInfo') || 'null') } catch { return null } })()
  const [post, setPost] = useState<ForumPostDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [reply, setReply] = useState('')
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
    try { setPost(await fetchForumPost(postId)) }
    catch (e) { setError(e instanceof Error ? e.message : '加载失败') }
    finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [id])

  async function sendReply() {
    const postId = Number(id); if (!reply.trim() || !postId) return
    setSending(true); setError('')
    try { await createForumReply(postId, reply.trim()); setReply(''); await load() }
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
            <h2>回复 {post.replies?.length ?? 0}</h2>
            <div className="forum-list">
              {(post.replies ?? []).slice(replyPage * 10, replyPage * 10 + 10).map((r) => <div className="page-card forum-row" key={r.id}>
                <div className="forum-main"><h3>{r.authorName}</h3><p className="post-content">{r.content}</p><div className="forum-actions">
                  <button className="page-btn small" type="button" onClick={async () => { try { const liked = await likeForumReply(r.id); setPost({ ...post, replies: post.replies.map((x) => x.id === r.id ? { ...x, liked, likeCount: Math.max(0, Number(x.likeCount || 0) + (liked ? 1 : -1)) } : x) }) } catch (e) { setReplyNotice(e instanceof Error ? e.message : '点赞失败') } }}>{r.liked ? '♥' : '♡'} {r.likeCount ?? 0} 点赞</button>
                  <button className="page-btn small" type="button" onClick={async () => { const reason = window.prompt('请输入举报原因', ''); if (reason === null) return; try { await reportForumReply(r.id, reason.trim() || '未填写原因'); setReplyNotice('举报已提交') } catch (e) { setReplyNotice(e instanceof Error ? e.message : '举报失败') } }}>举报</button>
                  {(Number(r.authorId) === Number(user?.id) || Number(post.authorId) === Number(user?.id)) && <button className="page-btn small" type="button" onClick={async () => { if (!window.confirm('确定删除这条回复吗？')) return; try { await deleteForumReply(r.id); setReplyNotice('回复已删除'); await load() } catch (e) { setReplyNotice(e instanceof Error ? e.message : '删除失败') } }}>删除</button>}
                </div></div>
                <span className="meta">{new Date(r.createdAt).toLocaleString('zh-CN')}</span>
              </div>)}
              {replyNotice && <p className="meta">{replyNotice}</p>}
            </div>
            {(post.replies?.length ?? 0) > 10 && <div className="page-pager"><button className="page-btn" type="button" disabled={replyPage === 0} onClick={() => setReplyPage((v) => v - 1)}>上一页</button><span>{replyPage + 1} / {Math.ceil((post.replies?.length ?? 0) / 10)}</span><button className="page-btn" type="button" disabled={(replyPage + 1) * 10 >= (post.replies?.length ?? 0)} onClick={() => setReplyPage((v) => v + 1)}>下一页</button></div>}
            <div className="page-card editor"><textarea className="page-input area" placeholder="写回复…" value={reply} onChange={(e) => setReply(e.target.value)} /><div className="page-actions-row"><button className="page-btn primary" type="button" disabled={sending} onClick={sendReply}>{sending ? '发送中…' : '回复'}</button></div></div>
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
