/**
 * 种子数据：演示数据
 * 填充打卡记录、作业、学员内容、点评、咨询时段、见证墙投稿
 * 仅供演示和测试使用
 */
exports.seed = async function (knex) {
  // ================================================================
  // 前置检查：确认基础数据已存在
  // ================================================================
  const studentCount = await knex('students').count('id as count').first();
  const courseCount = await knex('courses').count('id as count').first();
  const teacherCount = await knex('users').where('role', 'teacher').count('id as count').first();

  if (parseInt(studentCount.count) === 0) {
    console.log('⚠️  学员数据为空，请先运行 001 和 002 种子。');
    return;
  }

  // 检查是否已有演示数据
  const existingAttendance = await knex('attendance').count('id as count').first();
  if (parseInt(existingAttendance.count) > 0) {
    console.log('⏭️  演示数据已存在，跳过。');
    return;
  }

  // ================================================================
  // 获取已有数据
  // ================================================================
  const students = await knex('students').where('status', 'active').select('id', 'name', 'group_id').orderBy('group_id').orderBy('id');
  const courses = await knex('courses').select('id', 'week_no', 'title', 'course_date').orderBy('week_no');
  const teachers = await knex('users').where('role', 'teacher').select('id', 'name');
  const leaders = await knex('users').where('role', 'leader').select('id', 'name', 'group_id');

  const leaderMap = {};
  leaders.forEach(l => { leaderMap[l.group_id] = l; });

  // ================================================================
  // 1. 每日打卡记录（最近 14 天）
  // ================================================================
  const today = new Date();
  const attendanceRecords = [];
  for (let d = 0; d < 14; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    const dateStr = date.toISOString().split('T')[0];

    for (const student of students) {
      // 90% 概率已到，10% 未到
      const isPresent = Math.random() < 0.90;
      attendanceRecords.push({
        student_id: student.id,
        date: dateStr,
        status: isPresent ? 'present' : 'absent',
        note: isPresent ? null : (Math.random() < 0.3 ? '请假' : null),
        created_by: leaderMap[student.group_id]?.id || 1,
      });
    }
  }

  // 批量插入（每批 200 条）
  for (let i = 0; i < attendanceRecords.length; i += 200) {
    await knex('attendance').insert(attendanceRecords.slice(i, i + 200)).onConflict(['student_id', 'date']).ignore();
  }
  console.log(`✅ 打卡记录: ${attendanceRecords.length} 条`);

  // ================================================================
  // 特殊处理：让 3 个学员连续 4 天缺卡（测试断卡提醒）
  // ================================================================
  const brokenStudents = students.slice(0, 3); // 前 3 个学员
  for (const s of brokenStudents) {
    for (let d = 0; d < 4; d++) {
      const date = new Date(today);
      date.setDate(date.getDate() - d);
      const dateStr = date.toISOString().split('T')[0];
      await knex('attendance')
        .where({ student_id: s.id, date: dateStr })
        .update({ status: 'absent' });
    }
  }
  console.log(`⚠️  断卡测试学员: ${brokenStudents.map(s => s.name).join('、')}`);

  // ================================================================
  // 2. 课程出勤（前 4 周课程）
  // ================================================================
  const courseAttendanceRecords = [];
  for (const course of courses.slice(0, 4)) {
    for (const student of students) {
      const isPresent = Math.random() < 0.85;
      courseAttendanceRecords.push({
        course_id: course.id,
        student_id: student.id,
        present: isPresent,
      });
    }
  }
  for (let i = 0; i < courseAttendanceRecords.length; i += 200) {
    await knex('course_attendance').insert(courseAttendanceRecords.slice(i, i + 200)).onConflict(['course_id', 'student_id']).ignore();
  }
  console.log(`✅ 课程出勤: ${courseAttendanceRecords.length} 条`);

  // ================================================================
  // 3. 作业登记（前 4 周）
  // ================================================================
  const assignmentRecords = [];
  const sampleContents = [
    '完成课堂练习，对亲子沟通有了新的理解',
    '作业已完成，孩子很喜欢这次的主题',
    '做得还不错，需要更多实践练习',
    null, null, // 30% 概率无内容
  ];
  for (const course of courses.slice(0, 4)) {
    for (const student of students) {
      const submitted = Math.random() < 0.75;
      assignmentRecords.push({
        student_id: student.id,
        course_id: course.id,
        submitted,
        content: submitted ? sampleContents[Math.floor(Math.random() * sampleContents.length)] : null,
        created_by: leaderMap[student.group_id]?.id || 1,
      });
    }
  }
  for (let i = 0; i < assignmentRecords.length; i += 200) {
    await knex('assignments').insert(assignmentRecords.slice(i, i + 200));
  }
  console.log(`✅ 作业登记: ${assignmentRecords.length} 条`);

  // ================================================================
  // 4. 学员内容（收获/内省日记/行动分享）
  // ================================================================
  const harvestTexts = [
    '通过这堂课，我学会了如何更好地倾听孩子的需求，不再急于给出建议。',
    '最大的收获是意识到情绪管理的重要性，先处理情绪再处理事情。',
    '理解了"温柔而坚定"的真正含义，回家试了一下，效果很好。',
    '认识到自己过去的沟通方式存在很多问题，这堂课给了我新的方向。',
    '对生命教育的理解更深了，感谢这次课程。',
  ];
  const diaryTexts = [
    '今天觉察到自己对孩子说话时语气太急，晚上试着放慢语速，孩子明显更愿意交流了。',
    '内省练习：今天三次情绪波动，两次成功平复，一次没控制住。继续加油。',
    '发现了自己一个模式：当孩子不听话时，我会不自觉地提高音量。明天试着换一种方式。',
    '今天的觉察：原来我一直在用自己不喜欢的方式对待孩子。要改变。',
    '安静下来之后，看到了自己内心深处的焦虑来源。这是一个重要的发现。',
  ];
  const actionTexts = [
    '本周实践：每天睡前 10 分钟专心陪伴，不玩手机。孩子的变化让我惊喜。',
    '尝试了课上教的"积极暂停"方法，和孩子一起约定了一个冷静角。',
    '和家人开了家庭会议，讨论了手机使用规则，大家都愿意遵守。',
    '用"鼓励代替表扬"的方法夸奖了孩子三次，他眼睛都亮了。',
    '开始记录每天的三件好事，已经坚持 5 天了。',
  ];

  const recordTypes = ['harvest', 'diary', 'action'];
  const recordTexts = { harvest: harvestTexts, diary: diaryTexts, action: actionTexts };

  const recordData = [];
  for (const course of courses.slice(0, 4)) {
    for (const student of students) {
      // 60% 概率有课程收获
      if (Math.random() < 0.6) {
        const rDate = new Date(course.course_date);
        rDate.setDate(rDate.getDate() + Math.floor(Math.random() * 3));
        recordData.push({
          student_id: student.id,
          type: 'harvest',
          course_id: course.id,
          record_date: rDate.toISOString().split('T')[0],
          content: harvestTexts[Math.floor(Math.random() * harvestTexts.length)],
          created_by: leaderMap[student.group_id]?.id || 1,
        });
      }
    }
  }

  // 内省日记和行动分享：随机分配
  for (let d = 0; d < 10; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    const dateStr = date.toISOString().split('T')[0];

    // 每天每人 30% 概率有一条
    for (const student of students) {
      if (Math.random() < 0.3) {
        const type = recordTypes[Math.floor(Math.random() * recordTypes.length)];
        if (type === 'harvest') continue; // harvest 必须有 course
        recordData.push({
          student_id: student.id,
          type,
          record_date: dateStr,
          content: recordTexts[type][Math.floor(Math.random() * recordTexts[type].length)],
          created_by: leaderMap[student.group_id]?.id || 1,
        });
      }
    }
  }

  for (let i = 0; i < recordData.length; i += 100) {
    await knex('records').insert(recordData.slice(i, i + 100));
  }
  console.log(`✅ 学员内容: ${recordData.length} 条 (harvest/diary/action)`);

  // ================================================================
  // 5. 讲师点评（前 40% 的 records 被点评，留 60% 未点评）
  // ================================================================
  const allRecords = await knex('records').select('id').orderBy('id');
  const toCommentCount = Math.floor(allRecords.length * 0.4);
  const shuffledRecords = allRecords.sort(() => Math.random() - 0.5);
  const commentTargets = shuffledRecords.slice(0, toCommentCount);

  const commentTexts = [
    '非常棒的收获！看到你的成长，继续加油。',
    '觉察得很到位，这个发现对你未来的亲子关系会有很大帮助。',
    '行动力很强！从知道到做到，这一步很关键。',
    '写得很真诚，保持这份觉察的状态。',
    '我注意到你在情绪管理方面有明显进步，为你感到高兴。',
    '建议下次可以试试把我教的方法和你的实际情况多结合。',
    '感谢你的分享，对其他学员也是很好的启发。',
    '这个视角很独特，可以再深入思考一下。',
  ];

  for (const target of commentTargets) {
    const teacher = teachers[Math.floor(Math.random() * teachers.length)];
    await knex('comments').insert({
      target_type: 'record',
      target_id: target.id,
      teacher_id: teacher.id,
      content: commentTexts[Math.floor(Math.random() * commentTexts.length)],
    });
  }
  console.log(`✅ 讲师点评: ${commentTargets.length} 条 (约 40% 内容已点评)`);

  // ================================================================
  // 6. 咨询时段（每位讲师发布 3-5 个未来时段）
  // ================================================================
  for (const teacher of teachers) {
    const slotCount = 3 + Math.floor(Math.random() * 3); // 3-5 个
    for (let s = 0; s < slotCount; s++) {
      const slotDate = new Date(today);
      slotDate.setDate(slotDate.getDate() + 1 + Math.floor(Math.random() * 10));
      slotDate.setHours(9 + Math.floor(Math.random() * 8), [0, 30][Math.floor(Math.random() * 2)], 0, 0);

      // 20% 概率已约
      const status = Math.random() < 0.2 ? 'booked' : 'open';
      await knex('consult_slots').insert({
        teacher_id: teacher.id,
        start_time: slotDate.toISOString(),
        duration: 30,
        status,
      });
    }
  }
  const slotCount = await knex('consult_slots').count('id as count').first();
  console.log(`✅ 咨询时段: ${slotCount.count} 个`);

  // ================================================================
  // 7. 咨询预约（为已约时段创建预约记录，每人不超过 1 次）
  // ================================================================
  const bookedSlots = await knex('consult_slots').where('status', 'booked').select('id', 'teacher_id', 'start_time');
  const bookedStudents = new Set();

  for (const slot of bookedSlots) {
    // 找一个还没有预约过的学员
    const available = students.filter(s => !bookedStudents.has(s.id));
    if (available.length === 0) break;

    const student = available[Math.floor(Math.random() * available.length)];
    bookedStudents.add(student.id);

    const statuses = ['pending', 'confirmed', 'completed'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    await knex('consultations').insert({
      slot_id: slot.id,
      student_id: student.id,
      teacher_id: slot.teacher_id,
      booked_by: leaderMap[student.group_id]?.id || 1,
      status,
    });
  }
  const consultationCount = await knex('consultations').count('id as count').first();
  console.log(`✅ 咨询预约: ${consultationCount.count} 条`);

  // ================================================================
  // 8. 见证墙投稿（每组 1-3 条）
  // ================================================================
  const witnessTexts = [
    '小明这周在亲子沟通课上表现特别积极，主动分享了和孩子的互动故事，大家都被感动了。',
    '小红的内省日记写得很深刻，她对自己情绪模式的觉察让我看到了真正的成长。',
    '特别看见这个妈妈的改变：从焦虑到从容，从说教到倾听，一百天的力量真的在发生。',
    '虽然一开始觉得很难，但坚持到今天，已经能感受到家庭氛围的微妙变化了。为你骄傲！',
    '在行动分享中提到了一个细节：孩子主动抱了她并说"妈妈你变了"。这就是最好的反馈。',
    '默默坚持打卡从未断过，这份自律值得所有人学习。',
    '从最开始的沉默到现在愿意在课上分享，这个变化让人感动。',
    '看到你把课程内容真正用到了生活中，这才是学习的意义。',
  ];

  for (const groupId of [1, 2, 3, 4, 5, 6, 7]) {
    const groupStudents = students.filter(s => s.group_id === groupId);
    const witnessCount = 1 + Math.floor(Math.random() * 3);

    for (let w = 0; w < witnessCount && w < groupStudents.length; w++) {
      const student = groupStudents[w];
      const statuses = ['pending', 'published', 'hidden'];
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      await knex('witnesses').insert({
        student_id: student.id,
        text: witnessTexts[Math.floor(Math.random() * witnessTexts.length)],
        display_mode: Math.random() < 0.3 ? 'anonymous' : 'named',
        status,
        submitted_by: leaderMap[groupId]?.id || 1,
        published_at: status === 'published' ? new Date().toISOString() : null,
      });
    }
  }
  const witnessCount = await knex('witnesses').count('id as count').first();
  console.log(`✅ 见证墙投稿: ${witnessCount.count} 条`);

  // ================================================================
  // 总结
  // ================================================================
  console.log('\n🎉 演示数据生成完毕！');
  console.log('   - 管理员登录后可在"数据统计"看到出勤率');
  console.log('   - 讲师登录可看到约 60% 待点评内容');
  console.log('   - 组长看板有断卡提醒（前3位学员）');
};
