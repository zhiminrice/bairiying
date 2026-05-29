-- 百日营学员管理系统 - Supabase 建表脚本
-- 在 Supabase SQL Editor 中粘贴并执行

-- 1. groups
CREATE TABLE groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    leader_id INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) UNIQUE,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('leader', 'teacher', 'admin')),
    group_id INTEGER REFERENCES groups(id),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE groups ADD CONSTRAINT fk_groups_leader FOREIGN KEY (leader_id) REFERENCES users(id);

-- 3. students
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    group_id INTEGER NOT NULL REFERENCES groups(id),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'dropped')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. courses
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    week_no INTEGER NOT NULL CHECK (week_no BETWEEN 1 AND 12),
    title VARCHAR(255) NOT NULL,
    course_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. attendance
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id),
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent')),
    note TEXT,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (student_id, date)
);

-- 6. course_attendance
CREATE TABLE course_attendance (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id),
    student_id INTEGER NOT NULL REFERENCES students(id),
    present BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (course_id, student_id)
);

-- 7. assignments
CREATE TABLE assignments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id),
    course_id INTEGER NOT NULL REFERENCES courses(id),
    submitted BOOLEAN NOT NULL DEFAULT false,
    content TEXT,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. records
CREATE TABLE records (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id),
    type VARCHAR(20) NOT NULL CHECK (type IN ('harvest', 'diary', 'action')),
    course_id INTEGER REFERENCES courses(id),
    record_date DATE NOT NULL,
    content TEXT NOT NULL,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. comments
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('assignment', 'record')),
    target_id INTEGER NOT NULL,
    teacher_id INTEGER NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. consult_slots
