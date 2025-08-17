<template>
  <div class="logic-environment-page">
    <div class="page-header">
      <h2 class="page-title">逻辑环境管理</h2>
      <p class="page-description">管理执行机和UE的组合逻辑环境</p>
    </div>

    <el-card>
      <div class="table-operations">
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增逻辑环境
        </el-button>
        <el-button @click="loadData">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" style="width: 100%">
        <el-table-column prop="name" label="逻辑环境名称" />
        <el-table-column label="执行机" min-width="200">
          <template #default="scope">
            <div>
              <div>{{ scope.row.executorName }}</div>
              <div style="color: #909399; font-size: 12px;">{{ scope.row.executorIpAddress }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="UE信息" min-width="300">
          <template #default="scope">
            <div v-if="scope.row.ueList && scope.row.ueList.length > 0">
              <div v-for="ue in scope.row.ueList" :key="ue.id" style="margin-bottom: 8px;">
                <el-tag size="small" type="info">
                  {{ ue.name }} ({{ ue.ueId }}) - {{ ue.purpose }}
                </el-tag>
              </div>
            </div>
            <span v-else style="color: #909399;">暂无UE</span>
          </template>
        </el-table-column>
        <el-table-column label="逻辑组网" min-width="200">
          <template #default="scope">
            <div v-if="scope.row.networkList && scope.row.networkList.length > 0">
              <div v-for="network in scope.row.networkList" :key="network.id" style="margin-bottom: 8px;">
                <el-tag size="small" type="success">
                  {{ network.name }}
                </el-tag>
              </div>
            </div>
            <span v-else style="color: #909399;">暂无组网</span>
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
        <el-table-column label="操作" width="300">
          <template #default="scope">
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button size="small" type="primary" @click="handleManageUe(scope.row)">管理UE</el-button>
            <el-button size="small" type="warning" @click="handleManageNetwork(scope.row)">管理组网</el-button>
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
      width="600px"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
      >
        <el-form-item label="逻辑环境名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入逻辑环境名称" />
        </el-form-item>
        <el-form-item label="执行机" prop="executorId">
          <el-select v-model="form.executorId" placeholder="请选择执行机" style="width: 100%">
            <el-option
              v-for="item in executorOptions"
              :key="item.id"
              :label="`${item.name} (${item.ipAddress}) - ${item.regionName}`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="UE选择" prop="selectedUeIds">
          <el-select
            v-model="form.selectedUeIds"
            multiple
            filterable
            placeholder="请选择UE"
            style="width: 100%"
            @change="handleUeSelectionChange"
          >
            <el-option
              v-for="item in ueOptions"
              :key="item.id"
              :label="`${item.name} (${item.ueId}) - ${item.purpose}`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="已选UE" v-if="form.selectedUeIds && form.selectedUeIds.length > 0">
          <div class="selected-ue-list">
            <el-tag
              v-for="ueId in form.selectedUeIds"
              :key="ueId"
              closable
              @close="removeSelectedUe(ueId)"
              style="margin-right: 8px; margin-bottom: 8px;"
            >
              {{ getUeDisplayName(ueId) }}
            </el-tag>
          </div>
        </el-form-item>
        <el-form-item label="逻辑组网选择" prop="selectedNetworkIds">
          <div style="margin-bottom: 10px;">
            <el-button size="small" type="primary" @click="showAddNetworkDialog">
              <el-icon><Plus /></el-icon>
              快速添加组网
            </el-button>
          </div>
          <el-select
            v-model="form.selectedNetworkIds"
            multiple
            filterable
            placeholder="请选择逻辑组网"
            style="width: 100%"
            @change="handleNetworkSelectionChange"
          >
            <el-option
              v-for="item in networkOptions"
              :key="item.id"
              :label="`${item.name}${item.description ? ' - ' + item.description : ''}`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="已选组网" v-if="form.selectedNetworkIds && form.selectedNetworkIds.length > 0">
          <div class="selected-network-list">
            <el-tag
              v-for="networkId in form.selectedNetworkIds"
              :key="networkId"
              closable
              @close="removeSelectedNetwork(networkId)"
              style="margin-right: 8px; margin-bottom: 8px;"
            >
              {{ getNetworkDisplayName(networkId) }}
            </el-tag>
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

    <!-- UE管理对话框 -->
    <el-dialog
      v-model="ueDialogVisible"
      title="管理UE"
      width="600px"
    >
      <div class="ue-management">
        <div class="ue-section">
          <h4>当前UE列表</h4>
          <el-table :data="currentUes" style="width: 100%">
            <el-table-column prop="name" label="UE名称" />
            <el-table-column prop="ueId" label="UE ID" />
            <el-table-column prop="purpose" label="用途" />
            <el-table-column label="操作" width="100">
              <template #default="scope">
                <el-button size="small" type="danger" @click="removeUe(scope.row)">移除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
        
        <div class="ue-section">
          <h4>添加UE</h4>
          <el-select
            v-model="selectedUeId"
            placeholder="请选择要添加的UE"
            style="width: 100%"
            @change="addUe"
          >
            <el-option
              v-for="item in availableUes"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </div>
      </div>
    </el-dialog>

    <!-- 逻辑组网管理对话框 -->
    <el-dialog
      v-model="networkDialogVisible"
      title="管理逻辑组网"
      width="600px"
    >
      <div class="network-management">
        <div class="network-section">
          <h4>当前组网列表</h4>
          <el-table :data="currentNetworks" style="width: 100%">
            <el-table-column prop="name" label="组网名称" />
            <el-table-column prop="description" label="描述" />
            <el-table-column label="操作" width="100">
              <template #default="scope">
                <el-button size="small" type="danger" @click="removeNetwork(scope.row)">移除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
        
        <div class="network-section">
          <h4>添加组网</h4>
          <el-select
            v-model="selectedNetworkId"
            placeholder="请选择要添加的组网"
            style="width: 100%"
            @change="addNetwork"
          >
            <el-option
              v-for="item in availableNetworks"
              :key="item.id"
              :label="`${item.name}${item.description ? ' - ' + item.description : ''}`"
              :value="item.id"
            />
          </el-select>
        </div>
      </div>
    </el-dialog>

    <!-- 快速添加逻辑组网对话框 -->
    <el-dialog
      v-model="quickAddNetworkDialogVisible"
      title="快速添加逻辑组网"
      width="500px"
    >
      <div class="quick-add-network">
        <div class="network-list">
          <div v-for="(network, index) in quickAddNetworks" :key="index" class="network-item">
            <el-form-item :label="`组网 ${index + 1}`" :prop="`networks.${index}.name`">
              <el-input
                v-model="network.name"
                placeholder="请输入组网名称"
                style="width: 100%; margin-bottom: 8px;"
              />
              <el-input
                v-model="network.description"
                type="textarea"
                :rows="2"
                placeholder="请输入组网描述（可选）"
                style="width: 100%;"
              />
            </el-form-item>
            <el-button
              v-if="quickAddNetworks.length > 1"
              size="small"
              type="danger"
              @click="removeQuickAddNetwork(index)"
              style="margin-top: 8px;"
            >
              删除
            </el-button>
          </div>
        </div>
        
        <div class="add-network-button">
          <el-button type="primary" @click="addQuickAddNetwork">
            <el-icon><Plus /></el-icon>
            添加更多组网
          </el-button>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="quickAddNetworkDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitQuickAddNetworks">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

export default {
  name: 'LogicEnvironment',
  setup() {
    const loading = ref(false)
    const tableData = ref([])
    const dialogVisible = ref(false)
    const dialogTitle = ref('')
    const formRef = ref()
    const executorOptions = ref([])
    const ueOptions = ref([])
    const networkOptions = ref([])
    
    // UE管理相关
    const ueDialogVisible = ref(false)
    const currentUes = ref([])
    const availableUes = ref([])
    const selectedUeId = ref(null)
    const currentLogicEnvironmentId = ref(null)

    // 逻辑组网管理相关
    const networkDialogVisible = ref(false)
    const currentNetworks = ref([])
    const availableNetworks = ref([])
    const selectedNetworkId = ref(null)

    // 快速添加逻辑组网相关
    const quickAddNetworkDialogVisible = ref(false)
    const quickAddNetworks = ref([{ name: '', description: '' }])

    const pagination = reactive({
      current: 1,
      size: 10,
      total: 0,
    })

    const form = reactive({
      id: null,
      name: '',
      executorId: null,
      selectedUeIds: [],
      selectedNetworkIds: [],
      description: '',
      status: 1,
    })

    const rules = {
      name: [
        { required: true, message: '请输入逻辑环境名称', trigger: 'blur' },
      ],
      executorId: [
        { required: true, message: '请选择执行机', trigger: 'change' },
      ],
      selectedUeIds: [
        { required: true, message: '请选择UE', trigger: 'change' },
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
          url: '/logic-environment/page',
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

    const loadExecutorOptions = async () => {
      try {
        const res = await request({
          url: '/executor/options',
          method: 'get',
        })
        executorOptions.value = res.data
      } catch (error) {
        console.error('加载执行机数据失败:', error)
      }
    }

    const loadUeOptions = async () => {
      try {
        const res = await request({
          url: '/ue/options',
          method: 'get',
        })
        ueOptions.value = res.data
      } catch (error) {
        console.error('加载UE数据失败:', error)
      }
    }

    const loadNetworkOptions = async () => {
      try {
        const res = await request({
          url: '/logic-network/list',
          method: 'get',
        })
        networkOptions.value = res.data
      } catch (error) {
        console.error('加载组网数据失败:', error)
      }
    }

    const getUeDisplayName = (ueId) => {
      const ue = ueOptions.value.find(item => item.id === ueId)
      return ue ? `${ue.name} (${ue.ueId}) - ${ue.purpose}` : ueId
    }

    const getNetworkDisplayName = (networkId) => {
      const network = networkOptions.value.find(item => item.id === networkId)
      return network ? `${network.name}${network.description ? ' - ' + network.description : ''}` : networkId
    }

    const handleUeSelectionChange = (value) => {
      form.selectedUeIds = value
    }

    const removeSelectedUe = (ueId) => {
      const index = form.selectedUeIds.indexOf(ueId)
      if (index > -1) {
        form.selectedUeIds.splice(index, 1)
      }
    }

    const handleNetworkSelectionChange = (value) => {
      form.selectedNetworkIds = value
    }

    const removeSelectedNetwork = (networkId) => {
      const index = form.selectedNetworkIds.indexOf(networkId)
      if (index > -1) {
        form.selectedNetworkIds.splice(index, 1)
      }
    }

    const handleAdd = () => {
      dialogTitle.value = '新增逻辑环境'
      dialogVisible.value = true
      resetForm()
      loadExecutorOptions()
      loadUeOptions()
      loadNetworkOptions()
    }

    const handleEdit = (row) => {
      dialogTitle.value = '编辑逻辑环境'
      Object.assign(form, row)
      
      // 处理UE回显：将ueList中的UE ID提取到selectedUeIds
      if (row.ueList && row.ueList.length > 0) {
        form.selectedUeIds = row.ueList.map(ue => ue.id)
      } else {
        form.selectedUeIds = []
      }
      
      // 处理逻辑组网回显：将networkList中的网络ID提取到selectedNetworkIds
      if (row.networkList && row.networkList.length > 0) {
        form.selectedNetworkIds = row.networkList.map(network => network.id)
      } else {
        form.selectedNetworkIds = []
      }
      
      dialogVisible.value = true
      loadExecutorOptions()
      loadUeOptions()
      loadNetworkOptions()
    }

    const handleDelete = async (row) => {
      try {
        await ElMessageBox.confirm('确定要删除这个逻辑环境吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        })
        
        await request({
          url: `/logic-environment/${row.id}`,
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
        
        if (form.id) {
          // 编辑逻辑环境，同时更新UE和逻辑组网关联
          const requestData = {
            logicEnvironment: {
              name: form.name,
              executorId: form.executorId,
              description: form.description,
              status: form.status,
            },
            ueIds: form.selectedUeIds,
            networkIds: form.selectedNetworkIds,
          }
          
          await request({
            url: `/logic-environment/${form.id}/with-ue-and-network`,
            method: 'put',
            data: requestData,
          })
          ElMessage.success('更新成功')
        } else {
          // 新增逻辑环境，同时关联UE
          const requestData = {
            logicEnvironment: {
              name: form.name,
              executorId: form.executorId,
              description: form.description,
              status: form.status,
            },
            ueIds: form.selectedUeIds,
            networkIds: form.selectedNetworkIds,
          }
          
          await request({
            url: '/logic-environment/with-ue-and-network',
            method: 'post',
            data: requestData,
          })
          ElMessage.success('创建成功')
        }
        
        dialogVisible.value = false
        loadData()
      } catch (error) {
        console.error('提交失败:', error)
        ElMessage.error('操作失败')
      }
    }

    const resetForm = () => {
      Object.assign(form, {
        id: null,
        name: '',
        executorId: null,
        selectedUeIds: [],
        selectedNetworkIds: [],
        description: '',
        status: 1,
      })
      if (formRef.value) {
        formRef.value.resetFields()
      }
    }

    // UE管理相关方法
    const handleManageUe = async (row) => {
      currentLogicEnvironmentId.value = row.id
      ueDialogVisible.value = true
      await loadCurrentUes(row.id)
      await loadAvailableUes()
    }

    const loadCurrentUes = async (logicEnvironmentId) => {
      try {
        const res = await request({
          url: `/logic-environment/${logicEnvironmentId}/ue`,
          method: 'get',
        })
        currentUes.value = res.data
      } catch (error) {
        console.error('加载当前UE失败:', error)
      }
    }

    const loadAvailableUes = async () => {
      try {
        const res = await request({
          url: '/ue/list',
          method: 'get',
        })
        availableUes.value = res.data
      } catch (error) {
        console.error('加载可用UE失败:', error)
      }
    }

    const addUe = async () => {
      if (!selectedUeId.value) return
      
      try {
        await request({
          url: `/logic-environment/${currentLogicEnvironmentId.value}/ue`,
          method: 'post',
          data: [selectedUeId.value],
        })
        ElMessage.success('添加UE成功')
        selectedUeId.value = null
        await loadCurrentUes(currentLogicEnvironmentId.value)
        await loadAvailableUes()
      } catch (error) {
        ElMessage.error('添加UE失败')
      }
    }

    const removeUe = async (ue) => {
      try {
        await request({
          url: `/logic-environment/${currentLogicEnvironmentId.value}/ue/${ue.ueId}`,
          method: 'delete',
        })
        ElMessage.success('移除UE成功')
        await loadCurrentUes(currentLogicEnvironmentId.value)
        await loadAvailableUes()
      } catch (error) {
        ElMessage.error('移除UE失败')
      }
    }

    // 逻辑组网管理相关方法
    const handleManageNetwork = async (row) => {
      currentLogicEnvironmentId.value = row.id
      networkDialogVisible.value = true
      await loadCurrentNetworks(row.id)
      await loadAvailableNetworks()
    }

    const loadCurrentNetworks = async (logicEnvironmentId) => {
      try {
        const res = await request({
          url: `/logic-environment/${logicEnvironmentId}/network`,
          method: 'get',
        })
        currentNetworks.value = res.data
      } catch (error) {
        console.error('加载当前组网失败:', error)
      }
    }

    const loadAvailableNetworks = async () => {
      try {
        const res = await request({
          url: '/logic-network/list',
          method: 'get',
        })
        availableNetworks.value = res.data
      } catch (error) {
        console.error('加载可用组网失败:', error)
      }
    }

    const addNetwork = async () => {
      if (!selectedNetworkId.value) return
      
      try {
        await request({
          url: `/logic-environment/${currentLogicEnvironmentId.value}/network`,
          method: 'post',
          data: [selectedNetworkId.value],
        })
        ElMessage.success('添加组网成功')
        selectedNetworkId.value = null
        await loadCurrentNetworks(currentLogicEnvironmentId.value)
        await loadAvailableNetworks()
      } catch (error) {
        ElMessage.error('添加组网失败')
      }
    }

    const removeNetwork = async (network) => {
      try {
        await request({
          url: `/logic-environment/${currentLogicEnvironmentId.value}/network/${network.id}`,
          method: 'delete',
        })
        ElMessage.success('移除组网成功')
        await loadCurrentNetworks(currentLogicEnvironmentId.value)
        await loadAvailableNetworks()
      } catch (error) {
        ElMessage.error('移除组网失败')
      }
    }

    // 快速添加逻辑组网相关方法
    const showAddNetworkDialog = () => {
      quickAddNetworks.value = [{ name: '', description: '' }]
      quickAddNetworkDialogVisible.value = true
    }

    const addQuickAddNetwork = () => {
      quickAddNetworks.value.push({ name: '', description: '' })
    }

    const removeQuickAddNetwork = (index) => {
      quickAddNetworks.value.splice(index, 1)
    }

    const submitQuickAddNetworks = async () => {
      // 验证输入
      for (let i = 0; i < quickAddNetworks.value.length; i++) {
        const network = quickAddNetworks.value[i]
        if (!network.name || !network.name.trim()) {
          ElMessage.warning(`请填写组网 ${i + 1} 的名称`)
          return
        }
        // 描述字段不是必需的，可以为空
      }

      try {
        // 批量创建逻辑组网
        const createdNetworks = []
        for (const network of quickAddNetworks.value) {
          const res = await request({
            url: '/logic-network',
            method: 'post',
            data: {
              name: network.name.trim(),
              description: network.description ? network.description.trim() : '', // 描述可以为空
            },
          })
          createdNetworks.push(res.data)
        }

        // 将新创建的组网添加到选择列表中
        for (const network of createdNetworks) {
          if (!form.selectedNetworkIds.includes(network.id)) {
            form.selectedNetworkIds.push(network.id)
          }
        }

        // 刷新组网选项列表
        await loadNetworkOptions()
        
        ElMessage.success(`成功创建 ${createdNetworks.length} 个逻辑组网`)
        quickAddNetworkDialogVisible.value = false
      } catch (error) {
        console.error('快速添加组网失败:', error)
        ElMessage.error('快速添加组网失败')
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
      loadExecutorOptions()
      loadUeOptions()
      loadNetworkOptions()
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
      executorOptions,
      ueOptions,
      networkOptions,
      ueDialogVisible,
      currentUes,
      availableUes,
      selectedUeId,
      loadData,
      handleAdd,
      handleEdit,
      handleDelete,
      handleSubmit,
      resetForm,
      handleManageUe,
      addUe,
      removeUe,
      handleSizeChange,
      handleCurrentChange,
      getUeDisplayName,
      handleUeSelectionChange,
      removeSelectedUe,
      networkDialogVisible,
      currentNetworks,
      availableNetworks,
      selectedNetworkId,
      handleManageNetwork,
      loadCurrentNetworks,
      loadAvailableNetworks,
      addNetwork,
      removeNetwork,
      getNetworkDisplayName,
      handleNetworkSelectionChange,
      removeSelectedNetwork,
      showAddNetworkDialog,
      quickAddNetworkDialogVisible,
      quickAddNetworks,
      addQuickAddNetwork,
      removeQuickAddNetwork,
      submitQuickAddNetworks,
    }
  },
}
</script>

<style scoped>
.logic-environment-page {
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

.ue-management {
  padding: 20px 0;
}

.ue-section {
  margin-bottom: 20px;
}

.ue-section h4 {
  margin-bottom: 10px;
  color: #303133;
}

.ue-option {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ue-name {
  font-weight: bold;
  color: #303133;
}

.ue-details {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #909399;
}

.ue-id {
  color: #409EFF;
}

.ue-purpose {
  color: #67C23A;
}



.selected-ue-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.quick-add-network .network-list {
  max-height: 300px;
  overflow-y: auto;
  padding-right: 10px;
}

.quick-add-network .network-item {
  margin-bottom: 15px;
}

.quick-add-network .network-item .el-form-item {
  margin-bottom: 8px;
}

.quick-add-network .add-network-button {
  text-align: center;
  margin-top: 15px;
}
</style>
