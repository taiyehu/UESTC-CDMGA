/** 实验开关：手机和平板默认使用轻量视觉模式，桌面浏览器保持原效果。 */
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
const modeOverride = typeof window === 'undefined'
  ? null
  : new URLSearchParams(window.location.search).get('visual')

export const isMobileLite = modeOverride === 'lite'
  || (modeOverride !== 'full' && browserNavigator !== undefined && detectMobileBrowser(
    browserNavigator.userAgent,
    browserNavigator.platform,
    browserNavigator.maxTouchPoints,
    (browserNavigator as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData?.mobile,
  ))
