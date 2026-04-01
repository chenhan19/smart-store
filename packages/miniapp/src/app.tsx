import { Component, PropsWithChildren } from 'react'
import Taro from '@tarojs/taro'
import { useAuthStore } from './store/authStore'
import { useShopStore } from './store/shopStore'
import './app.scss'

class App extends Component<PropsWithChildren> {
  async componentDidMount() {
    const token = useAuthStore.getState().loadTokenFromStorage()
    if (!token) return // 无 token，停在登录页

    try {
      // 用 token 重新拉取店铺列表（同时验证 token 有效性）
      const res = await Taro.request({
        url: `${TARO_APP_API_URL}/api/shops`,
        method: 'GET',
        header: { Authorization: `Bearer ${token}` },
      })

      if (res.statusCode === 401) {
        // token 过期，清除并停在登录页
        useAuthStore.getState().logout()
        return
      }

      const shops: any[] = res.data?.data || []
      useShopStore.getState().setShops(shops)

      if (shops.length === 0) {
        Taro.redirectTo({ url: '/pages/shop/create/index' })
        return
      }

      // 尝试恢复上次选中的店铺
      const lastShopId = useShopStore.getState().getLastShopId()
      const lastShop = lastShopId ? shops.find((s) => s.id === lastShopId) : null
      const shopToUse = lastShop || shops[0]

      useShopStore.getState().setCurrentShop(shopToUse)
      Taro.switchTab({ url: '/pages/home/index' })
    } catch {
      // 网络异常，停在登录页让用户手动登录
    }
  }

  componentDidShow() {}
  componentDidHide() {}

  render() {
    return this.props.children
  }
}

export default App
