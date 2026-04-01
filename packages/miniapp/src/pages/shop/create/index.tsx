import { useState } from 'react'
import { View, Text, Input, Button } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useShopStore } from '../../../store/shopStore'
import { createShop, updateShop } from '../../../services/shopApi'
import { redirectTo } from '../../../utils/navigate'
import './index.scss'

export default function ShopCreatePage() {
  const router = useRouter()
  const shopId = router.params.shopId ? parseInt(router.params.shopId) : null
  const shopName = router.params.name || ''

  const [name, setName] = useState(shopName)
  const [loading, setLoading] = useState(false)
  const { setCurrentShop } = useShopStore()

  const handleSubmit = async () => {
    if (!name.trim()) {
      Taro.showToast({ title: '店铺名称不能为空', icon: 'none' })
      return
    }
    setLoading(true)
    try {
      if (shopId) {
        await updateShop(shopId, name.trim())
        Taro.showToast({ title: '修改成功', icon: 'success' })
        Taro.navigateBack()
      } else {
        const res = await createShop(name.trim())
        setCurrentShop(res.data)
        redirectTo('/pages/home/index')
      }
    } catch {
      // error handled in request
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className='shop-create-page'>
      <View className='form-item'>
        <Text className='label'>店铺名称</Text>
        <Input
          className='input'
          value={name}
          placeholder='请输入店铺名称'
          onInput={(e) => setName(e.detail.value)}
        />
      </View>
      <Button className='submit-btn' loading={loading} disabled={loading} onClick={handleSubmit}>
        {shopId ? '保存修改' : '创建店铺'}
      </Button>
    </View>
  )
}
