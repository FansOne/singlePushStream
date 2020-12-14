import COS from 'cos-js-sdk-v5'
import SparkMD5 from 'spark-md5'
import {
    cosKey
} from '../../api/upload/index';
// import { Message } from 'element-ui';

var key = ''
// 配置
const cosConfig = {
  Bucket: 'xfky-1255765740',
  Region: 'ap-beijing',
  Domain: process.env.Domain
}

// 初始化实例
var cos = new COS({
  getAuthorization: function(options, callback) {
    const promise = cosKey()
    promise.then(res=>{

        const auth = {
            TmpSecretId: res.credentials.tmpSecretId,
            TmpSecretKey: res.credentials.tmpSecretKey,
            XCosSecurityToken: res.credentials.sessionToken,
            StartTime: res.startTime,
            ExpiredTime: res.expiredTime // 在ExpiredTime时间前，不会再次调用getAuthorization
        }
        callback(auth)
    })
  }
})

// 获取cos存储的图片地址，替换为域名地址
function getObjectUrl() {
  const url = cos.getObjectUrl({
    Bucket: cosConfig.Bucket,
    Region: cosConfig.Region,
    Key: key,
    Sign: false
  }, function(err, data) {
    // console.log(err || data)
  })
  // 腾讯云的地址替换为域名地址
  const p = `${cosConfig.Bucket}.cos.${cosConfig.Region}.myqcloud.com`
  return url.replace(p, cosConfig.Domain)
}

// 获得文件md5
function getFileMD5(file, callback) {
  // 声明必要的变量
  const fileReader = new FileReader()
  // 文件每块分割2M，计算分割详情
  const chunkSize = 2 * 1024 * 1024;
  const chunks = Math.ceil(file.size / chunkSize)
  let currentChunk = 0

  // 创建md5对象（基于SparkMD5）
  const spark = new SparkMD5()

  // 每块文件读取完毕之后的处理
  fileReader.onload = function(e) {
    // 每块交由sparkMD5进行计算
    spark.appendBinary(e.target.result)
    currentChunk++

    // 如果文件处理完成计算MD5，如果还有分片继续处理
    if (currentChunk < chunks) {
      loadNext()
    } else {
      callback(spark.end())
    }
  }

  // 处理单片文件的上传
  function loadNext() {
    const start = currentChunk * chunkSize
    const end = start + chunkSize >= file.size ? file.size : start + chunkSize

    fileReader.readAsBinaryString(file.slice(start, end))
  }

  loadNext()
}

// 大文件分片上传-通过sliceUploadFile上传
export function uploadMaxFile(file, callback, progressBc) {
  // 得到md5码
  getFileMD5(file, md5 => {
    // 存储文件的md5码
    file.md5 = md5
    const subfix = file.name.substr(file.name.lastIndexOf('.'))
    key = file.md5 + subfix;
    cos.sliceUploadFile({
      Bucket: cosConfig.Bucket,
      Region: cosConfig.Region,
      Key: key,
      Body: file,
      onProgress: function(progressData) {
        progressBc(progressData.percent)
      }
    }, function(err, data) {
      if (err) {
        callback(err)
      } else {
        data.fid = getObjectUrl()
        callback(null, data)
      }
    })
  })
}

// 小文件直接上传-通过putObject上传
export function uploadMinFile(file, callback, progress) {
  // 得到md5码
  getFileMD5(file, md5 => {
    // 存储文件的md5码
    file.md5 = md5
    const subfix = file.name.substr(file.name.lastIndexOf('.'))
    key = 'live/upload/'+ file.md5 + subfix

    cos.putObject({
        Bucket: cosConfig.Bucket,
        Region: cosConfig.Region,
        Key: key,
        Body: file,
        onProgress: (progressData)=> {
          // console.log(JSON.stringify(info))
          progress(progressData.percent)
        }
      }, (err, data) => {
        callback(err, data)
    })
  })
}

// 删除指定文件
export function removeFile(Key,callback) {
    cos.deleteObject({
        Bucket: cosConfig.Bucket,
        Region: cosConfig.Region,
        Key: Key
      }, function (err, data) {
        callback(err,data)
      });
}
   