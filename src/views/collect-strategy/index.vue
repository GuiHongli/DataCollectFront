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
          <el-select v-model="form.testCaseSetId" placeholder="请选择用例集" style="width: 100%">
            <el-option
              v-for="item in testCaseSetOptions"
              :key="item.id"
              :label="`${item.name} (${item.version})`"
              :value="item.id"
            />
          </el-select>
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
import { ref, reactive, onMounted } from 'vue'
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

    const handleAdd = () => {
      dialogTitle.value = '新增策略'
      dialogVisible.value = true
      resetForm()
    }

    const handleEdit = (row) => {
      dialogTitle.value = '编辑策略'
      Object.assign(form, row)
      dialogVisible.value = true
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
        
        if (form.id) {
          await request({
            url: `/collect-strategy/${form.id}`,
            method: 'put',
            data: form,
          })
          ElMessage.success('更新成功')
        } else {
          await request({
            url: '/collect-strategy',
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
        collectCount: 1,
        testCaseSetId: null,
        description: '',
        status: 1,
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
      loadTestCaseSetOptions()
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
      loadData,
      loadTestCaseSetOptions,
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
</style>
