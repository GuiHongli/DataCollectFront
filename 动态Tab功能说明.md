# 动态Tab功能说明

## 概述

采集任务管理页面现在支持动态Tab功能，用户点击任务名称时会动态创建新的详情Tab，而不是弹出对话框。

## 功能特性

### 1. 动态Tab管理

#### Tab类型
- **任务列表Tab**: 固定的列表页面，显示所有采集任务
- **任务详情Tab**: 动态创建的详情页面，显示选中任务的详细信息

#### Tab操作
- **创建Tab**: 点击任务名称时自动创建新的详情Tab
- **切换Tab**: 点击Tab标签切换不同的任务详情
- **关闭Tab**: 点击Tab上的关闭按钮关闭详情Tab
- **重复打开**: 如果任务已经打开，直接切换到对应的Tab

### 2. 数据管理

#### 已打开任务列表
```javascript
const openedTasks = ref([]) // 存储已打开的任务信息
```

#### Tab名称规则
- 列表Tab: `list`
- 详情Tab: `detail-{taskId}` (例如: `detail-46`)

### 3. 交互流程

#### 点击任务名称
1. 检查任务是否已经打开
2. 如果未打开，添加到已打开列表
3. 切换到对应的详情Tab
4. 加载任务进度和执行例次数据

#### 切换Tab
1. 列表Tab: 清空详情数据
2. 详情Tab: 加载对应任务的数据

#### 关闭Tab
1. 从已打开列表中移除任务
2. 如果关闭的是当前Tab，切换到列表Tab
3. 清空详情数据

### 4. 数据结构

#### 任务对象
```javascript
{
  id: 46,
  name: "任务名称",
  status: "COMPLETED",
  createTime: "2024-01-01 10:00:00",
  description: "任务描述"
}
```

#### Tab状态
```javascript
{
  activeTab: "detail-46", // 当前激活的Tab
  openedTasks: [          // 已打开的任务列表
    { id: 46, name: "任务1" },
    { id: 22, name: "任务2" }
  ]
}
```

### 5. 主要方法

#### handleViewDetail(row)
- 处理任务名称点击事件
- 创建或切换到详情Tab
- 加载任务数据

#### handleTabClick(tab)
- 处理Tab切换事件
- 根据Tab类型执行相应操作

#### handleTabRemove(targetName)
- 处理Tab关闭事件
- 清理相关数据

#### getCurrentTask()
- 获取当前Tab对应的任务对象
- 用于详情页面数据绑定

### 6. 用户体验

#### 优势
- ✅ **多任务对比**: 可以同时打开多个任务详情进行对比
- ✅ **快速切换**: 通过Tab快速切换不同任务
- ✅ **状态保持**: 每个Tab保持独立的数据状态
- ✅ **灵活关闭**: 可以单独关闭不需要的详情Tab

#### 操作流程
1. 在任务列表中点击任务名称
2. 系统自动创建新的详情Tab并切换
3. 可以继续点击其他任务名称打开更多Tab
4. 通过Tab标签切换不同任务的详情
5. 点击Tab上的关闭按钮关闭不需要的详情

### 7. 技术实现

#### 响应式数据
```javascript
const activeTab = ref('list')           // 当前激活的Tab
const openedTasks = ref([])             // 已打开的任务列表
const taskProgress = ref({})            // 任务进度数据
const executionInstances = ref([])      // 执行例次数据
```

#### 模板结构
```vue
<el-tabs v-model="activeTab" @tab-click="handleTabClick" @tab-remove="handleTabRemove">
  <el-tab-pane label="任务列表" name="list">
    <!-- 任务列表内容 -->
  </el-tab-pane>
  
  <el-tab-pane 
    v-for="task in openedTasks"
    :key="task.id"
    :label="`任务详情 - ${task.name}`" 
    :name="`detail-${task.id}`"
    closable
  >
    <!-- 任务详情内容 -->
  </el-tab-pane>
</el-tabs>
```

### 8. 样式设计

#### Tab样式
- 使用Element Plus的Tabs组件
- 详情Tab支持关闭功能
- 响应式设计适配不同屏幕尺寸

#### 内容布局
- 详情页面使用卡片布局
- 基本信息、执行进度、执行例次分区域显示
- 统一的视觉风格

## 总结

动态Tab功能提供了更好的用户体验，用户可以：
- 同时查看多个任务的详情
- 快速切换不同任务
- 灵活管理已打开的任务
- 保持每个任务的独立状态

这种设计模式符合现代Web应用的用户习惯，提高了工作效率。
