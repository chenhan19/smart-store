export default defineAppConfig({
  pages: [
    'pages/auth/login/index',
    'pages/shop/list/index',
    'pages/shop/create/index',
    'pages/home/index',
    'pages/product/list/index',
    'pages/product/detail/index',
    'pages/product/edit/index',
    'pages/inventory/list/index',
    'pages/inbound/index',
    'pages/outbound/index',
    'pages/records/list/index',
    'pages/statistics/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: '智慧店铺',
    navigationBarTextStyle: 'black',
  },
  tabBar: {
    color: '#999',
    selectedColor: '#1890ff',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页',
      },
      {
        pagePath: 'pages/inventory/list/index',
        text: '库存',
      },
      {
        pagePath: 'pages/records/list/index',
        text: '记录',
      },
      {
        pagePath: 'pages/statistics/index',
        text: '统计',
      },
    ],
  },
})
