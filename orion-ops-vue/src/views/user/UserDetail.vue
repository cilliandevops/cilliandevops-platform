<template>
  <div class="user-detail-container">
    <a-tabs default-active-key="1" tab-position="left">
      <!-- 基本信息 -->
      <a-tab-pane key="1" tab="基本信息">
        <UserBasicForm/>
      </a-tab-pane>
      <!-- 操作日志 -->
      <a-tab-pane key="2" tab="操作日志">
        <EventLogList/>
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script>
import UserBasicForm from '@/components/user/UserBasicForm'

export default {
  name: 'UserDetail',
  components: {
    EventLogList: () => import('@/components/user/EventLogList'),
    UserBasicForm
  }
}
</script>

<style lang="less" scoped>

.user-detail-container {
  background: rgba(171, 216, 241, 0.9);
  padding: 8px 16px;
  border-radius: 20px;
}
</style>
