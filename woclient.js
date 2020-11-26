const encrypt = require('./cryptor.js').aesEncrypt
const crypto = require('crypto')
const got = require('got')

var options = {
  base_url: 'http://153.37.81.21:12007',
  cpId: 'wccs',
  key:'7e50dda2215ec70cf3fd556bbcbf5612'
}

function WoClient(opt) {
  this.options = options
  // options.base_url
  // options.cpId options.key
  this.invoke = async function(action, params){
    let param = encrypt(this.options.key, JSON.stringify(params))
    let buf = this.options.cpId + param + this.options.key
    let sign = crypto.createHash('md5').update(buf).digest("hex")
    let endpoint = WO_ACTIONS[action].endpoint
    // request!
    try {
      const response = await got.get(`${this.options.base_url}${endpoint}`, {
        searchParams: {cpId: this.options.cpId, param: param, sign: sign},
        responseType: 'json'
      })
      return response.body
    } catch (error) {
      console.log(error)
      return null
    }
  }

}

const WO_ACTIONS = {
  send_code: {endpoint: '/mpi/sendCode'},
  check_code: {endpoint: '/mpi/checkCode'},
  query_integral: {endpoint: '/mpi/queryIntegral'},
  place_order: {endpoint: '/mpi/placeOrder'},
  pay_order: {endpoint: '/mpi/payOrder'}
}

module.exports = WoClient
