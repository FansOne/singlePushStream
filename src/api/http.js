import axios from 'axios'
import { Message } from 'element-ui'
const BASE_URL = window.SITE_CONFIG['BASE_URL']


const http = axios.create({
  baseURL: BASE_URL,
  // baseURL: '/api',
  timeout: 30000                              
})

http.interceptors.request.use(config => {
  return config
}, error => {
  Promise.reject(error)
})

http.interceptors.response.use(
  response => {
    if (response.data.code != 0) {
      Message.error(response.data.msg);
      return Promise.reject(response)
    }
    return Promise.resolve(response.data.data)
  },
  error => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          console.log(401)
          break;
        case 403:
          console.log(403)
          break;
        case 404:
          console.log(404)
          break;
        case 500:
          console.log(500)
          break;
      }
    }
    Message.error('请求失败!');
    return Promise.reject(error.response)
  }
)

function get(url, params = {}) {
  return http({
    url,
    method: 'GET',
    headers: {},
    params
  })
}

function post(url, data = {}) {
  return http({
    url,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    },
    data
  })
}

function put(url, data = {}) {
  return http({
    url,
    method: 'PUT',
    headers: {},
    data
  })
}

function delete_(url, data = {}) {
  return http({
    url,
    method: 'DELETE',
    headers: {},
    data
  })
}
export default {
  get, post,put,delete_
}