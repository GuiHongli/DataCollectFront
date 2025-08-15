import request from '@/utils/request'

// 地域管理API
export function getRegionList(params) {
  return request({
    url: '/region/list',
    method: 'get',
    params
  })
}

export function getRegionPage(params) {
  return request({
    url: '/region/page',
    method: 'get',
    params
  })
}

export function getRegionById(id) {
  return request({
    url: `/region/${id}`,
    method: 'get'
  })
}

export function createRegion(data) {
  return request({
    url: '/region',
    method: 'post',
    data
  })
}

export function updateRegion(id, data) {
  return request({
    url: `/region/${id}`,
    method: 'put',
    data
  })
}

export function deleteRegion(id) {
  return request({
    url: `/region/${id}`,
    method: 'delete'
  })
}

export function getRegionsByLevel(level) {
  return request({
    url: `/region/level/${level}`,
    method: 'get'
  })
}

export function getRegionsByParentId(parentId) {
  return request({
    url: `/region/parent/${parentId}`,
    method: 'get'
  })
}

export function getRegionTree() {
  return request({
    url: '/region/tree',
    method: 'get'
  })
}
