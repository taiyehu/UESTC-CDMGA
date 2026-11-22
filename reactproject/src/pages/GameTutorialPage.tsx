import { Link } from 'react-router-dom'
import PageShell from '../components/PageShell'

export default function GameTutorialPage() {
  return <PageShell title="桌游新手教程" subtitle="按提示亲手完成一段练习旅程" wide>
    <div className="game-room-shell">
      <div className="game-room-toolbar">
        <Link to="/game" style={{ color: 'white' }}>← 返回桌游列表</Link>
        <span>独立练习 · 进度自动保存</span>
      </div>
      <iframe className="game-room-frame" title="桌游新手教程" src="/game-client/?tutorial=1" allowFullScreen />
    </div>
  </PageShell>
}
