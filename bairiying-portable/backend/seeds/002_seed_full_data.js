const bcrypt = require('bcryptjs');

/**
 * 种子数据：完整的百日营运营数据
 * 运行时机：在 001_seed_admin 之后执行
 *
 * 001_seed_admin 已创建：
 *   - 管理员 (13800000000 / admin@bairiying.com / admin123)
 *   - 第一组 + 张组长 (13800000001 / leader123)
 *
 * 本种子检查已有数据，幂等补全：
 *   - 第二组 ~ 第七组 + 对应组长 (密码 123456)
 *   - 4 位讲师 (密码 123456)
 *   - 62 名学员 (7+7+8+9+8+11+12 分配)
 *   - 12 周课程
 */
exports.seed = async function (knex) {
  const passwordHash = await bcrypt.hash('123456', 12);

  // ================================================================
  // 1. 检查 001 种子已创建的数据
  // ================================================================
  const existingGroup1 = await knex('groups').where('name', '第一组').first();
  const existingLeader1 = await knex('users').where('name', '张组长').first();

  const groups = [];
  const leaders = [];
  let startGroupIndex = 0;

  if (existingGroup1 && existingLeader1) {
    console.log('[002] 检测到 001 种子已创建第一组和张组长，从第二组开始补全');
    startGroupIndex = 1;
    groups.push(existingGroup1);
    leaders.push(existingLeader1);
  } else {
    console.log('[002] 未检测到已有数据，从头创建全部小组和组长');
  }

  // ================================================================
  // 2. 创建小组（从 startGroupIndex 开始）
  // ================================================================
  const groupNames = ['第一组', '第二组', '第三组', '第四组', '第五组', '第六组', '第七组'];

  for (let i = startGroupIndex; i < 7; i++) {
    const [g] = await knex('groups')
      .insert({ name: groupNames[i], leader_id: null })
      .returning('*');
    groups.push(g);
  }

  // ================================================================
  // 3. 创建组长（每组一位）
  // ================================================================
  const leaderNames = ['王组长', '李组长', '陈组长', '赵组长', '刘组长', '周组长', '吴组长'];
  const numNewLeaders = existingLeader1 ? 6 : 7;

  for (let i = 0; i < numNewLeaders; i++) {
    const groupIndex = startGroupIndex + i;
    const phone = `1380000010${startGroupIndex + i + 1}`;

    const [l] = await knex('users')
      .insert({
        name: leaderNames[i],
        phone,
        password_hash: passwordHash,
        role: 'leader',
        group_id: groups[groupIndex].id,
        status: 'active',
      })
      .returning('*');

    leaders.push(l);

    // 更新小组的 leader_id
    await knex('groups')
      .where('id', groups[groupIndex].id)
      .update({ leader_id: l.id });
  }

  // 如果张组长来自 001，确保第一组的 leader_id 正确
  if (existingLeader1 && existingGroup1) {
    await knex('groups')
      .where('id', existingGroup1.id)
      .update({ leader_id: existingLeader1.id });
  }

  // ================================================================
  // 4. 创建 4 位讲师
  // ================================================================
  const teacherNames = ['孙讲师', '钱讲师', '郑讲师', '冯讲师'];
  const teachers = [];

  // 避免重复插入讲师（幂等保护）
  const existingTeachers = await knex('users').where('role', 'teacher').select('name');

  for (let i = 0; i < 4; i++) {
    const alreadyExists = existingTeachers.some((t) => t.name === teacherNames[i]);
    if (alreadyExists) {
      console.log(`[002] 讲师 "${teacherNames[i]}" 已存在，跳过`);
      const [t] = await knex('users').where('name', teacherNames[i]).where('role', 'teacher');
      teachers.push(t);
      continue;
    }

    const [t] = await knex('users')
      .insert({
        name: teacherNames[i],
        phone: `1390000000${i + 1}`,
        password_hash: passwordHash,
        role: 'teacher',
        status: 'active',
      })
      .returning('*');
    teachers.push(t);
  }

  // ================================================================
  // 5. 创建 62 名学员（7+7+8+9+8+11+12 = 62）
  // ================================================================
  const studentGroups = [7, 7, 8, 9, 8, 11, 12];
  const surnames = [
    '张', '李', '王', '陈', '赵', '刘', '周', '吴', '郑', '冯',
    '孙', '钱', '朱', '马', '胡', '林', '何', '高', '梁', '郭',
    '罗', '宋', '唐', '韩', '曹', '许', '邓', '萧', '曾', '程',
    '蔡', '彭', '潘', '袁', '于', '董', '余', '苏', '叶', '吕',
    '魏', '蒋', '田', '杜', '丁', '沈', '姜', '范', '江', '傅',
    '钟', '卢', '汪', '戴', '崔', '任', '陆', '廖', '姚', '方',
    '金', '邱',
  ];
  const givenNames = [
    '明', '华', '丽', '强', '伟', '芳', '敏', '静', '军', '秀英',
    '洋', '勇', '艳', '杰', '磊', '娜', '婷', '超', '平', '刚',
    '桂英', '文', '辉', '玲', '峰', '建', '红', '志强', '秀兰', '海燕',
    '小龙', '晓明', '雪', '佳', '浩', '博', '欣', '宇', '彤', '思远',
    '梦琪', '星辰', '晨曦', '雨桐', '梓涵', '若溪', '一鸣', '天宇', '浩然', '子轩',
    '俊杰', '雅琪', '紫萱', '欣怡', '诗涵', '语嫣', '乐天', '知远', '知行', '明哲',
    '思齐', '致远',
  ];

  // 幂等保护：检查是否已有学员
  const existingStudentCount = await knex('students').count('id as cnt').first();
  let allStudents = [];

  if (parseInt(existingStudentCount.cnt, 10) >= 62) {
    console.log(`[002] 已有 ${existingStudentCount.cnt} 名学员，跳过创建`);
    allStudents = await knex('students').select('*');
  } else {
    let studentIndex = 0;
    for (let g = 0; g < 7; g++) {
      const count = studentGroups[g];
      for (let s = 0; s < count; s++) {
        const surname = surnames[studentIndex % surnames.length];
        const given = givenNames[studentIndex % givenNames.length];

        const [student] = await knex('students')
          .insert({
            name: `${surname}${given}`,
            group_id: groups[g].id,
            status: 'active',
          })
          .returning('*');
        allStudents.push(student);
        studentIndex++;
      }
    }
  }

  // ================================================================
  // 6. 创建 12 周课程
  // ================================================================
  const courseTitles = [
    '亲子关系基础：理解与连接',
    '情绪管理：从觉察到转化',
    '有效沟通：倾听与表达的艺术',
    '边界与规则：温柔而坚定的教养',
    '内省力培养：自我觉察的起点',
    '行动力突破：从知道到做到',
    '家庭氛围营造：爱的语言',
    '冲突化解：从对抗到合作',
    '自主性发展：信任与放手',
    '成长型思维：拥抱挑战',
    '生命教育：意义与价值',
    '百日回顾：整合与前行',
  ];

  const courses = [];

  // 幂等保护：检查是否已有课程
  const existingCourseCount = await knex('courses').count('id as cnt').first();

  if (parseInt(existingCourseCount.cnt, 10) >= 12) {
    console.log(`[002] 已有 ${existingCourseCount.cnt} 周课程，跳过创建`);
  } else {
    const startDate = new Date('2026-06-01');
    for (let w = 0; w < 12; w++) {
      const courseDate = new Date(startDate);
      courseDate.setDate(courseDate.getDate() + w * 7);
      const [course] = await knex('courses')
        .insert({
          week_no: w + 1,
          title: courseTitles[w],
          course_date: courseDate.toISOString().split('T')[0],
        })
        .returning('*');
      courses.push(course);
    }
  }

  // ================================================================
  // 输出汇总
  // ================================================================
  console.log('');
  console.log('=== 完整种子数据创建完成 ===');
  console.log('  管理员 - 1 位 (admin@bairiying.com / admin123)');
  console.log('  讲师   - 4 位 (13900000001~04 / 123456)');
  console.log(`  组长   - ${leaders.length} 位`);
  if (existingLeader1) {
    console.log('    第一组: 张组长 (13800000001 / leader123) [来自 001 种子]');
  }
  console.log('    第二~七组: 王组长~周组长 (13800000102~107 / 123456)');
  console.log(`  小组   - ${groups.length} 个`);
  console.log(`  学员   - ${allStudents.length} 名 (${studentGroups.join('+')})`);
  console.log(`  课程   - 12 周 (2026-06-01 起每周一)`);
  console.log('');
};
