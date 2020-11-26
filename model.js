const { Sequelize, Model, DataTypes } = require('sequelize')

const sequelize = new Sequelize('mysql://unicom:Un1c@M-2020@localhost:3306/unicom')

class UnicomOrder extends Model {}

UnicomOrder.init({
  phone: DataTypes.STRING,
  orderNumber: DataTypes.STRING,
  productId: DataTypes.STRING,
  productName: DataTypes.STRING,
  productPrice: DataTypes.INTEGER,
  cpId: DataTypes.STRING,
  merchantId: DataTypes.STRING,
  status: {type: DataTypes.INTEGER, allowNull: true},
  code: {type: DataTypes.INTEGER, allowNull: true}
}, {
  sequelize,
  tableName: 'unicom_order',
  createdAt: 'ctime',
  updatedAt: 'utime'
});

// DO NOT SYNC

async function test() {
  try {
    await sequelize.authenticate()
    const order = await UnicomOrder.create({
      phone: '18611108639',
      orderNumber: 'a_test_order_number',
      productId: 'foo',
      productName: 'bar',
      productPrice: 100,
      cpId: 'wccs',
      merchantId: 'eleme'
    })
    console.log(order.toJSON())
    console.log('Connection has been established successfully.')
  } catch (error) {
    console.error('Unable to connect to the database:', error)
  }
}

module.exports = {
    UnicomOrder
}
