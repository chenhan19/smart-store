import { useState } from 'react'
import { View, Text, Button, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAuthStore } from '../../../store/authStore'
import { useShopStore } from '../../../store/shopStore'
import { login } from '../../../services/authApi'
import { getShops } from '../../../services/shopApi'
import './index.scss'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const { login: storeLogin } = useAuthStore()
  const { setShops } = useShopStore()

  const handleLogin = async () => {
    setLoading(true)
    try {
      const { code } = await Taro.login()
      const res = await login(code)
      storeLogin(res.data.token, res.data.user)

      // Check if user has shops
      const shopsRes = await getShops()
      const shops = shopsRes.data || []
      setShops(shops)

      if (shops.length === 0) {
        Taro.redirectTo({ url: '/pages/shop/create/index' })
      } else {
        Taro.redirectTo({ url: '/pages/shop/list/index' })
      }
    } catch (err) {
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
