<template>
  <div class="region-page">
    <div class="page-header">
      <h2 class="page-title">地域管理</h2>
      <p class="page-description">管理片区、国家、省份、城市等地域信息</p>
    </div>

    <el-card>
      <div class="table-operations">
        <el-button type="primary" @click="handleBatchAdd">
          <el-icon><Plus /></el-icon>
          批量录入地域
        </el-button>
        <el-button @click="loadData">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" style="width: 100%">
        <el-table-column prop="regionName" label="地域" width="120" />
        <el-table-column prop="countryName" label="国家" width="150" />
        <el-table-column prop="provinceName" label="省份" width="120" />
        <el-table-column prop="cityName" label="城市" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
              {{ scope.row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button type="primary" size="small" @click="handleEdit(scope.row)">
              编辑
            </el-button>
            <el-button type="danger" size="small" @click="handleDelete(scope.row)">
              删除
            </el-button>
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
          :hide-on-single-page="false"
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
        <el-form-item label="地域名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入地域名称" />
        </el-form-item>
        <el-form-item label="层级" prop="level">
          <el-select v-model="form.level" placeholder="请选择层级" style="width: 100%">
            <el-option label="片区" :value="1" />
            <el-option label="国家" :value="2" />
            <el-option label="省份" :value="3" />
            <el-option label="城市" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="上级地域" prop="parentId" v-if="form.level > 1">
          <el-select v-model="form.parentId" placeholder="请选择上级地域" style="width: 100%">
            <el-option
              v-for="item in parentOptions"
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

    <!-- 批量录入地域对话框 -->
    <el-dialog
      v-model="batchDialogVisible"
      title="批量录入地域信息"
      width="600px"
      @close="resetBatchForm"
    >
      <el-form
        ref="batchFormRef"
        :model="batchForm"
        :rules="batchRules"
        label-width="120px"
      >
        <el-form-item label="地域名称" prop="regionName">
          <el-select
            v-model="batchForm.regionName"
            filterable
            allow-create
            default-first-option
            placeholder="请选择或输入地域名称（如：中国、亚太区）"
            style="width: 100%"
            @change="handleRegionChange"
          >
            <el-option
              v-for="item in regionOptions"
              :key="item.id"
              :label="item.name"
              :value="item.name"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="国家名称" prop="countryName">
          <el-select
            v-model="batchForm.countryName"
            filterable
            allow-create
            default-first-option
            placeholder="请选择或输入国家名称"
            style="width: 100%"
            @change="handleCountryChange"
            :disabled="!batchForm.regionName"
          >
            <el-option
              v-for="item in filteredCountryOptions"
              :key="item.id"
              :label="item.name"
              :value="item.name"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="省份名称" prop="provinceName">
          <el-select
            v-model="batchForm.provinceName"
            filterable
            allow-create
            default-first-option
            placeholder="请选择或输入省份名称（可选）"
            style="width: 100%"
            @change="handleProvinceChange"
            :disabled="!batchForm.countryName"
          >
            <el-option
              v-for="item in filteredProvinceOptions"
              :key="item.id"
              :label="item.name"
              :value="item.name"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="城市名称" prop="cityName">
          <el-select
            v-model="batchForm.cityName"
            filterable
            allow-create
            default-first-option
            placeholder="请选择或输入城市名称（可选）"
            style="width: 100%"
            @change="handleCityChange"
            :disabled="!batchForm.provinceName"
          >
            <el-option
              v-for="item in filteredCityOptions"
              :key="item.id"
              :label="item.name"
              :value="item.name"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="batchForm.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="batchDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleBatchSubmit">确定</el-button>
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
  name: 'Region',
  setup() {
    const loading = ref(false)
    const tableData = ref([])
    const dialogVisible = ref(false)
    const dialogTitle = ref('')
    const formRef = ref()
    const parentOptions = ref([])
    
    // 批量录入相关
    const batchDialogVisible = ref(false)
    const batchFormRef = ref()
    const regionOptions = ref([])
    const countryOptions = ref([])
    const provinceOptions = ref([])
    const cityOptions = ref([])

    const pagination = reactive({
      current: 1,
      size: 10,
      total: 0,
    })

    const form = reactive({
      id: null,
      name: '',
      level: 1,
      parentId: null,
      description: '',
      status: 1,
    })

    const batchForm = reactive({
      regionName: '',
      countryName: '',
      provinceName: '',
      cityName: '',
      status: 1,
    })

    const rules = {
      name: [
        { required: true, message: '请输入地域名称', trigger: 'blur' },
      ],
      level: [
        { required: true, message: '请选择层级', trigger: 'change' },
      ],
    }

    const batchRules = {
      regionName: [
        { required: true, message: '请选择或输入地域名称', trigger: 'change' },
      ],
      countryName: [
        { required: true, message: '请选择或输入国家名称', trigger: 'change' },
      ],
    }

    const getLevelType = (level) => {
      const typeMap = {
        1: 'primary',
        2: 'success',
        3: 'warning',
        4: 'info',
      }
      return typeMap[level] || 'info'
    }

    const getLevelText = (level) => {
      const textMap = {
        1: '片区',
        2: '国家',
        3: '省份',
        4: '城市',
      }
      return textMap[level] || '未知'
    }

    const loadData = async () => {
      loading.value = true
      try {
        const params = {
          current: pagination.current,
          size: pagination.size,
        }
        const res = await request({
          url: '/region/hierarchy',
          method: 'get',
          params,
        })
        tableData.value = res.data.records || res.data
        pagination.total = res.data.total || res.data.length
      } catch (error) {
        console.error('加载数据失败:', error)
      } finally {
        loading.value = false
      }
    }

    const loadParentOptions = async (level) => {
      if (level <= 1) return
      try {
        const res = await request({
          url: `/region/level/${level - 1}`,
          method: 'get',
        })
        parentOptions.value = res.data
      } catch (error) {
        console.error('加载上级地域失败:', error)
      }
    }

    // 加载所有选项数据
    const loadAllOptions = async () => {
      try {
        // 加载所有地域数据（包含层级关系）
        const allRegionsRes = await request({
          url: '/region/list',
          method: 'get'
        })
        const allRegions = allRegionsRes.data || []
        
        // 按层级分组
        regionOptions.value = allRegions.filter(item => item.level === 1)
        countryOptions.value = allRegions.filter(item => item.level === 2)
        provinceOptions.value = allRegions.filter(item => item.level === 3)
        cityOptions.value = allRegions.filter(item => item.level === 4)
      } catch (error) {
        console.error('加载选项数据失败:', error)
      }
    }



    const handleAdd = () => {
      dialogTitle.value = '新增地域'
      dialogVisible.value = true
      resetForm()
    }

    const handleBatchAdd = () => {
      batchDialogVisible.value = true
      resetBatchForm()
      loadAllOptions()
    }

    // 处理地域变化
    const handleRegionChange = (value) => {
      batchForm.regionName = value
      // 清空国家、省份、城市选择
      batchForm.countryName = ''
      batchForm.provinceName = ''
      batchForm.cityName = ''
    }

    // 处理国家变化
    const handleCountryChange = (value) => {
      batchForm.countryName = value
      // 清空省份和城市选择
      batchForm.provinceName = ''
      batchForm.cityName = ''
    }

    // 处理省份变化
    const handleProvinceChange = (value) => {
      batchForm.provinceName = value
      // 清空城市选择
      batchForm.cityName = ''
    }

    // 处理城市变化
    const handleCityChange = (value) => {
      batchForm.cityName = value
    }

    // 计算属性：过滤国家选项
    const filteredCountryOptions = computed(() => {
      if (!batchForm.regionName) return []
      
      // 找到选中的地域
      const selectedRegion = regionOptions.value.find(item => item.name === batchForm.regionName)
      if (!selectedRegion) return countryOptions.value
      
      // 返回属于该地域的国家
      return countryOptions.value.filter(item => item.parentId === selectedRegion.id)
    })

    // 计算属性：过滤省份选项
    const filteredProvinceOptions = computed(() => {
      if (!batchForm.countryName) return []
      
      // 找到选中的国家
      const selectedCountry = countryOptions.value.find(item => item.name === batchForm.countryName)
      if (!selectedCountry) return provinceOptions.value
      
      // 返回属于该国家的省份
      return provinceOptions.value.filter(item => item.parentId === selectedCountry.id)
    })

    // 计算属性：过滤城市选项
    const filteredCityOptions = computed(() => {
      if (!batchForm.provinceName) return []
      
      // 找到选中的省份
      const selectedProvince = provinceOptions.value.find(item => item.name === batchForm.provinceName)
      if (!selectedProvince) return cityOptions.value
      
      // 返回属于该省份的城市
      return cityOptions.value.filter(item => item.parentId === selectedProvince.id)
    })

    const handleEdit = (row) => {
      dialogTitle.value = '编辑地域'
      Object.assign(form, row)
      dialogVisible.value = true
      loadParentOptions(form.level)
    }

    const handleDelete = async (row) => {
      try {
        await ElMessageBox.confirm('确定要删除这个地域吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        })
        
        await request({
          url: `/region/${row.id}`,
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
            url: `/region/${form.id}`,
            method: 'put',
            data: form,
          })
          ElMessage.success('更新成功')
        } else {
          await request({
            url: '/region',
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

    const handleBatchSubmit = async () => {
      try {
        await batchFormRef.value.validate()
        
        await request({
          url: '/region/batch',
          method: 'post',
          data: batchForm,
        })
        ElMessage.success('批量创建成功')
        batchDialogVisible.value = false
        loadData()
      } catch (error) {
        console.error('批量提交失败:', error)
        ElMessage.error('批量创建失败')
      }
    }

    const resetForm = () => {
      Object.assign(form, {
        id: null,
        name: '',
        level: 1,
        parentId: null,
        description: '',
        status: 1,
      })
      parentOptions.value = []
      if (formRef.value) {
        formRef.value.resetFields()
      }
    }

    const resetBatchForm = () => {
      Object.assign(batchForm, {
        regionName: '',
        countryName: '',
        provinceName: '',
        cityName: '',
        status: 1,
      })
      regionOptions.value = []
      countryOptions.value = []
      provinceOptions.value = []
      cityOptions.value = []
      if (batchFormRef.value) {
        batchFormRef.value.resetFields()
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
      batchDialogVisible,
      batchFormRef,
      batchForm,
      batchRules,
      regionOptions,
      countryOptions,
      provinceOptions,
      cityOptions,
      filteredCountryOptions,
      filteredProvinceOptions,
      filteredCityOptions,
      loadData,
      handleBatchAdd,
      handleEdit,
      handleDelete,
      handleSubmit,
      handleBatchSubmit,
      resetForm,
      resetBatchForm,
      handleSizeChange,
      handleCurrentChange,
      getLevelType,
      getLevelText,
      loadAllOptions,
      handleRegionChange,
      handleCountryChange,
      handleProvinceChange,
      handleCityChange,
    }
  },
}
</script>

<style scoped>
.region-page {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.page-description {
  margin: 0;
  color: #909399;
  font-size: 14px;
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
