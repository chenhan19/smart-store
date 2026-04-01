import Taro from '@tarojs/taro'

// tabBar 页面列表，跳转时必须用 switchTab
const TAB_PAGES = new Set([
  '/pages/home/index',
  '/pages/inventory/list/index',
  '/pages/records/list/index',
  '/pages/statistics/index',
])

export function navigateTo(url: string) {
  if (TAB_PAGES.has(url)) {
    Taro.switchTab({ url })
  } else {
    Taro.navigateTo({ url })
  }
}

export function redirectTo(url: string) {
  if (TAB_PAGES.has(url)) {
    Taro.switchTab({ url })
  } else {
    Taro.redirectTo({ url })
  }
}
