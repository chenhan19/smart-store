import { createApp } from 'vue';
import { createPinia } from 'pinia';
import NutUI from 'nutui-taro';
import './app.scss';

const App = createApp({
  onShow(options) {
    console.log('App onShow:', options);
  },
});

// 使用Pinia状态管理
const pinia = createPinia();
App.use(pinia);

// 使用NutUI组件库
App.use(NutUI);

export default App;