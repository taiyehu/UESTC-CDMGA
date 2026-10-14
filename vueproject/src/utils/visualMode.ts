import { ref } from 'vue'

/** 手机和平板默认使用轻量视觉模式，桌面浏览器可自行选择。 */
export function detectMobileBrowser(
  userAgent: string,
  platform: string,
  maxTouchPoints: number,
  userAgentDataMobile?: boolean,
): boolean {
  return userAgentDataMobile === true
    || /Android|iPhone|iPad|iPod|Mobile|Tablet|Silk|Kindle|webOS|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
    || (platform === 'MacIntel' && maxTouchPoints > 1)
}

const browserNavigator = typeof navigator === 'undefined' ? undefined : navigator
export const isMobileBrowser = browserNavigator !== undefined && detectMobileBrowser(
  browserNavigator.userAgent,
  browserNavigator.platform,
  browserNavigator.maxTouchPoints,
  (browserNavigator as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData?.mobile,
)

const modeOverride = typeof window === 'undefined'
  ? null
  : new URLSearchParams(window.location.search).get('visual')

const preferenceKey = 'desktop-visual-effects-enabled'
let savedPreference: string | null = null
try {
  savedPreference = typeof localStorage === 'undefined' ? null : localStorage.getItem(preferenceKey)
} catch {
  // 浏览器禁用存储时仍可在本次页面内切换。
}

export const isMobileLite = ref(
  modeOverride === 'lite'
  || (modeOverride !== 'full' && (isMobileBrowser || savedPreference === 'false')),
)

export function toggleDesktopVisualEffects(): void {
  if (isMobileBrowser) return
  isMobileLite.value = !isMobileLite.value
  try {
    localStorage.setItem(preferenceKey, String(!isMobileLite.value))
  } catch {
    // 存储不可用时保留当前页面中的选择。
  }
}
