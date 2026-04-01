import { View, Text } from '@tarojs/components'
import { useAuthStore } from '../../store/authStore'
import { useShopStore } from '../../store/shopStore'
import { navigateTo } from '../../utils/navigate'
import './index.scss'

interface MenuItem {
  label: string
  icon: string
  url: string
  ownerOnly?: boolean
}

const MENU_ITEMS: MenuItem[] = [
  { label: '扫码入库', icon: '📥', url: '/pages/inbound/index' },
  { label: '扫码出库', icon: '📤', url: '/pages/outbound/index' },
  { label: '库存查询', icon: '📦', url: '/pages/inventory/list/index' },
  { label: '商品管理', icon: '🏷️', url: '/pages/product/list/index', ownerOnly: true },
  { label: '出入库记录', icon: '📋', url: '/pages/records/list/index', ownerOnly: true },
  { label: '数据统计', icon: '📊', url: '/pages/statistics/index', ownerOnly: true },
  { label: '店铺管理', icon: '🏪', url: '/pages/shop/list/index', ownerOnly: true },
]

export default function HomePage() {
  const { user } = useAuthStore()
  const { currentShop } = useShopStore()
  const isOwner = user?.role === 'owner'

  const visibleItems = MENU_ITEMS.filter((item) => !item.ownerOnly || isOwner)

  return (
    <View className='home-page'>
      <View className='shop-bar'>
        <Text className='shop-label'>当前店铺</Text>
        <Text className='shop-name'>{currentShop?.name || '未选择'}</Text>
      </View>

      <View className='menu-grid'>
        {visibleItems.map((item) => (
          <View key={item.url} className='menu-item' onClick={() => navigateTo(item.url)}>
            <Text className='menu-icon'>{item.icon}</Text>
            <Text className='menu-label'>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}
