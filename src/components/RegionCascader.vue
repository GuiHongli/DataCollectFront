<template>
  <el-cascader
    v-model="selectedValue"
    :options="regionOptions"
    :props="cascaderProps"
    :placeholder="placeholder"
    :clearable="clearable"
    :filterable="filterable"
    :show-all-levels="showAllLevels"
    @change="handleChange"
    style="width: 100%"
  />
</template>

<script>
import { ref, reactive, onMounted, watch } from 'vue'
import request from '@/utils/request'

export default {
  name: 'RegionCascader',
  props: {
    modelValue: {
      type: Array,
      default: () => []
    },
    placeholder: {
      type: String,
      default: '请选择省市区'
    },
    clearable: {
      type: Boolean,
      default: true
    },
    filterable: {
      type: Boolean,
      default: true
    },
    showAllLevels: {
      type: Boolean,
      default: true
    }
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { emit }) {
    const selectedValue = ref([])
    const regionOptions = ref([])

    const cascaderProps = reactive({
      value: 'id',
      label: 'name',
      children: 'children',
      checkStrictly: false,
      emitPath: true
    })

    // 监听外部值变化
    watch(() => props.modelValue, (newVal) => {
      selectedValue.value = newVal
    }, { immediate: true })

    // 监听内部值变化
    watch(selectedValue, (newVal) => {
      emit('update:modelValue', newVal)
    })

    // 加载省市区数据
    const loadRegionData = async () => {
      try {
        // 加载省份数据
        const provincesRes = await request({
          url: '/region/search',
          method: 'get',
          params: { level: 2 }
        })
        
        const provinces = provincesRes.data || []
        
        // 为每个省份加载城市数据
        const provincesWithCities = await Promise.all(
          provinces.map(async (province) => {
            const citiesRes = await request({
              url: '/region/search',
              method: 'get',
              params: { level: 3 }
            })
            
            const cities = citiesRes.data || []
            
            return {
              ...province,
              children: cities
            }
          })
        )
        
        regionOptions.value = provincesWithCities
      } catch (error) {
        console.error('加载省市区数据失败:', error)
        // 如果API调用失败，使用默认数据
        loadDefaultData()
      }
    }

    // 加载默认的省市区数据
    const loadDefaultData = () => {
      regionOptions.value = [
        {
          id: 1,
          name: '北京市',
          children: [
            { id: 11, name: '北京市' }
          ]
        },
        {
          id: 2,
          name: '上海市',
          children: [
            { id: 21, name: '上海市' }
          ]
        },
        {
          id: 3,
          name: '广东省',
          children: [
            { id: 31, name: '广州市' },
            { id: 32, name: '深圳市' },
            { id: 33, name: '珠海市' }
          ]
        },
        {
          id: 4,
          name: '江苏省',
          children: [
            { id: 41, name: '南京市' },
            { id: 42, name: '苏州市' },
            { id: 43, name: '无锡市' }
          ]
        },
        {
          id: 5,
          name: '浙江省',
          children: [
            { id: 51, name: '杭州市' },
            { id: 52, name: '宁波市' },
            { id: 53, name: '温州市' }
          ]
        }
      ]
    }

    const handleChange = (value) => {
      emit('change', value)
    }

    onMounted(() => {
      loadRegionData()
    })

    return {
      selectedValue,
      regionOptions,
      cascaderProps,
      handleChange
    }
  }
}
</script>

<style scoped>
.el-cascader {
  width: 100%;
}
</style>
