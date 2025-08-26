<template>
  <div class="collect-strategy-page">
    <div class="page-header">
      <h2 class="page-title">采集策略管理</h2>
      <p class="page-description">管理采集策略，包括策略名称、采集次数、逻辑环境等</p>
    </div>

    <el-card>
      <div class="table-operations">
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增策略
        </el-button>
        <el-button @click="loadData">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" style="width: 100%">
        <el-table-column prop="name" label="策略名称" />
        <el-table-column prop="collectCount" label="采集次数" />
        <el-table-column label="用例集" min-width="300">
          <template #default="scope">
            <div v-if="scope.row.testCaseSetName">
              <div class="test-case-set-info">
                <div class="set-name">
                  <strong>{{ scope.row.testCaseSetName }} ({{ scope.row.testCaseSetVersion }})</strong>
                </div>
                <div class="set-description" v-if="scope.row.testCaseSetDescription">
                  <span class="label">描述：</span>
                  <span>{{ scope.row.testCaseSetDescription }}</span>
                </div>
                <div class="test-case-info" v-if="scope.row.testCaseList && scope.row.testCaseList.length > 0">
                  <span class="label">测试用例：</span>
                  <span v-for="(testCase, index) in scope.row.testCaseList" :key="testCase.id">
                    {{ testCase.name }}({{ testCase.number }})
                    <span v-if="index < scope.row.testCaseList.length - 1">, </span>
                  </span>
                </div>
                <div class="file-info" v-if="scope.row.testCaseSetGohttpserverUrl">
                  <span class="label">文件：</span>
                  <el-link 
                    type="primary" 
                    :href="scope.row.testCaseSetGohttpserverUrl" 
                    target="_blank"
                    :underline="false"
                  >
                    <el-icon><Link /></el-icon>
                    查看文件
                  </el-link>
                </div>
              </div>
            </div>
            <span v-else style="color: #909399;">未配置</span>
          </template>
        </el-table-column>
        <el-table-column label="筛选条件" min-width="200">
          <template #default="scope">
            <div v-if="scope.row.businessCategory || scope.row.app">
              <div v-if="scope.row.businessCategory" class="filter-tag">
                <el-tag size="small" type="info">业务大类: {{ scope.row.businessCategory }}</el-tag>
              </div>
              <div v-if="scope.row.app" class="filter-tag">
                <el-tag size="small" type="success">App: {{ scope.row.app }}</el-tag>
              </div>
            </div>
            <span v-else style="color: #909399;">无筛选</span>
          </template>
        </el-table-column>
        <el-table-column label="采集意图" width="120">
          <template #default="scope">
            <el-tag v-if="scope.row.intentName" size="small" type="warning">
              {{ scope.row.intentName }}
            </el-tag>
            <span v-else style="color: #909399;">未配置</span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="status" label="状态">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
              {{ scope.row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" />
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
      >
        <el-form-item label="策略名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入策略名称" />
        </el-form-item>
        <el-form-item label="采集次数" prop="collectCount">
          <el-input-number
            v-model="form.collectCount"
            :min="1"
            :max="1000"
            placeholder="请输入采集次数"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="用例集" prop="testCaseSetId">
          <el-select v-model="form.testCaseSetId" placeholder="请选择用例集" style="width: 100%" @change="handleTestCaseSetChange">
            <el-option
              v-for="item in testCaseSetOptions"
              :key="item.id"
              :label="`${item.name} (${item.version})`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        
        <!-- 筛选条件配置 -->
        <el-form-item label="业务大类筛选" v-if="selectedTestCaseSet">
          <el-select 
            v-model="form.businessCategory" 
            placeholder="选择业务大类（可选）" 
            clearable 
            style="width: 100%"
          >
            <el-option
              v-for="category in businessCategoryOptions"
              :key="category"
              :label="category"
              :value="category"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="App筛选" v-if="selectedTestCaseSet">
          <el-select 
            v-model="form.app" 
            placeholder="选择App（可选）" 
            clearable 
            style="width: 100%"
          >
            <el-option
              v-for="app in appOptions"
              :key="app"
              :label="app"
              :value="app"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="采集意图" prop="intent">
          <el-select 
            v-model="form.intent" 
            placeholder="请选择采集意图" 
            style="width: 100%"
          >
            <el-option
              v-for="intent in intentOptions"
              :key="intent.code"
              :label="intent.name"
              :value="intent.code"
            />
          </el-select>
        </el-form-item>
        
        <!-- 用例列表显示 -->
        <el-form-item label="包含用例" v-if="selectedTestCaseSet">
          <div class="test-case-list-container">
            <div class="test-case-summary">
              <span class="summary-text">共 {{ filteredTestCaseList.length }} 个测试用例</span>
              <el-button 
                type="text" 
                size="small" 
                @click="showTestCaseList = !showTestCaseList"
              >
                {{ showTestCaseList ? '收起' : '展开' }}
              </el-button>
            </div>
            
            <div v-if="showTestCaseList" class="test-case-table">
              <el-table :data="filteredTestCaseList" size="small" max-height="300">
                <el-table-column prop="name" label="用例名称" min-width="150" />
                <el-table-column prop="number" label="用例编号" width="100" />
                <el-table-column prop="businessCategory" label="业务大类" width="120">
                  <template #default="scope">
                    <span v-if="scope.row.businessCategory">{{ scope.row.businessCategory }}</span>
                    <span v-else style="color: #909399;">未配置</span>
                  </template>
                </el-table-column>
                <el-table-column prop="app" label="App" width="100">
                  <template #default="scope">
                    <span v-if="scope.row.app">{{ scope.row.app }}</span>
                    <span v-else style="color: #909399;">未配置</span>
                  </template>
                </el-table-column>
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
              </el-table>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入描述"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Link } from '@element-plus/icons-vue'
import request from '@/utils/request'

export default {
  name: 'CollectStrategy',
  setup() {
    const loading = ref(false)
    const tableData = ref([])
    const dialogVisible = ref(false)
    const dialogTitle = ref('')
    const formRef = ref()
    const testCaseSetOptions = ref([])
    const selectedTestCaseSet = ref(null)
    const testCaseList = ref([])
    const showTestCaseList = ref(false)
    const businessCategoryOptions = ref([])
    const appOptions = ref([])
    const intentOptions = ref([])

    const pagination = reactive({
      current: 1,
      size: 10,
      total: 0,
    })

    const form = reactive({
      id: null,
      name: '',
      collectCount: 1,
      testCaseSetId: null,
      businessCategory: '',
      app: '',
      intent: '',
      description: '',
      status: 1,
    })

    const rules = {
      name: [
        { required: true, message: '请输入策略名称', trigger: 'blur' },
      ],
      collectCount: [
        { required: true, message: '请输入采集次数', trigger: 'blur' },
      ],
      testCaseSetId: [
        { required: true, message: '请选择用例集', trigger: 'change' },
      ],
      intent: [
        { required: true, message: '请选择采集意图', trigger: 'change' },
      ],
    }

    const loadData = async () => {
      loading.value = true
      try {
        const params = {
          current: pagination.current,
          size: pagination.size,
        }
        const res = await request({
          url: '/collect-strategy/page',
          method: 'get',
          params,
        })
        tableData.value = res.data.records
        pagination.total = res.data.total
      } catch (error) {
        console.error('加载数据失败:', error)
      } finally {
        loading.value = false
      }
    }

    const loadTestCaseSetOptions = async () => {
      try {
        const res = await request({
          url: '/test-case-set/list',
          method: 'get',
        })
        testCaseSetOptions.value = res.data
      } catch (error) {
        console.error('加载用例集数据失败:', error)
      }
    }

    const loadIntentOptions = async () => {
      try {
        const res = await request({
          url: '/collect-strategy/intents',
          method: 'get',
        })
        intentOptions.value = res.data
      } catch (error) {
        console.error('加载采集意图选项失败:', error)
      }
    }

    const handleTestCaseSetChange = async (testCaseSetId) => {
      if (testCaseSetId) {
        // 获取选中的用例集信息
        const testCaseSet = testCaseSetOptions.value.find(item => item.id === testCaseSetId)
        selectedTestCaseSet.value = testCaseSet
        
        // 加载用例列表
        try {
          const res = await request({
            url: `/test-case-set/${testCaseSetId}/test-cases`,
            method: 'get',
          })
          testCaseList.value = res.data
          showTestCaseList.value = true // 自动展开用例列表
          
          // 提取业务大类和App选项（用于策略配置）
          extractFilterOptions()
        } catch (error) {
          console.error('加载用例列表失败:', error)
          testCaseList.value = []
        }
      } else {
        selectedTestCaseSet.value = null
        testCaseList.value = []
        showTestCaseList.value = false
        clearFilterOptions()
      }
    }

    // 提取筛选选项（用于策略配置）
    const extractFilterOptions = () => {
      const categories = new Set()
      const apps = new Set()
      
      testCaseList.value.forEach(testCase => {
        if (testCase.businessCategory) {
          categories.add(testCase.businessCategory)
        }
        if (testCase.app) {
          apps.add(testCase.app)
        }
      })
      
      businessCategoryOptions.value = Array.from(categories).sort()
      appOptions.value = Array.from(apps).sort()
    }

    // 清除筛选选项
    const clearFilterOptions = () => {
      businessCategoryOptions.value = []
      appOptions.value = []
    }

    // 筛选后的用例列表（根据策略配置的筛选条件）
    const filteredTestCaseList = computed(() => {
      if (!testCaseList.value.length) {
        return []
      }

      return testCaseList.value.filter(testCase => {
        // 业务大类筛选
        if (form.businessCategory && testCase.businessCategory !== form.businessCategory) {
          return false
        }
        
        // App筛选
        if (form.app && testCase.app !== form.app) {
          return false
        }
        
        return true
      })
    })



    const handleAdd = () => {
      dialogTitle.value = '新增策略'
      dialogVisible.value = true
      resetForm()
    }

    const handleEdit = (row) => {
      dialogTitle.value = '编辑策略'
      // 只复制必要的字段，避免传递额外字段
      Object.assign(form, {
        id: row.id,
        name: row.name,
        collectCount: row.collectCount,
        testCaseSetId: row.testCaseSetId,
        businessCategory: row.businessCategory || '',
        app: row.app || '',
        intent: row.intent || '',
        description: row.description,
        status: row.status,
      })
      dialogVisible.value = true
      
      // 如果选择了用例集，加载用例列表
      if (row.testCaseSetId) {
        handleTestCaseSetChange(row.testCaseSetId)
      }
    }

    const handleDelete = async (row) => {
      try {
        await ElMessageBox.confirm('确定要删除这个策略吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        })
        
        await request({
          url: `/collect-strategy/${row.id}`,
          method: 'delete',
        })
        ElMessage.success('删除成功')
        loadData()
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('删除失败')
        }
      }
    }

    const handleSubmit = async () => {
      try {
        await formRef.value.validate()
        
        // 只发送必要的字段
        const submitData = {
          name: form.name,
          collectCount: form.collectCount,
          testCaseSetId: form.testCaseSetId,
          businessCategory: form.businessCategory || null,
          app: form.app || null,
          intent: form.intent || null,
          description: form.description,
          status: form.status,
        }
        
        if (form.id) {
          await request({
            url: `/collect-strategy/${form.id}`,
            method: 'put',
            data: submitData,
          })
          ElMessage.success('更新成功')
        } else {
          await request({
            url: '/collect-strategy',
            method: 'post',
            data: submitData,
          })
          ElMessage.success('创建成功')
        }
        
        dialogVisible.value = false
        loadData()
      } catch (error) {
        console.error('提交失败:', error)
      }
    }

    const resetForm = () => {
      Object.assign(form, {
        id: null,
        name: '',
        collectCount: 1,
        testCaseSetId: null,
        businessCategory: '',
        app: '',
        intent: '',
        description: '',
        status: 1,
      })
      selectedTestCaseSet.value = null
      testCaseList.value = []
      showTestCaseList.value = false
      clearFilterOptions()
      if (formRef.value) {
        formRef.value.resetFields()
      }
    }

    const handleSizeChange = (val) => {
      pagination.size = val
      loadData()
    }

    const handleCurrentChange = (val) => {
      pagination.current = val
      loadData()
    }

    onMounted(() => {
      loadData()
      loadTestCaseSetOptions()
      loadIntentOptions()
    })

    return {
      loading,
      tableData,
      pagination,
      dialogVisible,
      dialogTitle,
      formRef,
      form,
      rules,
      testCaseSetOptions,
      selectedTestCaseSet,
      testCaseList,
      showTestCaseList,
      businessCategoryOptions,
      appOptions,
      intentOptions,
      filteredTestCaseList,
      loadData,
      loadTestCaseSetOptions,
      loadIntentOptions,
      handleTestCaseSetChange,
      extractFilterOptions,
      clearFilterOptions,
      handleAdd,
      handleEdit,
      handleDelete,
      handleSubmit,
      resetForm,
      handleSizeChange,
      handleCurrentChange,
    }
  },
}
</script>

<style scoped>
.collect-strategy-page {
  padding: 20px;
}

.table-operations {
  margin-bottom: 16px;
}

.table-operations .el-button {
  margin-right: 8px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

/* 用例集信息样式 */
.test-case-set-info {
  font-size: 12px;
  line-height: 1.4;
}

.test-case-set-info .set-name {
  margin-bottom: 4px;
  color: #303133;
}

.test-case-set-info .set-description,
.test-case-set-info .test-case-info,
.test-case-set-info .file-info {
  margin-bottom: 2px;
  color: #606266;
}

.test-case-set-info .label {
  font-weight: 500;
  color: #909399;
}

.test-case-set-info .el-link {
  font-size: 11px;
}

/* 用例列表样式 */
.test-case-list-container {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 12px;
  background-color: #fafafa;
}

.test-case-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.summary-text {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.test-case-table {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
}

.test-case-table .el-table {
  background-color: white;
}

.test-case-table .el-table th {
  background-color: #f5f7fa;
}


</style>
