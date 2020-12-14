import http from '../http'

export function livingUpdate (params){
    return http.put('/live/livingUpdate',params)
}

export function sendCode (params){
    return http.get('/live/getCodeStatus',params)
}
