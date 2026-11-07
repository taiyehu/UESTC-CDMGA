import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import PageShell from '../components/PageShell'
import { api } from '../api'

type CheckinResponse = {
  code?: number
  message?: string
  data?: { alreadyCheckedIn?: boolean } | null
}

/**
 * Landing page for the QR code scanned at an activity. The token is stripped
 * from the address bar before verification so it cannot be replayed from the
 * browser history, matching the Vue page.
 */
export default function SignCheckinPage() {
  const params = useParams()
  const activityId = params.activityId ?? params.id
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const activityNumber = Number(activityId)

  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [message, setMessage] = useState('')

  // React StrictMode mounts effects twice in development; guard the one-shot
  // check-in call so a token is never consumed twice.
  const startedKey = useRef('')

  useEffect(() => {
    const key = `${activityId ?? ''}:${token}`
    if (startedKey.current === key) return
    startedKey.current = key

    setLoading(true)
    setSuccess(false)
    setMessage('')

    const validActivity = Number.isInteger(activityNumber) && activityNumber > 0
    const cleanToken = token.trim()
    const pathname = window.location.pathname
    window.history.replaceState(window.history.state, '', pathname)

    if (!validActivity || !cleanToken) {
      setMessage('签到码无效，请重新扫描现场二维码')
      setLoading(false)
      return
    }

    async function checkin() {
      try {
        const response = await api.post<CheckinResponse>('/sign/checkin', {
          activityId: activityNumber,
          token: cleanToken,
        })
        const body = response.data
        if (body?.code !== 0 || !body?.data) {
          throw new Error(body?.message || '签到接口返回了无效结果，请联系管理员')
        }
        setSuccess(true)
        setMessage(
          body.data.alreadyCheckedIn
            ? '您已完成本次活动签到，无需重复签到。'
            : '签到成功，已自动获得 10 分！',
        )
      } catch (cause) {
        const error = cause as {
          isAxiosError?: boolean
          message?: string
          response?: { status?: number; data?: { message?: string } }
        }
        const status = error.response?.status
        const serverMessage = error.response?.data?.message
        if (status === 401) setMessage('登录状态已失效，请重新登录后扫描现场二维码')
        else if (status === 404) setMessage('服务器尚未部署签到接口，请联系管理员')
        else if (typeof status === 'number' && status >= 500) setMessage(serverMessage || '服务器未能保存签到成绩，请联系管理员检查服务日志')
        else if (serverMessage) setMessage(serverMessage)
        else if (!error.isAxiosError && error.message) setMessage(error.message)
        else if (!error.response) setMessage('无法连接签到服务，请检查网络后重新扫描')
        else setMessage(error.message || '签到失败，请联系管理员')
      } finally {
        setLoading(false)
      }
    }

    void checkin()
  }, [activityId, token, activityNumber])

  const validActivity = Number.isInteger(activityNumber) && activityNumber > 0

  return (
    <PageShell
      title="活动现场签到"
      subtitle={validActivity ? `活动 #${activityNumber}` : '签到码核验'}
    >
      <div className="page-card" style={{ maxWidth: 560, margin: '0 auto', padding: '36px 24px', textAlign: 'center' }}>
        {loading ? (
          <p className="meta" style={{ margin: 0 }}>正在核验签到码...</p>
        ) : (
          <p
            style={{
              margin: 0,
              fontSize: 14,
              lineHeight: 1.8,
              color: success ? '#86efac' : '#fda4af',
            }}
          >
            {message}
          </p>
        )}
      </div>

      <div className="page-actions-row" style={{ justifyContent: 'center', marginTop: 20 }}>
        <Link className="page-btn" to={validActivity ? `/activity/${activityNumber}` : '/activity'}>
          返回活动
        </Link>
      </div>
    </PageShell>
  )
}
