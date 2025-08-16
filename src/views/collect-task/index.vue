<template>
  <div class="collect-task-page">
    <div class="page-header">
      <h2 class="page-title">采集任务管理</h2>
      <p class="page-description">管理采集任务，支持任务的启动、停止、暂停等操作</p>
    </div>

    <el-card>
      <div class="table-operations">
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增任务
        </el-button>
        <el-button @click="loadData">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" style="width: 100%">
        <el-table-column prop="name" label="任务名称" />
        <el-table-column prop="strategyName" label="关联策略" />
        <el-table-column prop="schedule" label="执行计划" />
        <el-table-column prop="status" label="状态">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastRunTime" label="上次运行时间" />
        <el-table-column prop="nextRunTime" label="下次运行时间" />
        <el-table-column prop="createTime" label="创建时间" />
        <el-table-column label="操作" width="300">
          <template #default="scope">
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button 
              size="small" 
              type="success" 
              @click="handleStart(scope.row)"
              :disabled="scope.row.status === 'RUNNING' || scope.row.status === 'COMPLETED'"
            >
              启动
            </el-button>
            <el-button 
              size="small" 
              type="warning" 
              @click="handlePause(scope.row)"
              :disabled="scope.row.status !== 'RUNNING'"
            >
              暂停
            </el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="handleStop(scope.row)"
              :disabled="scope.row.status === 'STOPPED' || scope.row.status === 'COMPLETED'"
            >
              停止
            </el-button>
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

    <!-- 4步创建对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="800px"
      @close="resetForm"
    >
      <!-- 步骤内容 -->
      <div class="step-content">
        <!-- 步骤1：基本信息 -->
        <div class="step-panel">
          <h3 class="step-title">基本信息</h3>
          <el-form
            ref="basicFormRef"
            :model="basicForm"
            :rules="basicRules"
            label-width="120px"
          >
            <el-form-item label="任务名称" prop="name">
              <el-input v-model="basicForm.name" placeholder="请输入采集任务名称" />
            </el-form-item>
            <el-form-item label="任务描述" prop="description">
              <el-input
                v-model="basicForm.description"
                type="textarea"
                :rows="3"
                placeholder="请输入任务描述"
              />
            </el-form-item>
          </el-form>
        </div>

        <!-- 步骤2：采集策略 -->
        <div class="step-panel">
          <h3 class="step-title">采集策略</h3>
          <el-form
            ref="strategyFormRef"
            :model="strategyForm"
            :rules="strategyRules"
            label-width="120px"
          >
            <el-form-item label="采集策略" prop="strategyId">
              <el-select v-model="strategyForm.strategyId" placeholder="请选择采集策略" style="width: 100%" @change="handleStrategyChange">
                <el-option
                  v-for="item in strategyOptions"
                  :key="item.id"
                  :label="`${item.name} (${item.collectCount}次采集)`"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
            <div v-if="selectedStrategy" class="strategy-info">
              <h4>策略详情</h4>
              <el-descriptions :column="1" border size="small">
                <el-descriptions-item label="策略名称">{{ selectedStrategy.name }}</el-descriptions-item>
                <el-descriptions-item label="采集次数">{{ selectedStrategy.collectCount }}次</el-descriptions-item>
                <el-descriptions-item label="关联用例集">{{ selectedStrategy.testCaseSetName }} ({{ selectedStrategy.testCaseSetVersion }})</el-descriptions-item>
                <el-descriptions-item label="测试用例数量">{{ selectedStrategy.testCaseList ? selectedStrategy.testCaseList.length : 0 }}个</el-descriptions-item>
              </el-descriptions>
            </div>
          </el-form>
        </div>

        <!-- 步骤3：环境编排 -->
        <div class="step-panel">
          <h3 class="step-title">环境编排</h3>
          <el-form
            ref="environmentFormRef"
            :model="environmentForm"
            :rules="environmentRules"
            label-width="120px"
          >
            <el-form-item label="地域筛选" prop="regionId">
              <el-select v-model="environmentForm.regionId" placeholder="请选择地域" style="width: 100%" @change="handleRegionChange">
                <el-option
                  v-for="item in regionOptions"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="国家筛选" prop="countryId">
              <el-select v-model="environmentForm.countryId" placeholder="请选择国家" style="width: 100%" @change="handleCountryChange" :disabled="!environmentForm.regionId">
                <el-option
                  v-for="item in countryOptions"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="省份筛选" prop="provinceId">
              <el-select v-model="environmentForm.provinceId" placeholder="请选择省份" style="width: 100%" @change="handleProvinceChange" :disabled="!environmentForm.countryId">
                <el-option
                  v-for="item in provinceOptions"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="城市筛选" prop="cityId">
              <el-select v-model="environmentForm.cityId" placeholder="请选择城市" style="width: 100%" @change="handleCityChange" :disabled="!environmentForm.provinceId">
                <el-option
                  v-for="item in cityOptions"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
            <div class="environment-summary">
              <h4>环境配置摘要</h4>
              <el-alert
                :title="environmentSummary"
                type="info"
                :closable="false"
                show-icon
              />
            </div>
          </el-form>
          
          <!-- 可用逻辑环境列表 -->
          <div v-if="selectedStrategy && (environmentForm.regionId || environmentForm.countryId || environmentForm.provinceId || environmentForm.cityId)" class="available-environments">
            <h4>可用逻辑环境列表</h4>
            <div v-loading="environmentsLoading" class="environments-content">
              <div v-if="availableEnvironments.length === 0" class="no-environments">
                <el-empty description="暂无可用的逻辑环境" />
              </div>
              <div v-else class="environments-list">
                <el-card 
                  v-for="env in availableEnvironments" 
                  :key="env.id" 
                  class="environment-card"
                  shadow="hover"
                  :class="{ 'selected': selectedEnvironmentIds.includes(env.id) }"
                  @click="toggleEnvironmentSelection(env.id)"
                >
                  <div class="environment-header">
                    <h5 class="environment-name">{{ env.name }}</h5>
                    <div class="environment-status">
                      <el-tag :type="env.status === 1 ? 'success' : 'danger'" size="small">
                        {{ env.status === 1 ? '可用' : '不可用' }}
                      </el-tag>
                      <el-checkbox 
                        v-model="selectedEnvironmentIds" 
                        :value="env.id"
                        @change="handleEnvironmentSelection"
                        style="margin-left: 8px;"
                      />
                    </div>
                  </div>
                  <div class="environment-info">
                    <p><strong>执行机：</strong>{{ env.executorName }} ({{ env.executorIpAddress }})</p>
                    <p><strong>地域：</strong>{{ env.executorRegionName }}</p>
                    <p v-if="env.description"><strong>描述：</strong>{{ env.description }}</p>
                  </div>
                  <div v-if="env.ueList && env.ueList.length > 0" class="environment-ue">
                    <p><strong>UE设备：</strong></p>
                    <div class="ue-list">
                      <el-tag 
                        v-for="ue in env.ueList" 
                        :key="ue.id" 
                        size="small" 
                        style="margin-right: 8px; margin-bottom: 4px;"
                      >
                        {{ ue.name }} ({{ ue.ueId }})
                      </el-tag>
                    </div>
                  </div>
                  <div v-if="env.networkList && env.networkList.length > 0" class="environment-networks">
                    <p><strong>环境组网：</strong></p>
                    <div class="network-list">
                      <el-tag 
                        v-for="network in env.networkList" 
                        :key="network.id" 
                        type="info" 
                        size="small" 
                        style="margin-right: 8px; margin-bottom: 4px;"
                      >
                        {{ network.name }}
                      </el-tag>
                    </div>
                  </div>
                </el-card>
              </div>
            </div>
            
            <!-- 选择提示 -->
            <div v-if="availableEnvironments.length > 0" class="selection-tip">
              <el-alert
                :title="`已选择 ${selectedEnvironmentIds.length} 个逻辑环境`"
                type="info"
                :closable="false"
                show-icon
              />
            </div>
          </div>
        </div>


      </div>

      <!-- 操作按钮 -->
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button 
            type="success" 
            @click="handleSubmit"
            :loading="submitLoading"
          >
            创建任务
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

