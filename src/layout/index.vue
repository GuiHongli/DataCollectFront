<template>
  <el-container class="layout-container">
    <el-aside width="200px" class="sidebar">
      <div class="logo">
        <h2>数据采集管理系统</h2>
      </div>
      <el-menu
        :default-active="$route.path"
        class="sidebar-menu"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
      >
        <el-menu-item index="/dashboard">
          <el-icon><Odometer /></el-icon>
          <span>仪表盘</span>
        </el-menu-item>
        
        <el-sub-menu index="data-collect">
          <template #title>
            <el-icon><DataAnalysis /></el-icon>
            <span>数据采集</span>
          </template>
          <el-menu-item index="/collect-task/index">
            <el-icon><List /></el-icon>
            <span>采集任务管理</span>
          </el-menu-item>
          <el-menu-item index="/collect-strategy/index">
            <el-icon><Operation /></el-icon>
            <span>采集策略管理</span>
          </el-menu-item>
        </el-sub-menu>
        
        <el-sub-menu index="settings">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>设置</span>
          </template>
          <el-menu-item index="/test-case-set/index">
            <el-icon><Document /></el-icon>
            <span>用例集管理</span>
          </el-menu-item>
          <el-menu-item index="/logic-environment/index">
            <el-icon><Setting /></el-icon>
            <span>逻辑环境管理</span>
          </el-menu-item>
          <el-menu-item index="/executor/index">
            <el-icon><Monitor /></el-icon>
            <span>执行机管理</span>
          </el-menu-item>
          <el-menu-item index="/ue/index">
            <el-icon><Iphone /></el-icon>
            <span>UE管理</span>
          </el-menu-item>
          <el-menu-item index="/region/index">
            <el-icon><Location /></el-icon>
            <span>地域管理</span>
          </el-menu-item>
          <el-menu-item index="/network-type/index">
            <el-icon><Connection /></el-icon>
            <span>网络类型管理</span>
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>
    
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <h3>{{ currentPageTitle }}</h3>
        </div>
        <div class="header-right">
          <el-dropdown>
            <span class="user-info">
              管理员 <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>个人信息</el-dropdown-item>
                <el-dropdown-item>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script>
import { Iphone } from '@element-plus/icons-vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

export default {
  name: 'Layout',
  setup() {
    const route = useRoute()
    
    const currentPageTitle = computed(() => {
      const routeMap = {
        '/dashboard': '仪表盘',
        '/collect-task/index': '采集任务管理',
        '/collect-strategy/index': '采集策略管理',
        '/test-case-set/index': '用例集管理',
        '/logic-environment/index': '逻辑环境管理',
        '/executor/index': '执行机管理',
        '/ue/index': 'UE管理',
        '/region/index': '地域管理',
        '/network-type/index': '网络类型管理',
      }
      return routeMap[route.path] || '数据采集管理系统'
    })

    return {
      currentPageTitle,
    }
  },
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.sidebar {
  background-color: #304156;
  color: #bfcbd9;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #2b2f3a;
  color: #fff;
}

.logo h2 {
  font-size: 16px;
  margin: 0;
}

.sidebar-menu {
  border: none;
}

.header {
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.header-left h3 {
  margin: 0;
  color: #303133;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: #606266;
}

.main-content {
  background-color: #f0f2f5;
  padding: 20px;
}
</style>
