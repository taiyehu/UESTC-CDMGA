import PageShell from '../components/PageShell'
import { Link } from 'react-router-dom'

const links = [
  ['抽卡 Debuff 对决', 'https://qglint.github.io/cdmga_links/card_one/card_one.html', '体验抽卡对决玩法。'],
  ['抽 Arcaea 歌曲', 'https://qglint.github.io/cdmga_links/arcaea_radom/arc_radom.html', '随机抽取 Arcaea 歌曲。'],
  ['抽 Phigros 歌曲', 'https://qglint.github.io/cdmga_links/arcaea_radom/phi_radom.html', '随机抽取 Phigros 歌曲。'],
  ['猜歌抽曲', 'https://qglint.github.io/cdmga_links/draw2guess/draw2guess.html', '抽曲并猜歌。'],
  ['转播方案介绍', 'https://qglint.github.io/cdmga_links/docs/SCREEN.html', '简易比赛转播方案。'],
]

export default function LinksPage() {
  return (
    <PageShell title="LINKS" subtitle="社团功能组件">
      <div className="page-grid">
        <Link className="page-card" to="/game">
          <div className="card-k">BOARD GAME</div>
          <h3>桌游课题</h3>
          <p className="desc">查看所有桌游课题并进入房间。</p>
          <span className="page-btn small">查看课题 →</span>
        </Link>
        {links.map(([title, href, desc]) => (
          <a className="page-card" key={href} href={href} target="_blank" rel="noreferrer">
            <div className="card-k">TOOL</div>
            <h3>{title}</h3>
            <p className="desc">{desc}</p>
            <span className="page-btn small">打开 →</span>
          </a>
        ))}
      </div>
    </PageShell>
  )
}
