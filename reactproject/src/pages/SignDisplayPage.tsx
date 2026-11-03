import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

/**
 * Full-screen kiosk page showing the rotating sign-in QR code for an activity.
 * Mirrors the Vue SignDisplayPage: fetch /sign/qr/:id, then refresh just after
 * the QR expires (or retry after 5s on failure).
 */
export default function SignDisplayPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [image, setImage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const activityId = Number(id)
    let stopped = false
    let timer: ReturnType<typeof setTimeout> | undefined

    async function refresh() {
      if (!Number.isInteger(activityId) || activityId <= 0) {
        setError('活动 ID 无效')
        return
      }
      try {
        const response = await api.get(`/sign/qr/${activityId}`, {
          params: { origin: window.location.origin },
        })
        if (stopped) return
        const payload = response.data?.data ?? {}
        setImage(String(payload.image || ''))
        setError('')
        const delay = Math.max(1000, Number(payload.expiresAt) - Date.now() + 100)
        timer = setTimeout(() => { void refresh() }, delay)
      } catch (cause) {
        if (stopped) return
        const message = (cause as { response?: { data?: { message?: string } } })?.response?.data?.message
        setImage('')
        setError(message || '二维码生成失败')
        timer = setTimeout(() => { void refresh() }, 5000)
      }
    }

    void refresh()

    return () => {
      stopped = true
      if (timer) clearTimeout(timer)
    }
  }, [id])

  const backToActivity = () => {
    const activityId = Number(id)
    navigate(Number.isInteger(activityId) && activityId > 0 ? `/activity/${activityId}` : '/activity')
  }

  return (
    <div className="page-shell">
      <div className="bg" aria-hidden="true" />
      <main
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 760,
          margin: '0 auto',
          padding: '52px 16px 60px',
          textAlign: 'center',
        }}
      >
        <p className="card-k" style={{ letterSpacing: '.24em' }}>SIGN DISPLAY</p>
        <h1 style={{ margin: '10px 0 0', fontSize: 'clamp(28px, 5vw, 44px)' }}>现场签到</h1>
        <p className="desc" style={{ margin: '10px auto 26px', maxWidth: 560 }}>
          请参加者使用手机登录后扫描下方二维码。每人签到一次，自动获得 10 分。
        </p>

        {error ? (
          <div className="page-card error" style={{ maxWidth: 560, margin: '0 auto', fontSize: 13 }}>
            {error}
          </div>
        ) : (
          <div
            style={{
              width: 'fit-content',
              maxWidth: '100%',
              margin: '0 auto',
              padding: 20,
              borderRadius: 20,
              background: '#fff',
              boxShadow: '0 24px 60px rgba(0,0,0,.35)',
            }}
          >
            {image ? (
              <img
                src={image}
                alt="现场签到动态二维码"
                style={{ display: 'block', width: 320, maxWidth: '100%', height: 'auto', aspectRatio: '1 / 1' }}
              />
            ) : (
              <div
                style={{
                  width: 320,
                  height: 320,
                  maxWidth: '100%',
                  display: 'grid',
                  placeItems: 'center',
                  color: '#475569',
                  fontSize: 13,
                }}
              >
                二维码生成中...
              </div>
            )}
          </div>
        )}

        <p className="meta" style={{ marginTop: 22 }}>
          二维码每 30 秒自动更新，请扫描当前屏幕上的二维码。
        </p>
        <div className="page-actions-row" style={{ justifyContent: 'center', marginTop: 18 }}>
          <button className="page-btn" type="button" onClick={backToActivity}>返回活动</button>
        </div>
      </main>
    </div>
  )
}
