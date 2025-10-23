/**
 * Script para crear usuarios iniciales en la base de datos
 */
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { sequelize } = require('../config/database');

// Lista de usuarios iniciales
const initialUsers = [
  {
    username: 'admin',
    email: 'admin@seaceprojectfinder.com',
    password: 'admin123',
    full_name: 'Administrador',
    role: 'admin',
    is_active: true
  },
  {
    username: 'guest',
    email: 'user@seaceprojectfinder.com',
    password: 'user123',
    full_name: 'Usuario Demo',
    role: 'guest',
    is_active: true
  }
];

// Función para crear los usuarios iniciales
async function createInitialUsers() {
  try {
    console.log('Iniciando creación de usuarios iniciales...');

    // Crear una transacción
    const transaction = await sequelize.transaction();

    try {
      for (const userData of initialUsers) {
        // Verificar si el usuario ya existe (por username o email)
        const existingUser = await User.findOne({
          where: {
            [require('sequelize').Op.or]: [
              { email: userData.email },
              { username: userData.username }
            ]
          },
          transaction
        });

        if (existingUser) {
          console.log(`✓ Usuario ${userData.username} (${userData.email}) ya existe - omitiendo.`);
          continue;
        }

        // Crear el usuario (el hook beforeCreate hasheará la contraseña)
        await User.create(
          {
            username: userData.username,
            email: userData.email,
            hashed_password: userData.password, // El hook lo hasheará
            full_name: userData.full_name,
            role: userData.role,
            is_active: userData.is_active
          },
          { transaction }
        );

        console.log(`✓ Usuario ${userData.username} creado correctamente.`);
      }

      // Confirmar la transacción
      await transaction.commit();
      console.log('✓ ¡Proceso de usuarios iniciales completado con éxito!');
    } catch (error) {
      // Revertir la transacción en caso de error
      await transaction.rollback();
      throw error;
    }

    process.exit(0);
  } catch (error) {
    console.error('Error al crear usuarios iniciales:', error);
    process.exit(1);
  }
}

// Ejecutar la creación de usuarios
createInitialUsers();