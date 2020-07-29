import Vue from 'vue'
import App from './App.vue'
import Vuesax from 'vuesax'
import 'vuesax/dist/vuesax.css' //Vuesax styles
import 'material-icons/iconfont/material-icons.css';
import 'vue-select/dist/vue-select.css';

Vue.use(Vuesax, {
  // options here
})

import './plugins/web3'

Vue.prototype.$env = process.env.NODE_ENV === 'development' ? 'testnet' : 'mainnet'
Vue.config.productionTip = false

new Vue({
  Vuesax,
  render: h => h(App)
}).$mount('#app')
