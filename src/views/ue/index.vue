<template>
  <div class="ue-page">
    <div class="page-header">
      <h2 class="page-title">UE管理</h2>
      <p class="page-description">管理UE信息，包括UE ID、用途、网络类型等</p>
    </div>

    <el-card>
      <div class="table-operations">
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增UE
        </el-button>
        <el-button @click="loadData">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" style="width: 100%">
        <el-table-column prop="name" label="UE名称" />
        <el-table-column prop="ueId" label="UE ID" />
        <el-table-column prop="purpose" label="用途" />
        <el-table-column prop="networkTypeName" label="网络类型" />
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
        label-width="100px"
      >
        <el-form-item label="UE名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入UE名称" />
        </el-form-item>
        <el-form-item label="UE ID" prop="ueId">
          <el-input v-model="form.ueId" placeholder="请输入UE ID" />
        </el-form-item>
        <el-form-item label="用途" prop="purpose">
          <el-input v-model="form.purpose" placeholder="请输入用途" />
        </el-form-item>
        <el-form-item label="网络类型" prop="networkTypeId">
          <el-select v-model="form.networkTypeId" placeholder="请选择网络类型" style="width: 100%">
            <el-option
              v-for="item in networkTypeOptions"
              :key="item.id"
              :label="item.name"
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
import request from '@/utils/request'

export default {
  name: 'Ue',
  setup() {
    const loading = ref(false)
    const tableData = ref([])
    const dialogVisible = ref(false)
    const dialogTitle = ref('')
    const formRef = ref()
    const networkTypeOptions = ref([])

    const pagination = reactive({
      current: 1,
      size: 10,
      total: 0,
    })

    const form = reactive({
      id: null,
      name: '',
      ueId: '',
      purpose: '',
      networkTypeId: null,
      description: '',
      status: 1,
    })

    const rules = {
      name: [
        { required: true, message: '请输入UE名称', trigger: 'blur' },
      ],
      ueId: [
        { required: true, message: '请输入UE ID', trigger: 'blur' },
      ],
      purpose: [
        { required: true, message: '请输入用途', trigger: 'blur' },
      ],
      networkTypeId: [
        { required: true, message: '请选择网络类型', trigger: 'change' },
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
          url: '/ue/page',
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

    const loadNetworkTypeOptions = async () => {
      try {
        const res = await request({
          url: '/network-type/list',
          method: 'get',
        })
        networkTypeOptions.value = res.data
      } catch (error) {
        console.error('加载网络类型数据失败:', error)
      }
    }

    const handleAdd = () => {
      dialogTitle.value = '新增UE'
      dialogVisible.value = true
      resetForm()
    }

    const handleEdit = (row) => {
      dialogTitle.value = '编辑UE'
      Object.assign(form, row)
      dialogVisible.value = true
    }

    const handleDelete = async (row) => {
      try {
        await ElMessageBox.confirm('确定要删除这个UE吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        })
        
        await request({
          url: `/ue/${row.id}`,
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
            url: `/ue/${form.id}`,
            method: 'put',
            data: form,
          })
          ElMessage.success('更新成功')
        } else {
          await request({
            url: '/ue',
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
        ueId: '',
        purpose: '',
        networkTypeId: null,
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
      loadNetworkTypeOptions()
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
      networkTypeOptions,
      loadData,
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
.ue-page {
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
