<template>
  <div class="collect-task-page">
    <div class="page-header">
      <h2 class="page-title">采集任务管理</h2>
      <p class="page-description">管理采集任务，支持任务的停止、删除等操作</p>
    </div>

    <!-- 主内容区域 -->
    <div class="main-content">
      <el-card>
        <!-- Tab切换 -->
        <el-tabs v-model="activeTab" @tab-click="handleTabClick" @tab-remove="handleTabRemove">
          <el-tab-pane label="任务列表" name="list">
            <div class="table-operations">
              <el-button type="primary" @click="handleAdd">
                <el-icon><Plus /></el-icon>
                新增任务
              </el-button>
              <el-button @click="refreshAllData" :loading="loading">
                <el-icon><Refresh /></el-icon>
                {{ getRefreshButtonText() }}
              </el-button>
            </div>

            <el-table :data="tableData" v-loading="loading" style="width: 100%">
        <el-table-column prop="id" label="任务ID" width="80" />
        <el-table-column prop="name" label="任务名称">
          <template #default="scope">
            <el-button 
              type="text" 
              @click="handleViewDetail(scope.row)"
              style="color: #409eff; text-decoration: none;"
            >
              {{ scope.row.name }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="执行进度" width="200">
          <template #default="scope">
            <div class="progress-display">
              <div class="progress-info">
                <span class="progress-text">{{ getTableProgressText(scope.row) }}</span>
                <span class="progress-percentage">{{ getTableProgressPercentage(scope.row) }}%</span>
              </div>
              <el-progress 
                :percentage="getTableProgressPercentage(scope.row)" 
                :status="getTableProgressStatus(scope.row)"
                :stroke-width="8"
                :show-text="false"
                :color="getProgressColor(scope.row)"
              />
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" />
        <el-table-column label="操作" width="150">
          <template #default="scope">
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
          </el-tab-pane>

          <!-- 动态任务详情Tab -->
          <el-tab-pane 
            v-for="task in openedTasks"
            :key="task.id"
            :label="`任务详情 - ${task.name}`" 
            :name="`detail-${task.id}`"
            closable
          >
            <div v-if="getCurrentTask()" class="task-detail">
              <!-- 基本信息 -->
              <el-card class="detail-card">
                <template #header>
                  <div class="card-header">
                    <span>基本信息</span>
                  </div>
                </template>
                <el-descriptions :column="2" border>
                  <el-descriptions-item label="任务ID">{{ getCurrentTask().id }}</el-descriptions-item>
                  <el-descriptions-item label="任务名称">{{ getCurrentTask().name }}</el-descriptions-item>
                  <el-descriptions-item label="任务状态">
                    <el-tag :type="getStatusType(getCurrentTask().status)">
                      {{ getStatusText(getCurrentTask().status) }}
                    </el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="创建时间">{{ getCurrentTask().createTime }}</el-descriptions-item>
                  <el-descriptions-item label="任务描述">{{ getCurrentTask().description || '无' }}</el-descriptions-item>
                </el-descriptions>
              </el-card>

              <!-- 执行进度 -->
              <el-card class="detail-card">
                <template #header>
                  <div class="card-header">
                    <span>执行进度</span>
                    <el-button size="small" @click="refreshTaskProgress">刷新</el-button>
                  </div>
                </template>
                <div class="progress-section">
                  <div class="progress-overview">
                    <el-row :gutter="20">
                      <el-col :span="4">
                        <div class="progress-item">
                          <div class="progress-number">{{ getCalculatedProgress().totalCount }}</div>
                          <div class="progress-label">总用例数</div>
                        </div>
                      </el-col>
                      <el-col :span="4">
                        <div class="progress-item">
                          <div class="progress-number success">{{ getCalculatedProgress().successCount }}</div>
                          <div class="progress-label">成功用例数</div>
                        </div>
                      </el-col>
                      <el-col :span="4">
                        <div class="progress-item">
                          <div class="progress-number warning">{{ getCalculatedProgress().failedCount }}</div>
                          <div class="progress-label">失败用例数</div>
                        </div>
                      </el-col>
                      <el-col :span="4">
                        <div class="progress-item">
                          <div class="progress-number info">{{ getCalculatedProgress().runningCount }}</div>
                          <div class="progress-label">执行中用例数</div>
                        </div>
                      </el-col>
                      <el-col :span="4">
                        <div class="progress-item">
                          <div class="progress-number danger">{{ getCalculatedProgress().blockedCount }}</div>
                          <div class="progress-label">阻塞用例数</div>
                        </div>
                      </el-col>
                      <el-col :span="4">
                        <div class="progress-item">
                          <div class="progress-number">{{ getCalculatedProgress().pendingCount }}</div>
                          <div class="progress-label">待执行用例数</div>
                        </div>
                      </el-col>
                    </el-row>
                  </div>
                  
                  <div class="progress-bar-section">
                    <div class="progress-bar-label">
                      执行进度: {{ getProgressPercentage() }}%
                    </div>
                    <el-progress 
                      :percentage="getProgressPercentage()" 
                      :status="getProgressStatus()"
                      :stroke-width="20"
                    />
                  </div>
                </div>
              </el-card>

              <!-- 用例例次执行信息 -->
              <el-card class="detail-card">
                <template #header>
                  <div class="card-header">
                    <span>用例例次执行信息</span>
                    <el-button size="small" @click="refreshExecutionInstances">刷新</el-button>
                  </div>
                </template>
                <div class="instances-section">
                  <el-table :data="executionInstances" v-loading="instancesLoading" style="width: 100%">
                    <el-table-column prop="testCaseId" label="用例ID" width="100" />
                    <el-table-column prop="testCaseNumber" label="用例编号" width="120" />
                    <el-table-column prop="testCaseName" label="用例名称" />
                    <el-table-column prop="round" label="轮次" width="80" />
                    <el-table-column prop="logicEnvironmentName" label="逻辑环境" width="150" />
                    <el-table-column prop="executorIp" label="执行机IP" width="120" />
                    <el-table-column prop="status" label="执行状态" width="100">
                      <template #default="scope">
                        <el-tag :type="getInstanceStatusType(scope.row.status)">
                          {{ getInstanceStatusText(scope.row.status) }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column prop="result" label="执行结果" width="100">
                      <template #default="scope">
                        <el-tag v-if="scope.row.result" :type="getInstanceResultType(scope.row.result)">
                          {{ getInstanceResultText(scope.row.result) }}
                        </el-tag>
                        <span v-else>-</span>
                      </template>
                    </el-table-column>
                    <el-table-column prop="failureReason" label="失败原因" width="200">
                      <template #default="scope">
                        <div v-if="scope.row.failureReason">
                          <el-tooltip :content="scope.row.failureReason" placement="top" :show-after="500">
                            <span class="failure-reason-text">{{ scope.row.failureReason }}</span>
                          </el-tooltip>
                        </div>
                        <span v-else>-</span>
                      </template>
                    </el-table-column>
                    <el-table-column prop="logFilePath" label="日志文件" width="200">
                      <template #default="scope">
                        <div v-if="scope.row.logFilePath">
                          <el-tooltip :content="scope.row.logFilePath" placement="top" :show-after="500">
                            <el-link 
                              v-if="scope.row.logFilePath.startsWith('http')" 
                              type="primary" 
                              :href="scope.row.logFilePath" 
                              target="_blank"
                              :underline="false"
                            >
                              查看日志
                            </el-link>
                            <span v-else class="log-file-path">{{ scope.row.logFilePath }}</span>
                          </el-tooltip>
                        </div>
                        <span v-else>-</span>
                      </template>
                    </el-table-column>
                    <el-table-column prop="executionTaskId" label="执行任务ID" width="200" />
                    <el-table-column prop="createTime" label="创建时间" width="160" />
                    <el-table-column prop="updateTime" label="更新时间" width="160" />
                  </el-table>
                </div>
              </el-card>
            </div>
            <div v-else class="no-task-selected">
              <el-empty description="请先选择一个任务查看详情" />
            </div>
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </div>

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


      <div v-if="selectedTask" class="task-detail">
        <!-- 基本信息 -->
        <el-card class="detail-card">
          <template #header>
            <div class="card-header">
              <span>基本信息</span>
            </div>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="任务ID">{{ selectedTask.id }}</el-descriptions-item>
            <el-descriptions-item label="任务名称">{{ selectedTask.name }}</el-descriptions-item>
            <el-descriptions-item label="任务状态">
              <el-tag :type="getStatusType(selectedTask.status)">
                {{ getStatusText(selectedTask.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ selectedTask.createTime }}</el-descriptions-item>
            <el-descriptions-item label="任务描述">{{ selectedTask.description || '无' }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 执行进度 -->
        <el-card class="detail-card">
          <template #header>
            <div class="card-header">
              <span>执行进度</span>
              <el-button size="small" @click="refreshTaskProgress">刷新</el-button>
            </div>
          </template>
          <div class="progress-section">
            <div class="progress-overview">
              <el-row :gutter="20">
                <el-col :span="6">
                  <div class="progress-item">
                    <div class="progress-number">{{ taskProgress.totalCount || 0 }}</div>
                    <div class="progress-label">总用例数</div>
                  </div>
                </el-col>
                <el-col :span="6">
                  <div class="progress-item">
                    <div class="progress-number success">{{ taskProgress.successCount || 0 }}</div>
                    <div class="progress-label">成功用例数</div>
                  </div>
                </el-col>
                <el-col :span="6">
                  <div class="progress-item">
                    <div class="progress-number warning">{{ taskProgress.failedCount || 0 }}</div>
                    <div class="progress-label">失败用例数</div>
                  </div>
                </el-col>
                <el-col :span="6">
                  <div class="progress-item">
                    <div class="progress-number info">{{ taskProgress.runningCount || 0 }}</div>
                    <div class="progress-label">执行中用例数</div>
                  </div>
                </el-col>
              </el-row>
            </div>
            
            <div class="progress-bar-section">
              <div class="progress-bar-label">
                执行进度: {{ getProgressPercentage() }}%
              </div>
              <el-progress 
                :percentage="getProgressPercentage()" 
                :status="getProgressStatus()"
                :stroke-width="20"
              />
            </div>
          </div>
        </el-card>

        <!-- 执行结果统计 -->
        <el-card class="detail-card">
          <template #header>
            <div class="card-header">
              <span>执行结果统计</span>
            </div>
          </template>
          <div class="statistics-section">
            <el-row :gutter="20">
              <el-col :span="8">
                <div class="stat-card success">
                  <div class="stat-icon">✓</div>
                  <div class="stat-content">
                    <div class="stat-number">{{ taskProgress.successCount || 0 }}</div>
                    <div class="stat-label">成功执行</div>
                  </div>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="stat-card danger">
                  <div class="stat-icon">✗</div>
                  <div class="stat-content">
                    <div class="stat-number">{{ taskProgress.failedCount || 0 }}</div>
                    <div class="stat-label">执行失败</div>
                  </div>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="stat-card info">
                  <div class="stat-icon">⏳</div>
                  <div class="stat-content">
                    <div class="stat-number">{{ taskProgress.runningCount || 0 }}</div>
                    <div class="stat-label">执行中</div>
                  </div>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-card>

        <!-- 用例例次执行信息 -->
        <el-card class="detail-card">
          <template #header>
            <div class="card-header">
              <span>用例例次执行信息</span>
              <el-button size="small" @click="refreshExecutionInstances">刷新</el-button>
            </div>
          </template>
          <div class="instances-section">
            <el-table :data="executionInstances" v-loading="instancesLoading" style="width: 100%">
              <el-table-column prop="testCaseId" label="用例ID" width="100" />
              <el-table-column prop="testCaseNumber" label="用例编号" width="120" />
              <el-table-column prop="testCaseName" label="用例名称" />
              <el-table-column prop="round" label="轮次" width="80" />
              <el-table-column prop="logicEnvironmentName" label="逻辑环境" width="150" />
              <el-table-column prop="executorIp" label="执行机IP" width="120" />
              <el-table-column prop="status" label="执行状态" width="100">
                <template #default="scope">
                  <el-tag :type="getInstanceStatusType(scope.row.status)">
                    {{ getInstanceStatusText(scope.row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="result" label="执行结果" width="100">
                <template #default="scope">
                  <el-tag v-if="scope.row.result" :type="getInstanceResultType(scope.row.result)">
                    {{ getInstanceResultText(scope.row.result) }}
                  </el-tag>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column prop="failureReason" label="失败原因" width="200">
                <template #default="scope">
                  <div v-if="scope.row.failureReason">
                    <el-tooltip :content="scope.row.failureReason" placement="top" :show-after="500">
                      <span class="failure-reason-text">{{ scope.row.failureReason }}</span>
                    </el-tooltip>
                  </div>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column prop="executionTaskId" label="执行任务ID" width="200" />
              <el-table-column prop="createTime" label="创建时间" width="160" />
              <el-table-column prop="updateTime" label="更新时间" width="160" />
              <el-table-column label="操作" width="120">
                <template #default="scope">
                  <el-button 
                    v-if="scope.row.executionTaskId" 
                    type="text" 
                    size="small"
                    @click="viewInstanceResult(scope.row)"
                  >
                    查看详情
                  </el-button>
                  <span v-else>-</span>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>
      </div>
    </div>
</template>

<script>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
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
    
    // Tab相关
    const activeTab = ref('list')
    const openedTasks = ref([]) // 已打开的任务列表
    
    // 任务详情相关
    const taskProgress = ref({})
    const executionInstances = ref([])
    const instancesLoading = ref(false)
    
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
        'STOPPED': '已停止',
        'PAUSED': '已暂停',
        'FAILED': '已停止', // 兼容旧数据，将FAILED状态显示为已停止
      }
      return textMap[status] || '未知'
    }

    // 表格进度相关方法
    const getTableProgressText = (row) => {
      const total = row.totalCount || 0
      const completed = row.completedCount || 0
      const success = row.successCount || 0
      const failed = row.failedCount || 0
      const blocked = row.blockedCount || 0
      const running = row.runningCount || 0
      
      if (total === 0) {
        return '暂无数据'
      }
      
      const parts = []
      if (success > 0) parts.push(`${success}成功`)
      if (failed > 0) parts.push(`${failed}失败`)
      if (blocked > 0) parts.push(`${blocked}阻塞`)
      if (running > 0) parts.push(`${running}执行中`)
      
      return `${completed}/${total} (${parts.join(', ')})`
    }

    const getTableProgressPercentage = (row) => {
      const total = row.totalCount || 0
      const completed = row.completedCount || 0
      
      if (total === 0) {
        return 0
      }
      
      return Math.round((completed / total) * 100)
    }

    const getTableProgressStatus = (row) => {
      const percentage = getTableProgressPercentage(row)
      
      if (percentage === 100) {
        return 'success'
      }
      
      if (row.status === 'RUNNING') {
        return 'warning'
      }
      
      return ''
    }

    const getProgressColor = (row) => {
      const percentage = getTableProgressPercentage(row)
      
      if (percentage === 100) {
        return '#67c23a'
      }
      
      if (row.status === 'RUNNING') {
        return '#e6a23c'
      }
      
      return '#409eff'
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
        
        // 为每个任务加载真实的执行状态数据
        await loadTaskExecutionStatus()
      } catch (error) {
        console.error('加载数据失败:', error)
      } finally {
        loading.value = false
      }
    }

    // 加载任务执行状态数据（只加载未完成的任务）
    const loadTaskExecutionStatus = async () => {
      try {
        // 只加载未完成任务的执行状态
        const unfinishedTasks = tableData.value.filter(task => 
          task.status === 'PENDING' || 
          task.status === 'RUNNING' || 
          task.status === 'PAUSED'
        )
        
        if (unfinishedTasks.length === 0) {
          return
        }
        
        const promises = unfinishedTasks.map(async (task) => {
          try {
            const res = await request({
              url: `/collect-task/${task.id}/execution-instances`,
              method: 'get',
            })
            
            const instances = res.data || []
            const totalCount = instances.length
            const successCount = instances.filter(instance => instance.result === 'SUCCESS').length
            const failedCount = instances.filter(instance => instance.result === 'FAILED').length
            const blockedCount = instances.filter(instance => instance.result === 'BLOCKED').length
            const runningCount = instances.filter(instance => instance.status === 'RUNNING').length
            // 只要不是执行中，都算作已完成
            const completedCount = instances.filter(instance => instance.status !== 'RUNNING').length
            
            // 更新任务数据
            task.totalCount = totalCount
            task.successCount = successCount
            task.failedCount = failedCount
            task.runningCount = runningCount
            task.completedCount = completedCount
            
            // 检查任务状态是否需要更新
            if (completedCount === totalCount && totalCount > 0) {
              // 所有用例都已完成，更新任务状态
              if (successCount === totalCount) {
                task.status = 'COMPLETED'
              } else {
                task.status = 'FAILED'
              }
            } else if (runningCount > 0) {
              task.status = 'RUNNING'
            } else if (completedCount === 0 && totalCount > 0) {
              task.status = 'PENDING'
            }
            
          } catch (error) {
            console.error(`加载任务 ${task.id} 执行状态失败:`, error)
            // 如果获取失败，使用默认值
            task.totalCount = 0
            task.successCount = 0
            task.failedCount = 0
            task.runningCount = 0
            task.completedCount = 0
          }
        })
        
        await Promise.all(promises)
      } catch (error) {
        console.error('加载任务执行状态失败:', error)
      }
    }

    // 刷新未完成的任务数据
    const refreshAllData = async () => {
      loading.value = true
      try {
        // 只刷新未完成的任务
        const unfinishedTasks = tableData.value.filter(task => 
          task.status === 'PENDING' || 
          task.status === 'RUNNING' || 
          task.status === 'PAUSED'
        )
        
        if (unfinishedTasks.length === 0) {
          // 如果没有未完成的任务，只刷新任务列表
          await loadData()
          ElMessage.success('数据刷新成功')
          return
        }
        
        // 只刷新未完成任务的执行状态
        await Promise.all(unfinishedTasks.map(async (task) => {
          try {
            const res = await request({
              url: `/collect-task/${task.id}/execution-instances`,
              method: 'get',
            })
            
            const instances = res.data || []
            const totalCount = instances.length
            const successCount = instances.filter(instance => instance.result === 'SUCCESS').length
            const failedCount = instances.filter(instance => instance.result === 'FAILED').length
            const blockedCount = instances.filter(instance => instance.result === 'BLOCKED').length
            const runningCount = instances.filter(instance => instance.status === 'RUNNING').length
            const completedCount = instances.filter(instance => instance.status !== 'RUNNING').length
            
            // 更新任务数据
            task.totalCount = totalCount
            task.successCount = successCount
            task.failedCount = failedCount
            task.runningCount = runningCount
            task.completedCount = completedCount
            
            // 检查任务状态是否需要更新
            if (completedCount === totalCount && totalCount > 0) {
              // 所有用例都已完成，更新任务状态
              if (successCount === totalCount) {
                task.status = 'COMPLETED'
              } else {
                task.status = 'FAILED'
              }
            } else if (runningCount > 0) {
              task.status = 'RUNNING'
            } else if (completedCount === 0 && totalCount > 0) {
              task.status = 'PENDING'
            }
            
          } catch (error) {
            console.error(`刷新任务 ${task.id} 执行状态失败:`, error)
          }
        }))
        
        ElMessage.success(`已刷新 ${unfinishedTasks.length} 个未完成任务的状态`)
      } catch (error) {
        console.error('刷新数据失败:', error)
        ElMessage.error('刷新数据失败')
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

    // 任务详情相关方法
    const handleViewDetail = async (row) => {
      // 检查任务是否已经打开
      const existingTask = openedTasks.value.find(task => task.id === row.id)
      if (!existingTask) {
        // 添加新任务到已打开列表
        openedTasks.value.push(row)
      }
      
      // 切换到对应的详情tab
      const tabName = `detail-${row.id}`
      activeTab.value = tabName
      
      // 加载任务数据
      await loadTaskProgress(row.id)
      await loadExecutionInstances(row.id)
    }

    const handleTabClick = (tab) => {
      if (tab.props.name === 'list') {
        // 切换到列表tab时，清空数据
        taskProgress.value = {}
        executionInstances.value = []
      } else if (tab.props.name.startsWith('detail-')) {
        // 切换到详情tab时，加载对应任务的数据
        const taskId = parseInt(tab.props.name.replace('detail-', ''))
        loadTaskProgress(taskId)
        loadExecutionInstances(taskId)
      }
    }

    const handleTabRemove = (targetName) => {
      // 从已打开列表中移除任务
      const taskId = parseInt(targetName.replace('detail-', ''))
      const index = openedTasks.value.findIndex(task => task.id === taskId)
      if (index > -1) {
        openedTasks.value.splice(index, 1)
      }
      
      // 如果关闭的是当前激活的tab，切换到列表tab
      if (activeTab.value === targetName) {
        activeTab.value = 'list'
        taskProgress.value = {}
        executionInstances.value = []
      }
    }

    // 获取当前tab对应的任务
    const getCurrentTask = () => {
      if (activeTab.value.startsWith('detail-')) {
        const taskId = parseInt(activeTab.value.replace('detail-', ''))
        return openedTasks.value.find(task => task.id === taskId)
      }
      return null
    }

    const loadTaskProgress = async (taskId) => {
      try {
        const res = await request({
          url: `/collect-task/${taskId}/progress`,
          method: 'get',
        })
        taskProgress.value = res.data
      } catch (error) {
        console.error('加载任务进度失败:', error)
        taskProgress.value = {}
      }
    }

    const loadExecutionInstances = async (taskId) => {
      instancesLoading.value = true
      try {
        const res = await request({
          url: `/collect-task/${taskId}/execution-instances`,
          method: 'get',
        })
        executionInstances.value = res.data
      } catch (error) {
        console.error('加载执行例次失败:', error)
        executionInstances.value = []
      } finally {
        instancesLoading.value = false
      }
    }

    const refreshTaskProgress = async () => {
      const currentTask = getCurrentTask()
      if (currentTask) {
        // 重新加载执行例次数据来更新进度计算
        await loadExecutionInstances(currentTask.id)
      }
    }

    const refreshExecutionInstances = async () => {
      const currentTask = getCurrentTask()
      if (currentTask) {
        await loadExecutionInstances(currentTask.id)
      }
    }

    // 基于执行例次数据重新计算进度
    const getProgressPercentage = () => {
      const instances = executionInstances.value || []
      if (instances.length === 0) {
        return 0
      }
      
      const total = instances.length
      const completed = instances.filter(instance => instance.status === 'COMPLETED').length
      return total > 0 ? Math.round((completed / total) * 100) : 0
    }

    const getProgressStatus = () => {
      const percentage = getProgressPercentage()
      if (percentage === 100) {
        return 'success'
      }
      return ''
    }

    // 计算属性：实时重新计算任务进度统计
    const calculatedProgress = computed(() => {
      const instances = executionInstances.value || []
      if (instances.length === 0) {
        return {
          totalCount: 0,
          completedCount: 0,
          successCount: 0,
          failedCount: 0,
          blockedCount: 0,
          runningCount: 0,
          pendingCount: 0
        }
      }
      
      const totalCount = instances.length
      const completedCount = instances.filter(instance => instance.status === 'COMPLETED').length
      const successCount = instances.filter(instance => instance.result === 'SUCCESS').length
      
      // 将所有非SUCCESS的完成状态归类
      const failedCount = instances.filter(instance => 
        instance.status === 'COMPLETED' && 
        instance.result && 
        instance.result !== 'SUCCESS' && 
        !['BLOCKED', 'TIMEOUT', 'PARTIAL_FAILURE'].includes(instance.result)
      ).length
      
      // 将BLOCKED、TIMEOUT、PARTIAL_FAILURE等状态归类为阻塞
      const blockedCount = instances.filter(instance => 
        instance.status === 'COMPLETED' && 
        instance.result && 
        ['BLOCKED', 'TIMEOUT', 'PARTIAL_FAILURE'].includes(instance.result)
      ).length
      
      const runningCount = instances.filter(instance => instance.status === 'RUNNING').length
      const pendingCount = instances.filter(instance => instance.status === 'PENDING').length
      
      return {
        totalCount,
        completedCount,
        successCount,
        failedCount,
        blockedCount,
        runningCount,
        pendingCount
      }
    })

    // 重新计算任务进度统计（保持向后兼容）
    const getCalculatedProgress = () => {
      return calculatedProgress.value
    }

    // 计算属性：基于执行例次重新计算任务状态
    const calculatedTaskStatus = computed(() => {
      const progress = calculatedProgress.value
      
      if (progress.totalCount === 0) {
        return 'PENDING'
      }
      
      if (progress.runningCount > 0) {
        return 'RUNNING'
      }
      
      if (progress.completedCount === progress.totalCount) {
        // 所有用例都已完成
        if (progress.failedCount > 0 || progress.blockedCount > 0) {
          return 'FAILED'
        } else {
          return 'COMPLETED'
        }
      }
      
      if (progress.pendingCount === progress.totalCount) {
        return 'PENDING'
      }
      
      return 'RUNNING'
    })

    const getInstanceStatusType = (status) => {
      const typeMap = {
        'PENDING': 'info',
        'RUNNING': 'warning',
        'COMPLETED': 'success',
        'FAILED': 'danger',
        'STOPPED': 'info',
        'BLOCKED': 'warning',
      }
      return typeMap[status] || 'info'
    }

    const getInstanceStatusText = (status) => {
      const textMap = {
        'PENDING': '待执行',
        'RUNNING': '执行中',
        'COMPLETED': '已完成',
        'FAILED': '执行失败',
        'STOPPED': '已停止',
        'BLOCKED': '阻塞',
      }
      return textMap[status] || '阻塞'
    }

    const getInstanceResultType = (result) => {
      const typeMap = {
        'SUCCESS': 'success',
        'FAILED': 'danger',
        'BLOCKED': 'warning',
      }
      return typeMap[result] || 'info'
    }

    const getInstanceResultText = (result) => {
      const textMap = {
        'SUCCESS': '成功',
        'FAILED': '失败',
        'BLOCKED': '阻塞',
      }
      return textMap[result] || '阻塞'
    }

    const viewInstanceResult = (instance) => {
      // 这里可以打开一个新的对话框显示执行结果详情
      ElMessage.info(`查看用例 ${instance.testCaseNumber} 第 ${instance.round} 轮执行详情，执行任务ID: ${instance.executionTaskId}`)
    }

    // 获取刷新按钮文本
    const getRefreshButtonText = () => {
      const unfinishedTasks = tableData.value.filter(task => 
        task.status === 'PENDING' || 
        task.status === 'RUNNING' || 
        task.status === 'PAUSED'
      )
      
      if (unfinishedTasks.length === 0) {
        return '刷新'
      } else if (unfinishedTasks.length === 1) {
        return `刷新 (${unfinishedTasks.length}个未完成任务)`
      } else {
        return `刷新 (${unfinishedTasks.length}个未完成任务)`
      }
    }

    // 自动刷新定时器
    let autoRefreshTimer = null

    // 启动自动刷新
    const startAutoRefresh = () => {
      if (autoRefreshTimer) {
        clearInterval(autoRefreshTimer)
      }
      
      // 每30秒自动刷新一次未完成任务的执行状态
      autoRefreshTimer = setInterval(async () => {
        const unfinishedTasks = tableData.value.filter(task => 
          task.status === 'PENDING' || 
          task.status === 'RUNNING' || 
          task.status === 'PAUSED'
        )
        
        if (unfinishedTasks.length > 0) {
          // 只刷新未完成任务的执行状态
          await Promise.all(unfinishedTasks.map(async (task) => {
            try {
              const res = await request({
                url: `/collect-task/${task.id}/execution-instances`,
                method: 'get',
              })
              
              const instances = res.data || []
              const totalCount = instances.length
              const successCount = instances.filter(instance => instance.result === 'SUCCESS').length
              const failedCount = instances.filter(instance => instance.result === 'FAILED').length
              const blockedCount = instances.filter(instance => instance.result === 'BLOCKED').length
              const runningCount = instances.filter(instance => instance.status === 'RUNNING').length
              const completedCount = instances.filter(instance => instance.status !== 'RUNNING').length
              
              // 更新任务数据
              task.totalCount = totalCount
              task.successCount = successCount
              task.failedCount = failedCount
              task.runningCount = runningCount
              task.completedCount = completedCount
              
              // 检查任务状态是否需要更新
              if (completedCount === totalCount && totalCount > 0) {
                // 所有用例都已完成，更新任务状态
                if (successCount === totalCount) {
                  task.status = 'COMPLETED'
                } else {
                  task.status = 'FAILED'
                }
              } else if (runningCount > 0) {
                task.status = 'RUNNING'
              } else if (completedCount === 0 && totalCount > 0) {
                task.status = 'PENDING'
              }
              
            } catch (error) {
              console.error(`自动刷新任务 ${task.id} 执行状态失败:`, error)
            }
          }))
        }
      }, 30000)
    }

    // 停止自动刷新
    const stopAutoRefresh = () => {
      if (autoRefreshTimer) {
        clearInterval(autoRefreshTimer)
        autoRefreshTimer = null
      }
    }

    onMounted(() => {
      loadData()
      loadStrategyOptions()
      startAutoRefresh()
    })

    // 组件卸载时清理定时器
    onUnmounted(() => {
      stopAutoRefresh()
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
      getTableProgressText,
      getTableProgressPercentage,
      getTableProgressStatus,
      getProgressColor,
      loadData,
      loadStrategyOptions,
      loadRegionOptions,
      loadCountryOptions,
      loadProvinceOptions,
      loadCityOptions,
      handleAdd,
      handleStop,
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
      refreshAllData,
      
      // Tab相关
      activeTab,
      openedTasks,
      
      // 任务详情相关
      taskProgress,
      executionInstances,
      instancesLoading,
      calculatedProgress,
      calculatedTaskStatus,
      handleViewDetail,
      handleTabClick,
      handleTabRemove,
      getCurrentTask,
      getCalculatedProgress,
      refreshTaskProgress,
      refreshExecutionInstances,
      getProgressPercentage,
      getProgressStatus,
      getInstanceStatusType,
      getInstanceStatusText,
      getInstanceResultType,
      getInstanceResultText,
      viewInstanceResult,
      getRefreshButtonText,
    }
  },
}
</script>

<style scoped>
.collect-task-page {
  padding: 20px;
}

/* 主内容区域布局 */
.main-content {
  width: 100%;
}

/* Tab样式 */
.el-tabs {
  height: 100%;
}

.el-tab-pane {
  padding: 20px 0;
}

/* 详情卡片样式 */
.task-detail .detail-card {
  margin-bottom: 20px;
}

.task-detail .detail-card:last-child {
  margin-bottom: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header span {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

/* 无任务选择时的样式 */
.no-task-selected {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
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

/* 任务详情样式 */
.task-detail {
  max-height: 70vh;
  overflow-y: auto;
}

.detail-card {
  margin-bottom: 20px;
}

.detail-card:last-child {
  margin-bottom: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header span {
  font-weight: 600;
  color: #303133;
}

/* 进度部分样式 */
.progress-section {
  padding: 20px 0;
}

.progress-overview {
  margin-bottom: 30px;
}

.progress-item {
  text-align: center;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.progress-number {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
}

.progress-number.success {
  color: #67c23a;
}

.progress-number.warning {
  color: #e6a23c;
}

.progress-number.info {
  color: #409eff;
}

.progress-label {
  font-size: 14px;
  color: #606266;
}

.progress-bar-section {
  margin-top: 20px;
}

.progress-bar-label {
  margin-bottom: 10px;
  font-weight: 500;
  color: #303133;
}

/* 统计卡片样式 */
.statistics-section {
  padding: 20px 0;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  background-color: #f5f7fa;
}

.stat-card.success {
  border-color: #67c23a;
  background-color: #f0f9ff;
}

.stat-card.danger {
  border-color: #f56c6c;
  background-color: #fef0f0;
}

.stat-card.info {
  border-color: #409eff;
  background-color: #f0f9ff;
}

.stat-icon {
  font-size: 24px;
  margin-right: 16px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: #fff;
}

.stat-card.success .stat-icon {
  color: #67c23a;
}

.stat-card.danger .stat-icon {
  color: #f56c6c;
}

.stat-card.info .stat-icon {
  color: #409eff;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

/* 执行例次表格样式 */
.instances-section {
  padding: 20px 0;
}

.instances-section .el-table {
  margin-top: 10px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .progress-overview .el-col {
    margin-bottom: 16px;
  }
  
  .statistics-section .el-col {
    margin-bottom: 16px;
  }
  
  .progress-item,
  .stat-card {
    padding: 16px;
  }
  
  .progress-number {
    font-size: 24px;
  }
  
  .stat-number {
    font-size: 20px;
  }
}

/* 表格进度显示样式 */
.progress-display {
  width: 100%;
  padding: 4px 0;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.progress-text {
  font-size: 12px;
  color: #606266;
  flex: 1;
  line-height: 1.2;
}

.progress-percentage {
  font-size: 12px;
  color: #409eff;
  font-weight: 600;
  margin-left: 8px;
  min-width: 40px;
  text-align: right;
}

/* 进度条容器样式 */
.progress-display .el-progress {
  margin-top: 2px;
}

.progress-display .el-progress__text {
  font-size: 11px;
}

/* 失败原因文本样式 */
.failure-reason-text {
  color: #f56c6c;
  font-size: 12px;
  cursor: pointer;
  display: inline-block;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 日志文件路径样式 */
.log-file-path {
  color: #606266;
  font-size: 12px;
  cursor: pointer;
  display: inline-block;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: 'Courier New', monospace;
}

</style>
