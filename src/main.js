import Vue from 'vue'
import App from './App.vue'

import Calendar from './component/v1.0.0/index'

Vue.use(Calendar);

new Vue({
  el: '#app',
  render: h => h(App)
})