CREATE TABLE consult_slots (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL REFERENCES users(id),
    start_time TIMESTAMPTZ NOT NULL,
    duration INTEGER NOT NULL DEFAULT 30,
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'booked')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. consultations
CREATE TABLE consultations (
    id SERIAL PRIMARY KEY,
    slot_id INTEGER NOT NULL REFERENCES consult_slots(id),
    student_id INTEGER NOT NULL REFERENCES students(id),
    teacher_id INTEGER NOT NULL REFERENCES users(id),
    booked_by INTEGER NOT NULL REFERENCES users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_consultations_student_unique ON consultations(student_id) WHERE status IN ('pending','confirmed','completed');

-- 12. witnesses
CREATE TABLE witnesses (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id),
    text TEXT NOT NULL,
    image_url VARCHAR(500),
    display_mode VARCHAR(20) NOT NULL DEFAULT 'named' CHECK (display_mode IN ('anonymous', 'named')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'hidden')),
    submitted_by INTEGER NOT NULL REFERENCES users(id),
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_students_group ON students(group_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_records_student_date ON records(student_id, record_date);
CREATE INDEX idx_records_type ON records(type);
CREATE INDEX idx_consult_slots_teacher ON consult_slots(teacher_id);
CREATE INDEX idx_consultations_teacher ON consultations(teacher_id);
CREATE INDEX idx_witnesses_status ON witnesses(status);

-- ========== 种子数据 ==========

-- 管理员 (密码: admin123)
INSERT INTO users (name, phone, email, password_hash, role, status) VALUES
('系统管理员', '13800000000', 'admin@bairiying.com', '$2a$12$LJ3m4ys3Lk0TSwHqXYJfSO6lI.xOBfJ.XmP/jG/hHLJX9k.8nKPXa', 'admin', 'active');

-- 7 个小组
INSERT INTO groups (name) VALUES ('第一组'),('第二组'),('第三组'),('第四组'),('第五组'),('第六组'),('第七组');

-- 7 位组长 (密码: 123456)
INSERT INTO users (name, phone, password_hash, role, group_id, status) VALUES
('张组长','13800000001','$2a$12$LJ3m4ys3Lk0TSwHqXYJfSO6lI.xOBfJ.XmP/jG/hHLJX9k.8nKPXa','leader',1,'active'),
('王组长','13800000102','$2a$12$LJ3m4ys3Lk0TSwHqXYJfSO6lI.xOBfJ.XmP/jG/hHLJX9k.8nKPXa','leader',2,'active'),
('李组长','13800000103','$2a$12$LJ3m4ys3Lk0TSwHqXYJfSO6lI.xOBfJ.XmP/jG/hHLJX9k.8nKPXa','leader',3,'active'),
('陈组长','13800000104','$2a$12$LJ3m4ys3Lk0TSwHqXYJfSO6lI.xOBfJ.XmP/jG/hHLJX9k.8nKPXa','leader',4,'active'),
('赵组长','13800000105','$2a$12$LJ3m4ys3Lk0TSwHqXYJfSO6lI.xOBfJ.XmP/jG/hHLJX9k.8nKPXa','leader',5,'active'),
('刘组长','13800000106','$2a$12$LJ3m4ys3Lk0TSwHqXYJfSO6lI.xOBfJ.XmP/jG/hHLJX9k.8nKPXa','leader',6,'active'),
('周组长','13800000107','$2a$12$LJ3m4ys3Lk0TSwHqXYJfSO6lI.xOBfJ.XmP/jG/hHLJX9k.8nKPXa','leader',7,'active');

UPDATE groups SET leader_id = u.id FROM users u WHERE groups.name = '第一组' AND u.phone = '13800000001';
UPDATE groups SET leader_id = u.id FROM users u WHERE groups.name = '第二组' AND u.phone = '13800000102';
UPDATE groups SET leader_id = u.id FROM users u WHERE groups.name = '第三组' AND u.phone = '13800000103';
UPDATE groups SET leader_id = u.id FROM users u WHERE groups.name = '第四组' AND u.phone = '13800000104';
UPDATE groups SET leader_id = u.id FROM users u WHERE groups.name = '第五组' AND u.phone = '13800000105';
UPDATE groups SET leader_id = u.id FROM users u WHERE groups.name = '第六组' AND u.phone = '13800000106';
UPDATE groups SET leader_id = u.id FROM users u WHERE groups.name = '第七组' AND u.phone = '13800000107';

-- 4 位讲师 (密码: 123456)
INSERT INTO users (name, phone, password_hash, role, status) VALUES
('孙讲师','13900000001','$2a$12$LJ3m4ys3Lk0TSwHqXYJfSO6lI.xOBfJ.XmP/jG/hHLJX9k.8nKPXa','teacher','active'),
('钱讲师','13900000002','$2a$12$LJ3m4ys3Lk0TSwHqXYJfSO6lI.xOBfJ.XmP/jG/hHLJX9k.8nKPXa','teacher','active'),
('郑讲师','13900000003','$2a$12$LJ3m4ys3Lk0TSwHqXYJfSO6lI.xOBfJ.XmP/jG/hHLJX9k.8nKPXa','teacher','active'),
('冯讲师','13900000004','$2a$12$LJ3m4ys3Lk0TSwHqXYJfSO6lI.xOBfJ.XmP/jG/hHLJX9k.8nKPXa','teacher','active');

-- 12 周课程
INSERT INTO courses (week_no, title, course_date) VALUES
(1,'亲子关系基础：理解与连接','2026-06-01'),
(2,'情绪管理：从觉察到转化','2026-06-08'),
(3,'有效沟通：倾听与表达的艺术','2026-06-15'),
(4,'边界与规则：温柔而坚定的教养','2026-06-22'),
(5,'内省力培养：自我觉察的起点','2026-06-29'),
(6,'行动力突破：从知道到做到','2026-07-06'),
(7,'家庭氛围营造：爱的语言','2026-07-13'),
(8,'冲突化解：从对抗到合作','2026-07-20'),
(9,'自主性发展：信任与放手','2026-07-27'),
(10,'成长型思维：拥抱挑战','2026-08-03'),
(11,'生命教育：意义与价值','2026-08-10'),
(12,'百日回顾：整合与前行','2026-08-17');
