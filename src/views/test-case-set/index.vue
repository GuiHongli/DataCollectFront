<template>
  <div class="test-case-set-page">
    <div class="page-header">
      <h2 class="page-title">用例集管理</h2>
      <p class="page-description">管理用例集，支持zip文件上传</p>
    </div>

    <el-card>
      <div class="table-operations">
        <el-button type="primary" @click="handleUpload">
          <el-icon><Upload /></el-icon>
          上传用例集
        </el-button>
        <el-button @click="loadData">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" style="width: 100%">
        <el-table-column prop="name" label="用例集名称" />
        <el-table-column prop="version" label="版本" />
        <el-table-column prop="fileSize" label="文件大小">
          <template #default="scope">
            {{ formatFileSize(scope.row.fileSize) }}
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

    <!-- 上传对话框 -->
    <el-dialog
      v-model="uploadDialogVisible"
      title="上传用例集"
      width="500px"
    >
      <el-form
        ref="uploadFormRef"
        :model="uploadForm"
        :rules="uploadRules"
        label-width="100px"
      >
        <el-form-item label="用例集文件" prop="file">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :on-change="handleFileChange"
            :before-upload="beforeUpload"
            accept=".zip"
            drag
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                只能上传zip文件，且文件名格式为：用例集名称_版本.zip
              </div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="uploadForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="uploadDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitUpload">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 编辑对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑用例集"
      width="500px"
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="editRules"
        label-width="100px"
      >
        <el-form-item label="用例集名称" prop="name">
          <el-input v-model="editForm.name" placeholder="请输入用例集名称" />
        </el-form-item>
        <el-form-item label="版本" prop="version">
          <el-input v-model="editForm.version" placeholder="请输入版本" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="editForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入描述"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="editForm.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitEdit">确定</el-button>
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
  name: 'TestCaseSet',
  setup() {
    const loading = ref(false)
    const tableData = ref([])
    const uploadDialogVisible = ref(false)
    const editDialogVisible = ref(false)
    const uploadFormRef = ref()
    const editFormRef = ref()
    const uploadRef = ref()

    const pagination = reactive({
      current: 1,
      size: 10,
      total: 0,
    })

    const uploadForm = reactive({
      file: null,
      description: '',
    })

    const editForm = reactive({
      id: null,
      name: '',
      version: '',
      description: '',
      status: 1,
    })

    const uploadRules = {
      file: [
        { required: true, message: '请选择文件', trigger: 'change' },
      ],
    }

    const editRules = {
      name: [
        { required: true, message: '请输入用例集名称', trigger: 'blur' },
      ],
      version: [
        { required: true, message: '请输入版本', trigger: 'blur' },
      ],
    }

    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const loadData = async () => {
      loading.value = true
      try {
        const params = {
          current: pagination.current,
          size: pagination.size,
        }
        const res = await request({
          url: '/test-case-set/page',
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

    const handleUpload = () => {
      uploadDialogVisible.value = true
      resetUploadForm()
    }

    const handleFileChange = (file) => {
      uploadForm.file = file.raw
    }

    const beforeUpload = (file) => {
      const isZip = file.type === 'application/zip' || file.name.endsWith('.zip')
      if (!isZip) {
        ElMessage.error('只能上传zip文件!')
        return false
      }
      
      const fileName = file.name.replace('.zip', '')
      const parts = fileName.split('_')
      if (parts.length < 2) {
        ElMessage.error('文件名格式错误，应为：用例集名称_版本.zip')
        return false
      }
      
      return false // 阻止自动上传
    }

    const submitUpload = async () => {
      try {
        await uploadFormRef.value.validate()
        
        const formData = new FormData()
        formData.append('file', uploadForm.file)
        formData.append('description', uploadForm.description)
        
        await request({
          url: '/test-case-set/upload',
          method: 'post',
          data: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        
        ElMessage.success('上传成功')
        uploadDialogVisible.value = false
        loadData()
      } catch (error) {
        console.error('上传失败:', error)
      }
    }

    const handleEdit = (row) => {
      Object.assign(editForm, row)
      editDialogVisible.value = true
    }

    const submitEdit = async () => {
      try {
        await editFormRef.value.validate()
        
        await request({
          url: `/test-case-set/${editForm.id}`,
          method: 'put',
          data: editForm,
        })
        
        ElMessage.success('更新成功')
        editDialogVisible.value = false
        loadData()
      } catch (error) {
        console.error('更新失败:', error)
      }
    }

    const handleDelete = async (row) => {
      try {
        await ElMessageBox.confirm('确定要删除这个用例集吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        })
        
        await request({
          url: `/test-case-set/${row.id}`,
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

    const resetUploadForm = () => {
      Object.assign(uploadForm, {
        file: null,
        description: '',
      })
      if (uploadRef.value) {
        uploadRef.value.clearFiles()
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
    })

    return {
      loading,
      tableData,
      pagination,
      uploadDialogVisible,
      editDialogVisible,
      uploadFormRef,
      editFormRef,
      uploadRef,
      uploadForm,
      editForm,
      uploadRules,
      editRules,
      formatFileSize,
      loadData,
      handleUpload,
      handleFileChange,
      beforeUpload,
      submitUpload,
      handleEdit,
      submitEdit,
      handleDelete,
      resetUploadForm,
      handleSizeChange,
      handleCurrentChange,
    }
  },
}
</script>

<style scoped>
.test-case-set-page {
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
