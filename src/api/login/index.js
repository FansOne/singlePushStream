import http from '../http'

export function Login (params){
    return http.get('/live/loginByCode',params)
}
