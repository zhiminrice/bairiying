/**
 * 百日营学员管理系统 - 初始数据库迁移（SQLite 版本）
 * 创建全部 12 张核心业务表及索引
 */

exports.up = async function (knex) {
  // Enable foreign keys
  await knex.raw('PRAGMA foreign_keys = ON');

  // 1. groups - without leader_id FK yet (circular dependency with users)
  await knex.schema.createTable('groups', (t) => {
    t.increments('id').primary();
    t.string('name', 100).notNullable();
    t.integer('leader_id');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

  // 2. users
  await knex.schema.createTable('users', (t) => {
    t.increments('id').primary();
    t.string('name', 100).notNullable();
    t.string('phone', 20).unique();
    t.string('email', 255).unique();
    t.string('password_hash', 255).notNullable();
    t.text('role').notNullable();
    t.integer('group_id').references('id').inTable('groups');
    t.text('status').notNullable().defaultTo('active');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  // 3. students
  await knex.schema.createTable('students', (t) => {
    t.increments('id').primary();
    t.string('name', 100).notNullable();
    t.integer('group_id').notNullable().references('id').inTable('groups');
    t.text('status').notNullable().defaultTo('active');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

  // 4. courses
  await knex.schema.createTable('courses', (t) => {
    t.increments('id').primary();
    t.integer('week_no').notNullable();
    t.string('title', 255).notNullable();
    t.date('course_date').notNullable();
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

  // 5. attendance
  await knex.schema.createTable('attendance', (t) => {
    t.increments('id').primary();
    t.integer('student_id').notNullable().references('id').inTable('students');
    t.date('date').notNullable();
    t.text('status').notNullable();
    t.text('note');
    t.integer('created_by').notNullable().references('id').inTable('users');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.unique(['student_id', 'date']);
  });

  // 6. course_attendance
  await knex.schema.createTable('course_attendance', (t) => {
    t.increments('id').primary();
    t.integer('course_id').notNullable().references('id').inTable('courses');
    t.integer('student_id').notNullable().references('id').inTable('students');
    t.boolean('present').notNullable();
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.unique(['course_id', 'student_id']);
  });

  // 7. assignments
  await knex.schema.createTable('assignments', (t) => {
    t.increments('id').primary();
    t.integer('student_id').notNullable().references('id').inTable('students');
    t.integer('course_id').notNullable().references('id').inTable('courses');
    t.boolean('submitted').notNullable().defaultTo(false);
    t.text('content');
    t.integer('created_by').notNullable().references('id').inTable('users');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

  // 8. records
  await knex.schema.createTable('records', (t) => {
    t.increments('id').primary();
    t.integer('student_id').notNullable().references('id').inTable('students');
    t.text('type').notNullable();
    t.integer('course_id').references('id').inTable('courses');
    t.date('record_date').notNullable();
    t.text('content').notNullable();
    t.integer('created_by').notNullable().references('id').inTable('users');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

  // 9. comments
  await knex.schema.createTable('comments', (t) => {
    t.increments('id').primary();
    t.text('target_type').notNullable();
    t.integer('target_id').notNullable();
    t.integer('teacher_id').notNullable().references('id').inTable('users');
    t.text('content').notNullable();
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

  // 10. consult_slots
  await knex.schema.createTable('consult_slots', (t) => {
    t.increments('id').primary();
    t.integer('teacher_id').notNullable().references('id').inTable('users');
    t.timestamp('start_time').notNullable();
    t.integer('duration').notNullable().defaultTo(30);
    t.text('status').notNullable().defaultTo('open');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

  // 11. consultations
  await knex.schema.createTable('consultations', (t) => {
    t.increments('id').primary();
    t.integer('slot_id').notNullable().references('id').inTable('consult_slots');
    t.integer('student_id').notNullable().references('id').inTable('students');
    t.integer('teacher_id').notNullable().references('id').inTable('users');
    t.integer('booked_by').notNullable().references('id').inTable('users');
    t.text('status').notNullable().defaultTo('pending');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

  // 12. witnesses
  await knex.schema.createTable('witnesses', (t) => {
    t.increments('id').primary();
    t.integer('student_id').notNullable().references('id').inTable('students');
    t.text('text').notNullable();
    t.string('image_url', 500);
    t.text('display_mode').notNullable().defaultTo('named');
    t.text('status').notNullable().defaultTo('pending');
    t.integer('submitted_by').notNullable().references('id').inTable('users');
    t.timestamp('published_at');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

  // === Indexes ===
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_students_group ON students(group_id)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_records_student_date ON records(student_id, record_date)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_records_type ON records(type)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_consult_slots_teacher ON consult_slots(teacher_id)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_consultations_teacher ON consultations(teacher_id)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_witnesses_status ON witnesses(status)');
  await knex.schema.raw(
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_consultations_student_unique ON consultations(student_id) WHERE status IN ('pending','confirmed','completed')"
  );
};

exports.down = async function (knex) {
  // Drop in reverse dependency order
  await knex.schema.dropTableIfExists('witnesses');
  await knex.schema.dropTableIfExists('consultations');
  await knex.schema.dropTableIfExists('consult_slots');
  await knex.schema.dropTableIfExists('comments');
  await knex.schema.dropTableIfExists('records');
  await knex.schema.dropTableIfExists('assignments');
  await knex.schema.dropTableIfExists('course_attendance');
  await knex.schema.dropTableIfExists('attendance');
  await knex.schema.dropTableIfExists('courses');
  await knex.schema.dropTableIfExists('students');
  await knex.schema.dropTableIfExists('users');
  await knex.schema.dropTableIfExists('groups');
};
