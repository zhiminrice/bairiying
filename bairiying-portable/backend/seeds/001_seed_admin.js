const bcrypt = require('bcryptjs');

/**
 * 种子数据：默认管理员 + 示例小组 + 示例组长
 */
exports.seed = async function (knex) {
  // 清空数据（按外键依赖逆序删除）
  await knex('witnesses').del();
  await knex('consultations').del();
  await knex('consult_slots').del();
  await knex('comments').del();
  await knex('records').del();
  await knex('assignments').del();
  await knex('course_attendance').del();
  await knex('attendance').del();
  await knex('courses').del();
  await knex('students').del();
  await knex('users').del();
  await knex('groups').del();

  // SQLite auto-increment resets automatically on DELETE

  // === 创建默认管理员 ===
  const adminPasswordHash = await bcrypt.hash('admin123', 12);

  await knex('users').insert({
    name: '系统管理员',
    phone: '13800000000',
    email: 'admin@bairiying.com',
    password_hash: adminPasswordHash,
    role: 'admin',
    status: 'active',
  });

  // === 创建示例小组 ===
  const [group] = await knex('groups')
    .insert({
      name: '第一组',
      leader_id: null,
    })
    .returning('*');

  // === 创建示例组长 ===
  const leaderPasswordHash = await bcrypt.hash('leader123', 12);

  const [leader] = await knex('users')
    .insert({
      name: '张组长',
      phone: '13800000001',
      password_hash: leaderPasswordHash,
      role: 'leader',
      group_id: group.id,
      status: 'active',
    })
    .returning('id');

  // 更新 group 的 leader_id
  await knex('groups').where({ id: group.id }).update({ leader_id: leader.id });

  console.log('种子数据创建完成:');
  console.log('  管理员 - admin@bairiying.com / admin123');
  console.log('  组长   - 13800000001 / leader123');
  console.log('  小组   - 第一组');
};
