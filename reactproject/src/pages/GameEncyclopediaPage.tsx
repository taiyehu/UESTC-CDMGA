import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import PageShell from '../components/PageShell'
import './GameEncyclopediaPage.css'

type CardKind = 'hand' | 'events' | 'misfortunes' | 'treasures'
type Category = 'all' | CardKind
type Card = { id: string; name: string; effect: string; condition?: string; move?: number; cost?: number; image: string; quantity?: number }
type Catalog = Record<CardKind, Card[]>
type Entry = Card & { kind: CardKind }

const categories: { id: Category; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'hand', label: '手牌' },
  { id: 'events', label: '事件牌' },
  { id: 'misfortunes', label: '厄运牌' },
  { id: 'treasures', label: '宝物' },
]
const kindName: Record<CardKind, string> = { hand: '手牌', events: '事件牌', misfortunes: '厄运牌', treasures: '宝物' }

export default function GameEncyclopediaPage() {
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [category, setCategory] = useState<Category>('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Entry | null>(null)
  const [error, setError] = useState('')
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetch('/game-api/cards', { credentials: 'same-origin', signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw Error(response.status === 404 ? '桌游服务尚未更新，请重启桌游服务' : '卡牌目录加载失败')
        return response.json() as Promise<Catalog>
      })
      .then(data => {
        if (!Array.isArray(data.hand) || !Array.isArray(data.events) || !Array.isArray(data.misfortunes) || !Array.isArray(data.treasures)) throw Error('百科目录格式不正确，请更新桌游服务')
        setCatalog(data)
      })
      .catch(reason => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : '卡牌目录加载失败') })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (selected && !dialog.open) dialog.showModal()
    if (!selected && dialog.open) dialog.close()
  }, [selected])

  const entries: Entry[] = catalog ? (['hand', 'events', 'misfortunes', 'treasures'] as CardKind[])
    .flatMap(kind => catalog[kind].map(card => ({ ...card, kind }))) : []
  const query = search.trim().toLocaleLowerCase()
  const visible = entries.filter(card => (category === 'all' || card.kind === category) &&
    (!query || [card.id, card.name, card.effect, card.condition || ''].some(value => value.toLocaleLowerCase().includes(query))))
  const count = (kind: Category) => kind === 'all' ? entries.length : catalog?.[kind].length || 0

  return <PageShell title="桌游百科大全" subtitle="浏览全部手牌、事件牌、厄运牌与宝物" wide actions={<Link className="page-btn" to="/game">← 返回桌游课题</Link>}>
    <div className="encyclopedia-toolbar page-card">
      <div className="encyclopedia-tabs" role="tablist" aria-label="百科分类">
        {categories.map(item => <button key={item.id} type="button" role="tab" aria-selected={category === item.id}
          className={category === item.id ? 'active' : ''} onClick={() => setCategory(item.id)}>
          {item.label}<span>{count(item.id)}</span>
        </button>)}
      </div>
      <label className="encyclopedia-search">
        <span className="sr-only">搜索百科内容</span>
        <input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="搜索名称、编号或效果" />
      </label>
    </div>

    {error && <p role="alert" className="page-card error">{error}</p>}
    {!catalog && !error && <p role="status" className="page-card">正在加载百科内容…</p>}
    {catalog && <>
      <p className="encyclopedia-count">找到 {visible.length} 项内容</p>
      {visible.length ? <div className="encyclopedia-grid">
        {visible.map(card => <button className={`encyclopedia-card ${card.kind === 'treasures' ? 'encyclopedia-treasure' : ''}`} type="button" key={card.id} onClick={() => setSelected(card)} aria-label={`查看${kindName[card.kind]}「${card.name}」`}>
          <img src={card.image} alt={`${card.name}${card.kind === 'treasures' ? '图片' : '卡面'}`} loading="lazy" />
          <span className="encyclopedia-card-info"><span className="encyclopedia-kind">{kindName[card.kind]} · {card.id}</span><strong>{card.name}</strong>
            <small>{card.kind === 'hand' ? `${card.move === 7 ? '?' : card.move} 点 · ${card.cost} 金钱` : card.effect}</small></span>
        </button>)}
      </div> : <p className="page-card">没有找到符合条件的内容。</p>}
    </>}

    <dialog ref={dialogRef} className="encyclopedia-dialog" onClose={() => setSelected(null)} onClick={event => { if (event.target === event.currentTarget) setSelected(null) }} aria-label={selected ? `${selected.name}详情` : '百科详情'}>
      {selected && <div className="encyclopedia-detail">
        <button type="button" className="encyclopedia-close" onClick={() => setSelected(null)} aria-label="关闭卡牌详情">×</button>
        <img src={selected.image} alt={`${selected.name}${selected.kind === 'treasures' ? '图片' : '完整卡面'}`} />
        <div className="encyclopedia-detail-copy">
          <span className="encyclopedia-kind">{kindName[selected.kind]} · {selected.id}</span>
          <h2>{selected.name}</h2>
          {selected.kind === 'hand' && <p className="encyclopedia-stats"><span>移动点数 <b>{selected.move === 7 ? '?' : selected.move}</b></span><span>费用 <b>{selected.cost} 金钱</b></span></p>}
          <h3>效果</h3><p>{selected.effect}</p>
          {selected.kind === 'hand' && <><h3>使用条件</h3><p>{selected.condition || '无'}</p></>}
        </div>
      </div>}
    </dialog>
  </PageShell>
}
