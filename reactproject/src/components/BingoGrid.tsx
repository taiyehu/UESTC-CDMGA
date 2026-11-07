export type BingoBoardCell = {
  maxScore?: number
  myScore?: number
  completed?: boolean
  myCompleted?: boolean
  mark?: string
}

type Props = {
  boardState: Map<number, BingoBoardCell> | BingoBoardCell[] | undefined
  activeCell?: number
  issueMarks?: Map<number, string>
  compact?: boolean
  onSelect: (cell: number) => void
}

const CELL_IDS = Array.from({ length: 25 }, (_, i) => i + 1)

export default function BingoGrid({ boardState, activeCell, issueMarks, compact = false, onSelect }: Props) {
  const cellAt = (id: number): BingoBoardCell | undefined => {
    if (!boardState) return undefined
    if (Array.isArray(boardState)) return boardState.find((cell: any) => Number(cell.cellId ?? cell.issueId) === id)
    return boardState.get(id)
  }
  return (
    <div className={compact ? 'bingo-detail-grid' : 'bingo-grid'}>
      {CELL_IDS.map((id) => {
        const state = cellAt(id)
        const done = Boolean(state?.myCompleted ?? state?.completed)
        const myScore = Number(state?.myScore || 0)
        const level = done && [2, 3, 5, 10, 15].includes(myScore) ? myScore : Number(state?.maxScore || 5)
        const mark = done ? String(issueMarks?.get(id) || state?.mark || '').trim() : ''
        return <button key={id} type="button" title={`第 ${id} 题`} aria-label={`第 ${id} 题`} className={`bingo-cell score-${level}${done ? ' done' : ''}${activeCell === id ? ' active' : ''}`} onClick={() => onSelect(id)}><b>{mark || String(level || 5)}</b>{done && <span>✓</span>}</button>
      })}
    </div>
  )
}
