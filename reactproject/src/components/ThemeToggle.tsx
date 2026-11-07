import { useEffect, useState } from 'react'
import './ThemeToggle.css'

export default function ThemeToggle() {
  const [light, setLight] = useState(() => localStorage.getItem('theme') === 'light')
  useEffect(() => { document.documentElement.classList.toggle('light', light) }, [light])
  function toggle() {
    const next = !light
    setLight(next)
    localStorage.setItem('theme', next ? 'light' : 'dark')
    document.documentElement.classList.toggle('light', next)
  }
  return <button type="button" className="theme-toggle" role="switch" aria-checked={light} aria-label={light ? '切换深色模式' : '切换亮色模式'} title={light ? '切换深色模式' : '切换亮色模式'} onClick={toggle}>{light ? '☾' : '☀'}</button>
}
