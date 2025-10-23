const { User } = require('./src/models');
const { sequelize } = require('./src/config/database');
const bcrypt = require('bcryptjs');

async function test() {
  try {
    await sequelize.authenticate();
    console.log('Conexión OK');

    // Crear usuario directamente
    const hashedPassword = await bcrypt.hash('test123', 10);
    console.log('Password hashed');

    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      hashed_password: hashedPassword,
      full_name: 'Usuario de Prueba',
      role: 'guest',
      is_active: true
    });

    console.log('Usuario creado:', user.toJSON());

  } catch (error) {
    console.error('Error completo:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
  } finally {
    await sequelize.close();
  }
}

test();