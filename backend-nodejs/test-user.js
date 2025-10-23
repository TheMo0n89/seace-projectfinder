const { User } = require('./src/models');
const { sequelize } = require('./src/config/database');

async function test() {
  try {
    await sequelize.authenticate();
    console.log('Conexión OK');

    // Probar consulta simple
    const user = await User.findOne({ where: { username: 'testuser' } });
    console.log('Consulta OK:', user);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

test();