export default {
  name: 'CollectTask',
  setup() {
    const loading = ref(false)
    const tableData = ref([])
    const dialogVisible = ref(false)
    const dialogTitle = ref('')
    const submitLoading = ref(false)
    
    // 表单引用
    const basicFormRef = ref()
    const strategyFormRef = ref()
    const environmentFormRef = ref()
    
    // 选项数据
    const strategyOptions = ref([])
    const regionOptions = ref([])
    const countryOptions = ref([])
    const provinceOptions = ref([])
    const cityOptions = ref([])
    
    // 选中的策略
    const selectedStrategy = ref(null)
    
    // 可用逻辑环境列表
    const availableEnvironments = ref([])
    const environmentsLoading = ref(false)
    
    // 选中的逻辑环境ID列表
    const selectedEnvironmentIds = ref([])

    const pagination = reactive({
      current: 1,
      size: 10,
      total: 0,
    })

    // 步骤1：基本信息表单
    const basicForm = reactive({
      name: '',
      description: '',
    })

    const basicRules = {
      name: [
        { required: true, message: '请输入任务名称', trigger: 'blur' },
      ],
    }

    // 步骤2：采集策略表单
    const strategyForm = reactive({
      strategyId: null,
    })

    const strategyRules = {
      strategyId: [
        { required: true, message: '请选择采集策略', trigger: 'change' },
      ],
    }

    // 步骤3：环境编排表单
    const environmentForm = reactive({
      regionId: null,
      countryId: null,
      provinceId: null,
      cityId: null,
    })

    const environmentRules = {
      regionId: [
        { required: true, message: '请选择地域', trigger: 'change' },
      ],
    }
    
    // 逻辑环境选择验证
    const validateEnvironmentSelection = () => {
      if (selectedEnvironmentIds.value.length === 0) {
        ElMessage.error('请至少选择一个逻辑环境')
        return false
      }
      return true
    }



    const getStatusType = (status) => {
      const typeMap = {
        'PENDING': 'info',
        'RUNNING': 'success',
        'COMPLETED': 'success',
        'FAILED': 'danger',
        'STOPPED': 'info',
        'PAUSED': 'warning',
      }
      return typeMap[status] || 'info'
    }

    const getStatusText = (status) => {
      const textMap = {
        'PENDING': '待执行',
        'RUNNING': '运行中',
        'COMPLETED': '已完成',
        'FAILED': '执行失败',
        'STOPPED': '已停止',
        'PAUSED': '已暂停',
      }
      return textMap[status] || '未知'
    }

    // 计算属性
    const environmentSummary = computed(() => {
      const parts = []
      if (environmentForm.regionId) {
        const region = regionOptions.value.find(r => r.id === environmentForm.regionId)
        if (region) parts.push(region.name)
      }
      if (environmentForm.countryId) {
        const country = countryOptions.value.find(c => c.id === environmentForm.countryId)
        if (country) parts.push(country.name)
      }
      if (environmentForm.provinceId) {
        const province = provinceOptions.value.find(p => p.id === environmentForm.provinceId)
        if (province) parts.push(province.name)
      }
      if (environmentForm.cityId) {
        const city = cityOptions.value.find(c => c.id === environmentForm.cityId)
        if (city) parts.push(city.name)
      }
      return parts.length > 0 ? parts.join(' / ') : '未配置环境'
    })

    const loadData = async () => {
      loading.value = true
      try {
        const params = {
          current: pagination.current,
          size: pagination.size,
        }
        const res = await request({
          url: '/collect-task/page',
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

    const loadStrategyOptions = async () => {
      try {
        const res = await request({
          url: '/collect-strategy/list',
          method: 'get',
        })
        strategyOptions.value = res.data
      } catch (error) {
        console.error('加载策略数据失败:', error)
      }
    }

    const loadRegionOptions = async () => {
      try {
        const res = await request({
          url: '/region/list',
          method: 'get',
        })
        // 只显示顶级地域（level=1）的信息
        regionOptions.value = res.data.filter(region => region.level === 1)
      } catch (error) {
        console.error('加载地域数据失败:', error)
      }
    }

    const loadCountryOptions = async (regionId) => {
      try {
        const res = await request({
          url: `/region/parent/${regionId}`,
          method: 'get',
        })
        // 只显示国家级别（level=2）的数据
        countryOptions.value = res.data.filter(region => region.level === 2)
      } catch (error) {
        console.error('加载国家数据失败:', error)
      }
    }

    const loadProvinceOptions = async (countryId) => {
      try {
        const res = await request({
          url: `/region/parent/${countryId}`,
          method: 'get',
        })
        // 只显示省份级别（level=3）的数据
        provinceOptions.value = res.data.filter(region => region.level === 3)
      } catch (error) {
        console.error('加载省份数据失败:', error)
      }
    }

    const loadCityOptions = async (provinceId) => {
      try {
        const res = await request({
          url: `/region/parent/${provinceId}`,
          method: 'get',
        })
        // 只显示城市级别（level=4）的数据
        cityOptions.value = res.data.filter(region => region.level === 4)
      } catch (error) {
        console.error('加载城市数据失败:', error)
      }
    }
    
    const loadAvailableEnvironments = async () => {
      // 如果没有选择策略或者没有选择任何地域筛选条件，则不加载
      if (!selectedStrategy.value || (!environmentForm.regionId && !environmentForm.countryId && !environmentForm.provinceId && !environmentForm.cityId)) {
        availableEnvironments.value = []
        return
      }
      
      environmentsLoading.value = true
      try {
        const params = {
          strategyId: selectedStrategy.value.id,
          regionId: environmentForm.regionId,
          countryId: environmentForm.countryId,
          provinceId: environmentForm.provinceId,
          cityId: environmentForm.cityId,
        }
        
        const res = await request({
          url: '/collect-task/available-logic-environments',
          method: 'get',
          params,
        })
        availableEnvironments.value = res.data
      } catch (error) {
        console.error('加载可用逻辑环境失败:', error)
        availableEnvironments.value = []
      } finally {
        environmentsLoading.value = false
      }
    }

    const handleAdd = () => {
      dialogTitle.value = '新建采集任务'
      dialogVisible.value = true
      resetForm()
      loadRegionOptions()
    }

    // 策略选择事件处理
    const handleStrategyChange = async (strategyId) => {
      if (strategyId) {
        const strategy = strategyOptions.value.find(s => s.id === strategyId)
        if (strategy) {
          selectedStrategy.value = strategy
          await loadAvailableEnvironments()
        }
      } else {
        selectedStrategy.value = null
        availableEnvironments.value = []
      }
    }

    // 环境选择事件处理
    const handleRegionChange = async (regionId) => {
      environmentForm.countryId = null
      environmentForm.provinceId = null
      environmentForm.cityId = null
      countryOptions.value = []
      provinceOptions.value = []
      cityOptions.value = []
      
      if (regionId) {
        await loadCountryOptions(regionId)
      }
      await loadAvailableEnvironments()
    }

    const handleCountryChange = async (countryId) => {
      environmentForm.provinceId = null
      environmentForm.cityId = null
      provinceOptions.value = []
      cityOptions.value = []
      
      if (countryId) {
        await loadProvinceOptions(countryId)
      }
      await loadAvailableEnvironments()
    }

    const handleProvinceChange = async (provinceId) => {
      environmentForm.cityId = null
      cityOptions.value = []
      
      if (provinceId) {
        await loadCityOptions(provinceId)
      }
      await loadAvailableEnvironments()
    }
    
    const handleCityChange = async () => {
      await loadAvailableEnvironments()
    }
    
    // 切换逻辑环境选择
    const toggleEnvironmentSelection = (environmentId) => {
      const index = selectedEnvironmentIds.value.indexOf(environmentId)
      if (index > -1) {
        selectedEnvironmentIds.value.splice(index, 1)
      } else {
        selectedEnvironmentIds.value.push(environmentId)
      }
    }
    
    // 处理逻辑环境选择变化
    const handleEnvironmentSelection = () => {
      // 这里可以添加选择变化时的逻辑
    }

    const handleEdit = (row) => {
      dialogTitle.value = '编辑任务'
      Object.assign(form, row)
      dialogVisible.value = true
    }

    const handleStart = async (row) => {
      try {
        await request({
          url: `/collect-task/${row.id}/start`,
          method: 'post',
        })
        ElMessage.success('启动成功')
        loadData()
      } catch (error) {
        ElMessage.error('启动失败')
      }
    }

    const handleStop = async (row) => {
      try {
        await request({
          url: `/collect-task/${row.id}/stop`,
          method: 'post',
        })
        ElMessage.success('停止成功')
        loadData()
      } catch (error) {
        ElMessage.error('停止失败')
      }
    }

    const handlePause = async (row) => {
      try {
        await request({
          url: `/collect-task/${row.id}/pause`,
          method: 'post',
        })
        ElMessage.success('暂停成功')
        loadData()
      } catch (error) {
        ElMessage.error('暂停失败')
      }
    }

    const handleDelete = async (row) => {
      try {
        await ElMessageBox.confirm('确定要删除这个任务吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        })
        
        await request({
          url: `/collect-task/${row.id}`,
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
      submitLoading.value = true
      try {
        // 验证所有表单
        await Promise.all([
          basicFormRef.value.validate(),
          strategyFormRef.value.validate(),
          environmentFormRef.value.validate()
        ])
        
        // 验证逻辑环境选择
        if (!validateEnvironmentSelection()) {
          return
        }
        
        // 构建提交数据
        const submitData = {
          name: basicForm.name,
          description: basicForm.description,
          collectStrategyId: strategyForm.strategyId,
          collectCount: selectedStrategy.value ? selectedStrategy.value.collectCount : 1,
          regionId: environmentForm.regionId,
          countryId: environmentForm.countryId,
          provinceId: environmentForm.provinceId,
          cityId: environmentForm.cityId,
          logicEnvironmentIds: selectedEnvironmentIds.value,
        }
        
        await request({
          url: '/collect-task/create',
          method: 'post',
          data: submitData,
        })
        
        ElMessage.success('任务创建成功')
        dialogVisible.value = false
        loadData()
      } catch (error) {
        console.error('提交失败:', error)
        if (error.message) {
          ElMessage.error(error.message)
        } else {
          ElMessage.error('任务创建失败')
        }
      } finally {
        submitLoading.value = false
      }
    }

    const resetForm = () => {
      // 重置表单数据
      Object.assign(basicForm, {
        name: '',
        description: '',
      })
      
      Object.assign(strategyForm, {
        strategyId: null,
      })
      
      Object.assign(environmentForm, {
        regionId: null,
        countryId: null,
        provinceId: null,
        cityId: null,
      })
      
      // 重置选项数据
      selectedStrategy.value = null
      countryOptions.value = []
      provinceOptions.value = []
      cityOptions.value = []
      
      // 重置逻辑环境选择
      selectedEnvironmentIds.value = []
      availableEnvironments.value = []
      
      // 重置表单验证
      if (basicFormRef.value) {
        basicFormRef.value.resetFields()
      }
      if (strategyFormRef.value) {
        strategyFormRef.value.resetFields()
      }
      if (environmentFormRef.value) {
        environmentFormRef.value.resetFields()
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
      loadStrategyOptions()
    })

    return {
      loading,
      tableData,
      pagination,
      dialogVisible,
      dialogTitle,
      submitLoading,
      basicFormRef,
      strategyFormRef,
      environmentFormRef,
      basicForm,
      basicRules,
      strategyForm,
      strategyRules,
      environmentForm,
      environmentRules,

      strategyOptions,
      regionOptions,
      countryOptions,
      provinceOptions,
      cityOptions,
      selectedStrategy,
      availableEnvironments,
      environmentsLoading,
      selectedEnvironmentIds,
      environmentSummary,
      getStatusType,
      getStatusText,
      loadData,
      loadStrategyOptions,
      loadRegionOptions,
      loadCountryOptions,
      loadProvinceOptions,
      loadCityOptions,
      handleAdd,
      handleEdit,
      handleStart,
      handleStop,
      handlePause,
      handleDelete,
      handleSubmit,
      resetForm,
      handleStrategyChange,
      handleRegionChange,
      handleCountryChange,
      handleProvinceChange,
      handleCityChange,
      loadAvailableEnvironments,
      toggleEnvironmentSelection,
      handleEnvironmentSelection,
      handleSizeChange,
      handleCurrentChange,
    }
  },
}
</script>

<style scoped>
.collect-task-page {
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

/* 步骤内容样式 */
.step-content {
  min-height: 600px;
}

.step-panel {
  padding: 20px 0;
  border-bottom: 1px solid #ebeef5;
}

.step-panel:last-child {
  border-bottom: none;
}

.step-title {
  margin: 0 0 20px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
  padding-bottom: 10px;
  border-bottom: 2px solid #409eff;
}

/* 策略信息样式 */
.strategy-info {
  margin-top: 20px;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.strategy-info h4 {
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 14px;
  font-weight: 600;
}

/* 环境配置摘要样式 */
.environment-summary {
  margin-top: 20px;
}

.environment-summary h4 {
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 14px;
  font-weight: 600;
}

/* 可用逻辑环境列表样式 */
.available-environments {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.available-environments h4 {
  margin: 0 0 20px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.environments-content {
  min-height: 200px;
}

.no-environments {
  text-align: center;
  padding: 40px 0;
}

.environments-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 16px;
}

.environment-card {
  border: 1px solid #ebeef5;
  transition: all 0.3s ease;
  cursor: pointer;
}

.environment-card:hover {
  border-color: #409eff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.environment-card.selected {
  border-color: #67c23a;
  background-color: #f0f9ff;
  box-shadow: 0 2px 12px 0 rgba(103, 194, 58, 0.2);
}

.environment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.environment-status {
  display: flex;
  align-items: center;
}

.environment-name {
  margin: 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.environment-info {
  margin-bottom: 12px;
}

.environment-info p {
  margin: 4px 0;
  color: #606266;
  font-size: 14px;
}

.environment-ue,
.environment-networks {
  margin-top: 12px;
}

.environment-ue p,
.environment-networks p {
  margin: 0 0 8px 0;
  color: #606266;
  font-size: 14px;
  font-weight: 500;
}

.ue-list,
.network-list {
  display: flex;
  flex-wrap: wrap;
}

.selection-tip {
  margin-top: 16px;
}


</style>
