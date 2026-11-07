import { useCallback, useEffect, useState } from 'react'
import type { ChangeEvent, CSSProperties } from 'react'
import PageShell from '../components/PageShell'
import { api } from '../api'

type CourseRow = {
  id: number
  title: string
  category: string
  startTime: string | null
  endTime: string | null
  description: string
  image: string
  awardCost: number | null
  awardStock: number | null
  remainingStock: number | null
}

type Notice = { type: 'ok' | 'error'; text: string }

const PAGE_SIZE = 5
const CATEGORY_OPTIONS = ['typical', 'bingo', 'legacy', 'award', 'sign'] as const
const center = { textAlign: 'center' } as const
const cellInput: CSSProperties = { width: '100%', marginTop: 0 }

function getImageUrl(imagePath?: string | null): string {
  if (!imagePath) return ''
  if (/^https?:\/\//.test(imagePath)) return imagePath
  return imagePath.startsWith('/') ? imagePath : `/${imagePath}`
}

function normalizeDateTime(value: unknown): string | null {
  if (!value) return null
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return null
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function isPresetCategory(category: string): boolean {
  return (CATEGORY_OPTIONS as readonly string[]).includes(category)
}

function toCourseRow(course: any): CourseRow {
  const award = course?.award ?? null
  return {
    id: Number(course?.id ?? 0),
    title: String(course?.title || ''),
    category: String(course?.category || 'typical'),
    startTime: normalizeDateTime(course?.start_time || course?.startTime),
    endTime: normalizeDateTime(course?.end_time || course?.endTime),
    description: String(course?.description || ''),
    image: String(course?.image || ''),
    awardCost: award?.cost == null ? null : Number(award.cost),
    awardStock: award?.totalStock == null ? null : Number(award.totalStock),
    remainingStock: award?.remainingStock == null ? null : Number(award.remainingStock),
  }
}

function errorMessage(error: unknown, fallback: string): string {
  const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
  if (message) return message
  if (error instanceof Error && error.message) return error.message
  return fallback
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<CourseRow[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState<Notice | null>(null)
  const [savingMap, setSavingMap] = useState<Record<number, boolean>>({})
  const [uploadingMap, setUploadingMap] = useState<Record<number, boolean>>({})
  const [preview, setPreview] = useState('')
  const [jump, setJump] = useState('')

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const load = useCallback(async (targetPage: number, silent = false) => {
    if (!silent) setLoading(true)
    setError('')
    try {
      const res = await api.get('/course/allcourse', { params: { page: targetPage - 1, size: PAGE_SIZE } })
      const payload = res.data ?? {}
      const list = Array.isArray(payload.list)
        ? payload.list
        : Array.isArray(payload.data?.list)
          ? payload.data.list
          : []
      setCourses(list.map((item: any) => toCourseRow(item)))
      setTotal(Number(payload.total ?? payload.data?.total ?? 0) || 0)
    } catch (e) {
      setCourses([])
      setTotal(0)
      setError(errorMessage(e, '获取课题信息失败'))
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load(page)
  }, [page, load])

  useEffect(() => {
    if (!preview) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPreview('')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [preview])

  function goPage(target: number) {
    const next = Math.min(totalPages, Math.max(1, Math.trunc(target) || 1))
    setJump('')
    if (next === page) {
      void load(next)
      return
    }
    setPage(next)
  }

  function jumpTo() {
    if (jump.trim() === '') return
    const target = Number(jump)
    if (!Number.isFinite(target)) return
    goPage(target)
  }

  function updateRow(id: number, patch: Partial<CourseRow>) {
    setCourses((prev) => prev.map((course) => (course.id === id ? { ...course, ...patch } : course)))
  }

  async function deleteCourse(courseId: number) {
    if (!window.confirm('确定删除该课题吗？')) return
    try {
      const res = await api.delete(`/course/${courseId}`)
      if (res.status === 204 || res.data?.code === 0) {
        setNotice({ type: 'ok', text: '课题删除成功' })
        if (courses.length === 1 && page > 1) {
          setJump('')
          setPage(page - 1)
        } else {
          await load(page, true)
        }
      } else {
        setNotice({ type: 'error', text: '删除失败' })
      }
    } catch (e) {
      setNotice({ type: 'error', text: errorMessage(e, '删除失败') })
    }
  }

  async function saveCourse(course: CourseRow) {
    if (savingMap[course.id]) return

    const category = course.category.trim()
    const payload = {
      id: course.id,
      title: course.title.trim(),
      category,
      startTime: course.startTime,
      endTime: course.endTime,
      description: course.description.trim(),
      image: course.image.trim(),
      awardCost: category === 'award' ? course.awardCost : null,
      awardStock: category === 'award' ? course.awardStock : null,
    }

    if (!payload.id || !payload.title || !payload.category || !payload.startTime || !payload.endTime || !payload.description || !payload.image) {
      setNotice({ type: 'error', text: '请填写所有必填项' })
      return
    }
    if (payload.category === 'award' && (payload.awardCost == null || !Number.isInteger(payload.awardCost) || payload.awardCost <= 0)) {
      setNotice({ type: 'error', text: '奖品兑换积分必须是大于 0 的整数' })
      return
    }
    if (payload.category === 'award' && (payload.awardStock == null || !Number.isInteger(payload.awardStock) || payload.awardStock <= 0)) {
      setNotice({ type: 'error', text: '奖品数量必须是大于 0 的整数' })
      return
    }

    setSavingMap((prev) => ({ ...prev, [course.id]: true }))
    try {
      const res = await api.put(`/course/update/${payload.id}`, {
        title: payload.title,
        category: payload.category,
        startTime: payload.startTime,
        endTime: payload.endTime,
        description: payload.description,
        image: payload.image,
        awardCost: payload.awardCost,
        awardStock: payload.awardStock,
      })

      if (res.data?.code === 0) {
        setNotice({ type: 'ok', text: '课题修改成功' })
        updateRow(course.id, {
          title: payload.title,
          category: payload.category,
          description: payload.description,
          image: payload.image,
        })
        await load(page, true)
      } else {
        setNotice({ type: 'error', text: res.data?.message || '课题修改失败' })
      }
    } catch (e) {
      setNotice({ type: 'error', text: errorMessage(e, '课题修改失败') })
    } finally {
      setSavingMap((prev) => ({ ...prev, [course.id]: false }))
    }
  }

  async function onPickImage(event: ChangeEvent<HTMLInputElement>, row: CourseRow) {
    const input = event.target
    const file = input.files?.[0]
    input.value = ''
    if (!file) return

    setUploadingMap((prev) => ({ ...prev, [row.id]: true }))
    try {
      const formData = new FormData()
      formData.append('image', file, file.name)
      const res = await api.post('/course/upload', formData)
      if (res.data?.code === 0) {
        updateRow(row.id, { image: String(res.data.data || '') })
        setNotice({ type: 'ok', text: `课题 #${row.id} 图片已更新` })
      } else {
        setNotice({ type: 'error', text: res.data?.message || '图片上传失败' })
      }
    } catch (e) {
      setNotice({ type: 'error', text: errorMessage(e, '图片上传失败') })
    } finally {
      setUploadingMap((prev) => ({ ...prev, [row.id]: false }))
    }
  }

  return (
    <PageShell
      title="ADMIN · COURSES"
      subtitle="课题列表 · 编辑保存、删除与图片维护"
      actions={
        <>
          <span className="meta" style={{ marginRight: 4 }}>共 {total} 条</span>
          <button className="page-btn" type="button" disabled={loading} onClick={() => void load(page)}>
            刷新
          </button>
        </>
      }
    >
      {notice && (
        <div className={`page-card${notice.type === 'error' ? ' error' : ''}`} style={{ marginBottom: 12 }}>
          {notice.text}
        </div>
      )}

      {loading && <div className="page-card">载入中…</div>}
      {!loading && error && <div className="page-card error">{error}</div>}
      {!loading && !error && !courses.length && <div className="page-card">暂无课题</div>}

      {!loading && !error && courses.length > 0 && (
        <div className="page-card" style={{ overflowX: 'auto' }}>
          <table className="page-table">
            <thead>
              <tr>
                <th style={center}>ID</th>
                <th style={center}>课题名称</th>
                <th style={center}>兑换积分</th>
                <th style={center}>奖品数量</th>
                <th style={center}>类别</th>
                <th style={center}>开始时间</th>
                <th style={center}>结束时间</th>
                <th style={{ ...center, width: '36rem' }}>描述</th>
                <th style={center}>图片</th>
                <th style={center}>操作</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id}>
                  <td className="mono" style={center}>{course.id}</td>
                  <td style={{ minWidth: 150 }}>
                    <input
                      className="page-input"
                      style={cellInput}
                      value={course.title}
                      placeholder="课题名称"
                      onChange={(e) => updateRow(course.id, { title: e.target.value })}
                    />
                  </td>
                  <td style={{ ...center, minWidth: 92 }}>
                    {course.category === 'award' ? (
                      <input
                        className="page-input"
                        style={cellInput}
                        type="number"
                        min={1}
                        step={1}
                        placeholder="积分"
                        value={course.awardCost ?? ''}
                        onChange={(e) => updateRow(course.id, { awardCost: e.target.value === '' ? null : Number(e.target.value) })}
                      />
                    ) : <span>-</span>}
                  </td>
                  <td style={{ ...center, minWidth: 108 }}>
                    {course.category === 'award' ? (
                      <>
                        <input
                          className="page-input"
                          style={cellInput}
                          type="number"
                          min={1}
                          step={1}
                          placeholder="总数"
                          value={course.awardStock ?? ''}
                          onChange={(e) => updateRow(course.id, { awardStock: e.target.value === '' ? null : Number(e.target.value) })}
                        />
                        <span className="meta">剩余 {course.remainingStock ?? '-'}</span>
                      </>
                    ) : <span>-</span>}
                  </td>
                  <td style={{ minWidth: 104 }}>
                    <select
                      className="page-select"
                      value={course.category}
                      onChange={(e) => updateRow(course.id, { category: e.target.value })}
                    >
                      {!isPresetCategory(course.category) && <option value={course.category}>{course.category}</option>}
                      {CATEGORY_OPTIONS.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ minWidth: 176 }}>
                    <input
                      className="page-input"
                      style={cellInput}
                      type="datetime-local"
                      step={1}
                      value={course.startTime ?? ''}
                      onChange={(e) => updateRow(course.id, { startTime: e.target.value || null })}
                    />
                  </td>
                  <td style={{ minWidth: 176 }}>
                    <input
                      className="page-input"
                      style={cellInput}
                      type="datetime-local"
                      step={1}
                      value={course.endTime ?? ''}
                      onChange={(e) => updateRow(course.id, { endTime: e.target.value || null })}
                    />
                  </td>
                  <td style={{ minWidth: 240, verticalAlign: 'top' }}>
                    <textarea
                      className="page-input area"
                      style={cellInput}
                      rows={4}
                      placeholder="课题描述"
                      value={course.description}
                      onChange={(e) => updateRow(course.id, { description: e.target.value })}
                    />
                  </td>
                  <td style={{ ...center, minWidth: 116 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      {course.image ? (
                        <img
                          src={getImageUrl(course.image)}
                          alt="课题图片"
                          loading="lazy"
                          onClick={() => setPreview(getImageUrl(course.image))}
                          style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover', border: '1px solid rgba(34,211,238,.35)', cursor: 'zoom-in', display: 'block' }}
                        />
                      ) : <span>-</span>}
                      <input
                        id={`course-img-${course.id}`}
                        type="file"
                        accept="image/*"
                        disabled={Boolean(uploadingMap[course.id])}
                        onChange={(event) => void onPickImage(event, course)}
                        style={{ display: 'none' }}
                      />
                      <button
                        className="page-btn small"
                        type="button"
                        disabled={Boolean(uploadingMap[course.id])}
                        onClick={() => document.getElementById(`course-img-${course.id}`)?.click()}
                      >
                        {uploadingMap[course.id] ? '上传中...' : '重新上传'}
                      </button>
                    </div>
                  </td>
                  <td style={center}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                      <button
                        className="page-btn small"
                        type="button"
                        disabled={Boolean(savingMap[course.id])}
                        onClick={() => void saveCourse(course)}
                      >
                        {savingMap[course.id] ? '保存中…' : '保存'}
                      </button>
                      <button
                        className="page-btn small"
                        type="button"
                        style={{ borderColor: 'rgba(255,143,163,.55)', color: '#FF8FA3' }}
                        onClick={() => void deleteCourse(course.id)}
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && (
        <div className="page-pager">
          <span className="meta">共 {total} 条</span>
          <button className="page-btn small" type="button" disabled={page <= 1} onClick={() => goPage(1)}>首页</button>
          <button className="page-btn small" type="button" disabled={page <= 1} onClick={() => goPage(page - 1)}>上一页</button>
          <span className="mono">{page} / {totalPages}</span>
          <button className="page-btn small" type="button" disabled={page >= totalPages} onClick={() => goPage(page + 1)}>下一页</button>
          <button className="page-btn small" type="button" disabled={page >= totalPages} onClick={() => goPage(totalPages)}>尾页</button>
          <input
            className="page-input"
            type="number"
            min={1}
            max={totalPages}
            placeholder="页码"
            value={jump}
            onChange={(e) => setJump(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') jumpTo() }}
            style={{ width: 72, marginTop: 0 }}
          />
          <button className="page-btn small" type="button" onClick={jumpTo} disabled={loading}>跳转</button>
        </div>
      )}

      {preview && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(2,6,23,.72)', padding: 20 }}
          onClick={(event) => { if (event.target === event.currentTarget) setPreview('') }}
        >
          <div style={{ width: 'min(900px, 96vw)', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <button className="page-btn small" type="button" style={{ marginBottom: 12 }} onClick={() => setPreview('')}>关闭</button>
            <img src={preview} alt="图片预览" style={{ width: '100%', maxHeight: '82vh', objectFit: 'contain', borderRadius: 10 }} />
          </div>
        </div>
      )}
    </PageShell>
  )
}
