const Koa = require('koa')
const Router = require('@koa/router')
const Redis = require('async-redis')
const random = require('string-random')
const morgan = require('koa-morgan')

const Model = require('./model.js')

const port = 3030
const SESSION_TTL = 3600 * 1000

const app = new Koa()
const router = new Router()
const redis = Redis.createClient({host: 'localhost', port: 6379})

router.get('/api/invoice', async (ctx, next) => {
  ctx.body = {
    'results':  [
      {
        'uuid': '68b329da9893e34099c7d8ad5cb9c940',
        'client': {
          'name': 'Bill',
          'email': '',
          'phone': '',
          'address': ''
        },
        'items': [
          {
            'name': '',
            'price': 500,
            'quantity': 3,
            'discount': 50,
            'discount_type': 'percentage|flat_amount',
            'tax': {
              'name': 'tax1',
              'inclusive': false,
              'rate': 17.5
            }
          },
          {},
        ],
        'company': {
          'name': '',
          'email': '',
          'phone': '',
          'address': ''
        },
        'signature': null,
        'client_signature': null,
        'status': '',
        'createdAt': '',
        'paidAt': ''
      }
    ]
  }
})

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

app.use(morgan(':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"'))
app.use(Cryptor())
app.use(router.routes()).use(router.allowedMethods)

app.listen(`${port}`)
