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
              :disabled="scope.row.status === 1"
            >
              启动
            </el-button>
            <el-button 
              size="small" 
              type="warning" 
              @click="handlePause(scope.row)"
              :disabled="scope.row.status !== 1"
            >
              暂停
            </el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="handleStop(scope.row)"
              :disabled="scope.row.status === 0"
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
        <el-form-item label="任务名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入任务名称" />
        </el-form-item>
        <el-form-item label="关联策略" prop="strategyId">
          <el-select v-model="form.strategyId" placeholder="请选择关联策略" style="width: 100%">
            <el-option
              v-for="item in strategyOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="执行计划" prop="schedule">
          <el-input v-model="form.schedule" placeholder="请输入Cron表达式，如：0 0 */1 * * ?" />
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
            <el-radio :label="0">停止</el-radio>
            <el-radio :label="1">运行中</el-radio>
            <el-radio :label="2">暂停</el-radio>
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

export default {
  name: 'CollectTask',
  setup() {
    const loading = ref(false)
    const tableData = ref([])
    const dialogVisible = ref(false)
    const dialogTitle = ref('')
    const formRef = ref()
    const strategyOptions = ref([])

    const pagination = reactive({
      current: 1,
      size: 10,
      total: 0,
    })

    const form = reactive({
      id: null,
      name: '',
      strategyId: null,
      schedule: '',
      description: '',
      status: 0,
    })

    const rules = {
      name: [
        { required: true, message: '请输入任务名称', trigger: 'blur' },
      ],
      strategyId: [
        { required: true, message: '请选择关联策略', trigger: 'change' },
      ],
      schedule: [
        { required: true, message: '请输入执行计划', trigger: 'blur' },
      ],
    }

    const getStatusType = (status) => {
      const typeMap = {
        0: 'info',
        1: 'success',
        2: 'warning',
      }
      return typeMap[status] || 'info'
    }

    const getStatusText = (status) => {
      const textMap = {
        0: '停止',
        1: '运行中',
        2: '暂停',
      }
      return textMap[status] || '未知'
    }

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

    const handleAdd = () => {
      dialogTitle.value = '新增任务'
      dialogVisible.value = true
      resetForm()
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
      try {
        await formRef.value.validate()
        
        if (form.id) {
          await request({
            url: `/collect-task/${form.id}`,
            method: 'put',
            data: form,
          })
          ElMessage.success('更新成功')
        } else {
          await request({
            url: '/collect-task',
            method: 'post',
            data: form,
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
        strategyId: null,
        schedule: '',
        description: '',
        status: 0,
      })
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
      loadStrategyOptions()
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
      strategyOptions,
      getStatusType,
      getStatusText,
      loadData,
      handleAdd,
      handleEdit,
      handleStart,
      handleStop,
      handlePause,
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
</style>
