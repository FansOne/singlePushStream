import http from '../http'

export function cosKey (){
    // 腾讯云存储获取签名
    return http.get('/tencent/getCredential',{ path:'live/upload/' })
}
export function createTranscode (params){
    // 转码
    return http.post('/tencent/whiteBoard/createTranscode',params)
}
