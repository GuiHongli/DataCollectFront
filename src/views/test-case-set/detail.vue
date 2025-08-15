<template>
  <div class="test-case-set-detail-page">
    <div class="page-header">
      <el-button @click="goBack" type="text" class="back-button">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
      <h2 class="page-title">用例集详情</h2>
    </div>

    <el-card v-if="testCaseSet" class="test-case-set-info">
      <template #header>
        <div class="card-header">
          <span class="card-title">用例集信息</span>
        </div>
      </template>
      
      <el-descriptions :column="2" border>
        <el-descriptions-item label="用例集名称">
          {{ testCaseSet.name }}
        </el-descriptions-item>
        <el-descriptions-item label="版本">
          {{ testCaseSet.version }}
        </el-descriptions-item>
        <el-descriptions-item label="描述">
          {{ testCaseSet.description || '暂无描述' }}
        </el-descriptions-item>
        <el-descriptions-item label="文件大小">
          {{ formatFileSize(testCaseSet.fileSize) }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="testCaseSet.status === 1 ? 'success' : 'danger'">
            {{ testCaseSet.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ formatDateTime(testCaseSet.createTime) }}
        </el-descriptions-item>
        <el-descriptions-item label="文件访问" :span="2" v-if="testCaseSet.gohttpserverUrl">
          <el-link 
            type="primary" 
            :href="testCaseSet.gohttpserverUrl" 
            target="_blank"
            :underline="false"
          >
            <el-icon><Link /></el-icon>
            {{ getShortUrl(testCaseSet.gohttpserverUrl) }}
          </el-link>
          <el-button 
            size="small" 
            type="text" 
            @click="copyUrl(testCaseSet.gohttpserverUrl)"
            style="margin-left: 8px;"
          >
            <el-icon><CopyDocument /></el-icon>
          </el-button>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card class="test-cases-list">
      <template #header>
        <div class="card-header">
          <span class="card-title">测试用例列表 ({{ testCases.length }})</span>
        </div>
      </template>

      <el-table :data="testCases" v-loading="loading" style="width: 100%">
        <el-table-column prop="name" label="用例名称" min-width="150" />
        <el-table-column prop="code" label="用例编号" width="100" />
        <el-table-column prop="logicNetwork" label="逻辑组网" min-width="150">
          <template #default="scope">
            <div v-if="scope.row.logicNetwork">
              <el-tag 
                v-for="network in scope.row.logicNetwork.split(';')" 
                :key="network"
                size="small"
                style="margin-right: 4px; margin-bottom: 4px;"
              >
                {{ network }}
              </el-tag>
            </div>
            <span v-else style="color: #909399;">未配置</span>
          </template>
        </el-table-column>
        <el-table-column prop="testSteps" label="测试步骤" min-width="200">
          <template #default="scope">
            <div class="test-steps">
              <pre>{{ scope.row.testSteps }}</pre>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="expectedResult" label="预期结果" min-width="200">
          <template #default="scope">
            <div class="expected-result">
              <pre>{{ scope.row.expectedResult }}</pre>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Link, CopyDocument } from '@element-plus/icons-vue'
import request from '@/utils/request'

export default {
  name: 'TestCaseSetDetail',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const loading = ref(false)
    const testCaseSet = ref(null)
    const testCases = ref([])

    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const formatDateTime = (dateTime) => {
      if (!dateTime) return ''
      return new Date(dateTime).toLocaleString('zh-CN')
    }

    const getShortUrl = (url) => {
      if (!url) return ''
      try {
        const urlObj = new URL(url)
        return `${urlObj.hostname}:${urlObj.port}${urlObj.pathname}`
      } catch (e) {
        return url
      }
    }

    const copyUrl = async (url) => {
      try {
        await navigator.clipboard.writeText(url)
        ElMessage.success('URL已复制到剪贴板')
      } catch (err) {
        // 降级方案
        const textArea = document.createElement('textarea')
        textArea.value = url
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        ElMessage.success('URL已复制到剪贴板')
      }
    }

    const loadTestCaseSet = async () => {
      const id = route.params.id
      if (!id) {
        ElMessage.error('用例集ID不能为空')
        return
      }

      loading.value = true
      try {
        const res = await request({
          url: `/test-case-set/${id}`,
          method: 'get',
        })
        testCaseSet.value = res.data
      } catch (error) {
        console.error('加载用例集信息失败:', error)
        ElMessage.error('加载用例集信息失败')
      } finally {
        loading.value = false
      }
    }

    const loadTestCases = async () => {
      const id = route.params.id
      if (!id) return

      try {
        const res = await request({
          url: `/test-case-set/${id}/test-cases`,
          method: 'get',
        })
        testCases.value = res.data
      } catch (error) {
        console.error('加载测试用例失败:', error)
        ElMessage.error('加载测试用例失败')
      }
    }

    const goBack = () => {
      router.go(-1)
    }

    onMounted(() => {
      loadTestCaseSet()
      loadTestCases()
    })

    return {
      loading,
      testCaseSet,
      testCases,
      formatFileSize,
      formatDateTime,
      getShortUrl,
      copyUrl,
      goBack,
    }
  },
}
</script>

<style scoped>
.test-case-set-detail-page {
  padding: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.back-button {
  margin-right: 16px;
  font-size: 14px;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.test-case-set-info {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.test-cases-list {
  margin-bottom: 20px;
}

.test-steps,
.expected-result {
  max-height: 100px;
  overflow-y: auto;
  font-size: 12px;
  line-height: 1.4;
}

.test-steps pre,
.expected-result pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: inherit;
}

/* 滚动条样式 */
.test-steps::-webkit-scrollbar,
.expected-result::-webkit-scrollbar {
  width: 4px;
}

.test-steps::-webkit-scrollbar-track,
.expected-result::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 2px;
}

.test-steps::-webkit-scrollbar-thumb,
.expected-result::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.test-steps::-webkit-scrollbar-thumb:hover,
.expected-result::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
