import http from '../http'

export function coursewareList (params){
    //获取课件列表
    return http.get('/tencent/whiteBoard/getCourseDataList',params)
}
export function queryTranscodeFile (params){
    //根据taskId查询当前课件转码文件
    return http.get('/tencent/whiteBoard/describeTranscode',params)
}

export function deleteCourseData (params){
    //删除课件
    return http.delete_('/tencent/whiteBoard/deleteCourseData',params)
}