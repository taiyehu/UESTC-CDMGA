import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { fetchMailCounts } from '../mail'

export default function MailBadge({ forum = false }: { forum?: boolean }) {
  const { pathname } = useLocation()
  const [count, setCount] = useState(0)
  useEffect(() => {
    let active = true
    const load = () => { if (!sessionStorage.getItem('userInfo')) return; void fetchMailCounts().then((counts) => { if (active) setCount(forum ? counts.forumPosts : counts.unread) }).catch(() => {}) }
    load()
    const timer = window.setInterval(load, 30000)
    window.addEventListener('mail-updated', load)
    return () => { active = false; window.clearInterval(timer); window.removeEventListener('mail-updated', load) }
  }, [pathname, forum])
  return count > 0 ? <span className="mail-badge" aria-label={`${count} 条未读`}>{count > 99 ? '99+' : count}</span> : null
}
