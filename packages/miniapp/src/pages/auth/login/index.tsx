import { useState } from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAuthStore } from '../../../store/authStore'
import { useShopStore } from '../../../store/shopStore'
import { login } from '../../../services/authApi'
import { getShops } from '../../../services/shopApi'
import { redirectTo } from '../../../utils/navigate'
import './index.scss'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const { login: storeLogin } = useAuthStore()
  const { setShops, setCurrentShop } = useShopStore()

  const handleLogin = async () => {
    setLoading(true)
    try {
      const { code } = await Taro.login()
      const res = await login(code)
      storeLogin(res.data.token, res.data.user)

      // 可选：获取用户昵称和头像（会弹授权弹窗）
      // 注意：wx.getUserProfile 需要由用户点击触发，此处已满足条件
      try {
        const profileRes = await Taro.getUserProfile({ desc: '用于完善用户信息' })
        // 可将 profileRes.userInfo.nickName / avatarUrl 上传到服务端更新用户信息
        console.log('用户昵称:', profileRes.userInfo.nickName)
      } catch {
        // 用户拒绝授权，忽略，不影响登录
      }

      const shopsRes = await getShops()
      const shops = shopsRes.data || []
      setShops(shops)

      if (shops.length === 0) {
        redirectTo('/pages/shop/create/index')
      } else if (shops.length === 1) {
        setCurrentShop(shops[0])
        redirectTo('/pages/home/index')
      } else {
        redirectTo('/pages/shop/list/index')
      }
    } catch {
      Taro.showToast({ title: '登录失败，请重试', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className='login-page'>
      <View className='logo-area'>
        <Text className='app-name'>智慧店铺</Text>
        <Text className='app-desc'>扫码入库 · 扫码出库 · 智能统计</Text>
      </View>
      <Button
        className='login-btn'
        loading={loading}
        disabled={loading}
        onClick={handleLogin}
      >
        微信一键登录
      </Button>
    </View>
  )
}
