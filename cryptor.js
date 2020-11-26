const crypto = require('crypto')

const key = '7e50dda2215ec70cf3fd556bbcbf5612'

function aesDecrypt(key, buf){
  const decipher = crypto.createDecipheriv('aes-128-ecb', Buffer.from(key, "hex"), '')
  let text = [decipher.update(buf, 'hex', 'ascii'), decipher.final('ascii')].join('')
  return text
}

function aesEncrypt(key, buf){
  const cipher = crypto.createCipheriv('aes-128-ecb', Buffer.from(key, "hex"), '')
  let text = [cipher.update(buf, 'ascii', 'hex'), cipher.final('hex')].join('')
  return text
}

function Cryptor() {
  return async(ctx, next) => {
    const merchantId = ctx.request.query.merchantId
    const sign = ctx.request.query.sign
    const params = ctx.request.query.params
    if (!sign || !params || !merchantId){
      ctx.body = {code: 10000, errmsg: 'Bad Request'}
      return
    }

    // TODO get key from redis
    let buf = merchantId + params + key;
    if (crypto.createHash('md5').update(buf).digest("hex") != sign){
      ctx.body = {code: 10000, errmsg: 'Bad Sign'}
      return
    }

    let data = aesDecrypt(key, params)
    ctx.request.decryptedParams = JSON.parse(data)

    await next()
  }
}

module.exports = {aesEncrypt, aesDecrypt, Cryptor}
