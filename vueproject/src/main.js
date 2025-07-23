import Vue from 'vue'
import App from './App.vue'
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import VueRouter from 'vue-router';
import router from './router';
import axios from 'axios';
import VueAxios from 'vue-axios'

Vue.config.productionTip = false

Vue.use(ElementUI);
Vue.use(VueRouter)
Vue.use(VueAxios, axios)
Vue.prototype.$axios = axios;

new Vue({
  render: h => h(App),
  router,
  data() {
    return {
      ruleForm: {
        account: '',
        password: '',
      },
      loading: false,
    };
  },
  methods: {
    login() {
      this.loading = true;
      axios({
        url: "/api/identity/login",
        method: "post",
        headers: {
          "Content-Type": "application/json",
        },
        data: {
          account: this.ruleForm.account,
          password: this.ruleForm.password,
        },
      }).then((res) => {
        if (res.data.code === "0") {
          sessionStorage.setItem("userInfo", JSON.stringify(res.data.data));
          this.$router.push('/home');
          this.$message({
            message: res.data.msg,
            type: "success",
          });
        } else {
          this.$message({
            message: res.data.msg,
            type: "warning",
          });
        }
        this.loading = false;
      }).catch((error) => {
        console.error("Login error:", error);
        this.loading = false;
        this.$message({
          message: "An error occurred during login.",
          type: "error",
        });
      });
    },
  },
}).$mount('#app');
