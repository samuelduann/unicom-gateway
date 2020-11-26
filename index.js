const Koa = require('koa')
const Router = require('@koa/router')
const Redis = require('async-redis')
const random = require('string-random')
const morgan = require('koa-morgan')

const Cryptor = require('./cryptor.js').Cryptor
const WoClient = require('./woclient.js')
const Model = require('./model.js')

const port = 3000
const SESSION_TTL = 3600 * 1000

const app = new Koa()
const router = new Router()
const client = new WoClient()
const redis = Redis.createClient({host: 'localhost', port: 6379})

router.get('/gb/api/send_code', async (ctx, next) => {
  console.log(ctx.request.decryptedParams)
  let ret = await client.invoke('send_code', ctx.request.decryptedParams)
  if (ret.resultCode == 'SUCCESS'){
    let phone = ctx.request.decryptedParams.phone
    let token = ret.data.token
    await redis.set(token, phone)
    await redis.expire(token, SESSION_TTL)
  }
  ctx.body = ret
})

router.get('/gb/api/check_code', async (ctx, next) => {
  let ret = await client.invoke('check_code', ctx.request.decryptedParams)
  if (ret.resultCode == 'SUCCESS'){
    let phone = await redis.get(ctx.request.decryptedParams.token)
    let authorizationCode = ret.data.authorizationCode
    let sessionid = random(32, {letters: 'ABCDEFGH'})
    await redis.hmset(sessionid, ['phone', phone, 'code', authorizationCode])
    await redis.expire(sessionid, SESSION_TTL)
    delete(ret.data.authorizationCode)
    ret.data.sessionid = sessionid
  }
  ctx.body = ret
})

router.get('/gb/api/query_integral', async (ctx, next) => {
  let sessionid = ctx.request.decryptedParams.sessionid
  let data = await redis.hgetall(sessionid)
  if (!sessionid || !data){
    ctx.body = {resultCode: '200000', resultMsg: 'session expired'}
  }

  let authorizationCode = data.code
  let ret = await client.invoke('query_integral', {authorizationCode})

  let now = new Date().toUTCString()
  console.log(`${now} ${data.phone} query_integral ${ret.resultCode} ` + JSON.stringify(ret))

  ctx.body = ret
})

router.get('/gb/api/place_order', async (ctx, next) => {
  let sessionid = ctx.request.decryptedParams.sessionid
  let data = await redis.hgetall(sessionid)
  if (!sessionid || !data){
    ctx.body = {resultCode: '200000', resultMsg: 'session expired'}
  }

  let authorizationCode = data.code
  let productId = ctx.request.decryptedParams.productId
  ret = await client.invoke('place_order', {authorizationCode, productId})

  let now = new Date().toUTCString()
  console.log(`${now} ${data.phone} place_order ${productId} ${ret.resultCode}` + JSON.stringify(ret))

  Model.UnicomOrder.create({
    phone: data.phone,
    orderNumber: ret.data.orderNumber,
    productId: productId,
    productName: ret.data.productName,
    productPrice: ret.data.productPrice,
    cpId: 'wccs', // TODO! mapping merchantId to cpId
    merchantId: ctx.request.query.merchantId
  })

  ctx.body = ret
})

router.get('/gb/api/pay_order', async (ctx, next) => {
  let ret = await client.invoke('pay_order', ctx.request.decryptedParams)

  let now = new Date().toUTCString()
  console.log(`${now} pay_order ${ctx.request.decryptedParams.orderNumber} ${ret.resultCode} ` + JSON.stringify(ret))

  let orderNumber = ctx.request.decryptedParams.orderNumber
  await Model.UnicomOrder.update({
    status: ret.resultCode == 'SUCCESS' ? 1 : 2,
    code: ret.resultCode == 'SUCCESS' ? 0 : ret.resultCode
  }, {where: {orderNumber}})

  ctx.body = ret
})

app.use(morgan(':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"'))
app.use(Cryptor())
app.use(router.routes()).use(router.allowedMethods)

app.listen(`${port}`)
