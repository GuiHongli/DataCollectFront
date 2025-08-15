<template>
  <div class="dashboard">
    <div class="page-header">
      <h2 class="page-title">仪表盘</h2>
      <p class="page-description">数据采集任务配置管理系统概览</p>
    </div>

    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon><Location /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ stats.regionCount }}</div>
              <div class="stat-label">地域数量</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon><Monitor /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ stats.executorCount }}</div>
              <div class="stat-label">执行机数量</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon><Mobile /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ stats.ueCount }}</div>
              <div class="stat-label">UE数量</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon><List /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ stats.taskCount }}</div>
              <div class="stat-label">任务数量</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>最近任务</span>
          </template>
          <el-table :data="recentTasks" style="width: 100%">
            <el-table-column prop="name" label="任务名称" />
            <el-table-column prop="status" label="状态">
              <template #default="scope">
                <el-tag :type="getStatusType(scope.row.status)">
                  {{ getStatusText(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="创建时间" />
          </el-table>
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>系统信息</span>
          </template>
          <div class="system-info">
            <div class="info-item">
              <span class="label">系统版本：</span>
              <span class="value">v1.0.0</span>
            </div>
            <div class="info-item">
              <span class="label">运行时间：</span>
              <span class="value">{{ uptime }}</span>
            </div>
            <div class="info-item">
              <span class="label">数据库状态：</span>
              <span class="value">
                <el-tag type="success">正常</el-tag>
              </span>
            </div>
            <div class="info-item">
              <span class="label">API状态：</span>
              <span class="value">
                <el-tag type="success">正常</el-tag>
              </span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'

export default {
  name: 'Dashboard',
  setup() {
    const stats = ref({
      regionCount: 0,
      executorCount: 0,
      ueCount: 0,
      taskCount: 0,
    })
    
    const recentTasks = ref([])
    const uptime = ref('0天 0小时 0分钟')

    const getStatusType = (status) => {
      const statusMap = {
        0: 'info',
        1: 'success',
        2: 'warning',
      }
      return statusMap[status] || 'info'
    }

    const getStatusText = (status) => {
      const statusMap = {
        0: '停止',
        1: '运行中',
        2: '暂停',
      }
      return statusMap[status] || '未知'
    }

    const loadStats = () => {
      // 这里应该调用API获取统计数据
      stats.value = {
        regionCount: 5,
        executorCount: 4,
        ueCount: 4,
        taskCount: 3,
      }
    }

    const loadRecentTasks = () => {
      // 这里应该调用API获取最近任务
      recentTasks.value = [
        {
          name: '北京Android性能监控任务',
          status: 1,
          createTime: '2024-01-15 10:30:00',
        },
        {
          name: '北京iOS日志采集任务',
          status: 0,
          createTime: '2024-01-15 09:15:00',
        },
        {
          name: '上海Android网络监控任务',
          status: 2,
          createTime: '2024-01-15 08:45:00',
        },
      ]
    }

    onMounted(() => {
      loadStats()
      loadRecentTasks()
    })

    return {
      stats,
      recentTasks,
      uptime,
      getStatusType,
      getStatusText,
    }
  },
}
</script>

<style scoped>
.dashboard {
  padding: 20px;
}

.stat-card {
  height: 120px;
}

.stat-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.stat-icon {
  font-size: 48px;
  color: #409EFF;
  margin-right: 20px;
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #606266;
  margin-top: 8px;
}

.system-info {
  padding: 10px 0;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-item:last-child {
  border-bottom: none;
}

.label {
  font-weight: 500;
  color: #606266;
}

.value {
  color: #303133;
}
</style>
