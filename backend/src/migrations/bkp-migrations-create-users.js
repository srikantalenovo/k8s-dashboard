// module.exports = {
//   up: async (queryInterface, Sequelize) => {
//     await queryInterface.addColumn('Users', 'lastLogin', {
//       type: Sequelize.DATE,
//       allowNull: true
//     });
//     await queryInterface.addColumn('Users', 'isActive', {
//       type: Sequelize.BOOLEAN,
//       defaultValue: true
//     });
//     await queryInterface.addColumn('Users', 'role', {
//       type: Sequelize.ENUM('user', 'admin'),
//       defaultValue: 'user'
//     });
//   },
//   down: async (queryInterface) => {
//     await queryInterface.removeColumn('Users', 'lastLogin');
//     await queryInterface.removeColumn('Users', 'isActive');
//     await queryInterface.removeColumn('Users', 'role');
//   }
// };
