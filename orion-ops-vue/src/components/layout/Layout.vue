<template>
  <a-layout id="common-layout" v-if="validToken">
    <!-- 左侧 -->
    <a-layout-sider id="common-sider" v-model="collapsed" :trigger="null">
      <!--  <div class="logo"/> -->
      <!-- 左侧菜单 -->
      <Menu ref="menu"/>
    </a-layout-sider>
    <a-layout id="common-right">
      <!-- 头部菜单 -->
      <Header id="common-header"
              ref="header"
              @changeFoldStatus="collapsed = !collapsed"
              @chooseProfile="chooseProfile"
              @onHeaderEvent="onHeaderEvent"/>
      <!-- 主体部分 -->
      <a-layout-content id="common-content">
        <router-view ref="route"/>
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script>
import Menu from './Menu'
import Header from './Header'

export default {
  components: {
    Menu,
    Header
  },
  watch: {
    $route(e) {
      // 设置菜单选中
      this.$refs.menu.chooseMenu(e)
      // 设置头部按钮
      this.$refs.header.checkVisible(e)
    }
  },
  data() {
    return {
      collapsed: false,
      validToken: false
    }
  },
  methods: {
    chooseProfile(e) {
      this.$refs.route && this.$refs.route.chooseProfile && this.$refs.route.chooseProfile(e)
    },
    onHeaderEvent(e) {
      this.$refs.route && this.$refs.route.onHeaderEvent && this.$refs.route.onHeaderEvent(e)
    }
  },
  async beforeCreate() {
    await this.$api.validToken().then(() => {
      this.validToken = true
    }).catch(() => {
      this.validToken = false
    })
  }
}
</script>

<style lang="less" scoped>
#common-layout {
  height: 100vh;

  .logo {
    height: 32px;
    background: rgb(102, 34, 175);
    margin: 16px;
  }

  #common-sider {
    overflow: auto
  }
}

#common-right {
  overflow: hidden;

  #common-content {
    padding: 20px;
    overflow: auto;
    flex: auto;
    background: #bbd9f1;
    background-image: url("../../../public/login-back.jpg") ;
  }

  #common-header {
    z-index: 10;
    padding-right: 0;
    background: rgba(60, 173, 245, 0.9);
    box-shadow: 0 1px 4px #6622af;
    height: 50px;

    /deep/ .ant-layout-header {
      height: 48px;
      line-height: 48px;
    }
  }
}

</style>
