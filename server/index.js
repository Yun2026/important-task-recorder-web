const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'task-recorder-secret-key-2024';

// 中间件
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-ID']
}));
app.use(express.json());

// 请求日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - User: ${req.headers['x-user-id'] || 'anonymous'}`);
  next();
});

// 数据库初始化 - 使用多用户共享模式
const db = new sqlite3.Database(path.join(__dirname, 'tasks.db'));

// 启用WAL模式以提高并发性能
db.run('PRAGMA journal_mode = WAL;');
db.run('PRAGMA synchronous = NORMAL;');

// 共享用户ID - 所有用户共享同一组数据
const SHARED_USER_ID = 'shared';

// 创建表
db.serialize(() => {
  // 用户表
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nickname TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    createTime TEXT DEFAULT CURRENT_TIMESTAMP,
    updateTime TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  // 任务表 - 添加userId字段支持多用户共享
  db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    userId TEXT DEFAULT '${SHARED_USER_ID}',
    title TEXT NOT NULL,
    subTitle TEXT,
    priority TEXT DEFAULT 'mid',
    category TEXT DEFAULT 'work',
    startDate TEXT,
    startTime TEXT,
    endTime TEXT,
    deadline TEXT,
    tags TEXT,
    status TEXT DEFAULT 'unfinished',
    createTime TEXT,
    reminder TEXT,
    updateTime TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  // 回收站表
  db.run(`CREATE TABLE IF NOT EXISTS recycle_bin (
    id TEXT PRIMARY KEY,
    userId TEXT DEFAULT '${SHARED_USER_ID}',
    title TEXT NOT NULL,
    subTitle TEXT,
    priority TEXT,
    category TEXT,
    startDate TEXT,
    startTime TEXT,
    endTime TEXT,
    deadline TEXT,
    tags TEXT,
    status TEXT,
    createTime TEXT,
    reminder TEXT,
    deletedAt TEXT DEFAULT CURRENT_TIMESTAMP
  )`);
  
  // 创建索引以提高查询性能
  db.run(`CREATE INDEX IF NOT EXISTS idx_tasks_userId ON tasks(userId)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_tasks_createTime ON tasks(createTime)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_recycle_bin_userId ON recycle_bin(userId)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_recycle_bin_deletedAt ON recycle_bin(deletedAt)`);
});

// 获取用户ID（从请求头或默认共享）
const getUserId = (req) => {
  return req.headers['x-user-id'] || SHARED_USER_ID;
};

// JWT验证中间件
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ code: 401, msg: '未提供认证令牌' });
  }

  const token = authHeader.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    next();
  } catch (err) {
    return res.status(401).json({ code: 401, msg: '令牌无效或已过期' });
  }
};

// ===== 用户认证API =====

// 用户注册
app.post('/api/auth/register', async (req, res) => {
  try {
    const { nickname, email, password, confirmPassword } = req.body;

    // 验证必填字段
    if (!nickname || !email || !password) {
      return res.status(400).json({ code: 400, msg: '请完善所有必填字段' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ code: 400, msg: '两次输入的密码不一致' });
    }

    if (password.length < 6) {
      return res.status(400).json({ code: 400, msg: '密码至少需要6个字符' });
    }

    // 检查邮箱是否已存在
    const existingUser = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (existingUser) {
      return res.status(400).json({ code: 400, msg: '该邮箱已被注册' });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const result = await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO users (nickname, email, password, createTime) VALUES (?, ?, ?, ?)',
        [nickname, email, hashedPassword, new Date().toISOString()],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });

    console.log(`用户注册成功: ${email}`);
    res.json({
      code: 200,
      msg: '注册成功',
      data: { userId: result.id, nickname, email }
    });
  } catch (err) {
    console.error('注册失败:', err);
    res.status(500).json({ code: 500, msg: '注册失败，请稍后重试' });
  }
});

// 用户登录
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ code: 400, msg: '请输入邮箱和密码' });
    }

    // 查找用户
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user) {
      return res.status(400).json({ code: 400, msg: '邮箱或密码错误' });
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ code: 400, msg: '邮箱或密码错误' });
    }

    // 生成JWT令牌
    const token = jwt.sign(
      { userId: user.id, email: user.email, nickname: user.nickname },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`用户登录成功: ${email}`);
    res.json({
      code: 200,
      msg: '登录成功',
      data: {
        token,
        userInfo: {
          userId: user.id,
          nickname: user.nickname,
          email: user.email
        }
      }
    });
  } catch (err) {
    console.error('登录失败:', err);
    res.status(500).json({ code: 500, msg: '登录失败，请稍后重试' });
  }
});

// 获取当前用户信息
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT id, nickname, email, createTime FROM users WHERE id = ?', [req.userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user) {
      return res.status(404).json({ code: 404, msg: '用户不存在' });
    }

    res.json({ code: 200, data: user });
  } catch (err) {
    console.error('获取用户信息失败:', err);
    res.status(500).json({ code: 500, msg: '获取用户信息失败' });
  }
});

// ===== 任务API =====

// 获取所有任务 - 多用户共享模式
app.get('/api/tasks', (req, res) => {
  const userId = getUserId(req);
  console.log(`获取任务列表 - 用户: ${userId}`);
  
  db.all('SELECT * FROM tasks ORDER BY createTime DESC', [], (err, rows) => {
    if (err) {
      console.error('获取任务失败:', err);
      return res.status(500).json({ error: '获取任务失败' });
    }
    
    // 解析tags和reminder字段
    const tasks = rows.map(row => ({
      ...row,
      tags: row.tags ? JSON.parse(row.tags) : [],
      reminder: row.reminder ? JSON.parse(row.reminder) : null
    }));
    
    console.log(`返回 ${tasks.length} 个任务`);
    res.json({ success: true, data: tasks });
  });
});

// 获取单个任务
app.get('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM tasks WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: '获取任务失败' });
    }
    if (!row) {
      return res.status(404).json({ error: '任务不存在' });
    }
    
    const task = {
      ...row,
      tags: row.tags ? JSON.parse(row.tags) : [],
      reminder: row.reminder ? JSON.parse(row.reminder) : null
    };
    
    res.json({ success: true, data: task });
  });
});

// 创建任务 - 支持多用户共享
app.post('/api/tasks', (req, res) => {
  const userId = getUserId(req);
  const task = {
    id: req.body.id || uuidv4(),
    userId: userId,
    title: req.body.title || '',
    subTitle: req.body.subTitle || '',
    priority: req.body.priority || 'mid',
    category: req.body.category || 'work',
    startDate: req.body.startDate || '',
    startTime: req.body.startTime || '',
    endTime: req.body.endTime || '',
    deadline: req.body.deadline || '',
    tags: JSON.stringify(req.body.tags || []),
    status: req.body.status || 'unfinished',
    createTime: req.body.createTime || new Date().toISOString(),
    reminder: req.body.reminder ? JSON.stringify(req.body.reminder) : null
  };

  console.log(`创建任务 - 用户: ${userId}, 任务: ${task.title}`);

  const sql = `INSERT INTO tasks (id, userId, title, subTitle, priority, category, startDate, startTime, endTime, deadline, tags, status, createTime, reminder)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  
  db.run(sql, [
    task.id, task.userId, task.title, task.subTitle, task.priority, task.category,
    task.startDate, task.startTime, task.endTime, task.deadline,
    task.tags, task.status, task.createTime, task.reminder
  ], function(err) {
    if (err) {
      console.error('创建任务失败:', err);
      return res.status(500).json({ error: '创建任务失败' });
    }
    console.log(`任务创建成功: ${task.id}`);
    res.json({ success: true, data: { id: task.id } });
  });
});

// 更新任务 - 支持多用户共享
app.put('/api/tasks/:id', (req, res) => {
  const userId = getUserId(req);
  const { id } = req.params;
  const updates = req.body;
  
  console.log(`更新任务 - 用户: ${userId}, 任务ID: ${id}`);
  
  // 构建更新字段
  const fields = [];
  const values = [];
  
  if (updates.title !== undefined) { fields.push('title = ?'); values.push(updates.title); }
  if (updates.subTitle !== undefined) { fields.push('subTitle = ?'); values.push(updates.subTitle); }
  if (updates.priority !== undefined) { fields.push('priority = ?'); values.push(updates.priority); }
  if (updates.category !== undefined) { fields.push('category = ?'); values.push(updates.category); }
  if (updates.startDate !== undefined) { fields.push('startDate = ?'); values.push(updates.startDate); }
  if (updates.startTime !== undefined) { fields.push('startTime = ?'); values.push(updates.startTime); }
  if (updates.endTime !== undefined) { fields.push('endTime = ?'); values.push(updates.endTime); }
  if (updates.deadline !== undefined) { fields.push('deadline = ?'); values.push(updates.deadline); }
  if (updates.tags !== undefined) { fields.push('tags = ?'); values.push(JSON.stringify(updates.tags)); }
  if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status); }
  if (updates.reminder !== undefined) { fields.push('reminder = ?'); values.push(JSON.stringify(updates.reminder)); }
  
  fields.push('updateTime = CURRENT_TIMESTAMP');
  values.push(id);
  
  if (fields.length === 0) {
    return res.status(400).json({ error: '没有要更新的字段' });
  }
  
  const sql = `UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`;
  
  db.run(sql, values, function(err) {
    if (err) {
      console.error('更新任务失败:', err);
      return res.status(500).json({ error: '更新任务失败' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: '任务不存在' });
    }
    console.log(`任务更新成功: ${id}`);
    res.json({ success: true });
  });
});

// 删除任务（移到回收站）- 支持多用户共享
app.delete('/api/tasks/:id', (req, res) => {
  const userId = getUserId(req);
  const { id } = req.params;
  
  console.log(`删除任务 - 用户: ${userId}, 任务ID: ${id}`);
  
  // 先获取任务信息
  db.get('SELECT * FROM tasks WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('获取任务失败:', err);
      return res.status(500).json({ error: '删除任务失败' });
    }
    if (!row) {
      return res.status(404).json({ error: '任务不存在' });
    }
    
    // 插入到回收站
    const recycleSql = `INSERT INTO recycle_bin (id, userId, title, subTitle, priority, category, startDate, startTime, endTime, deadline, tags, status, createTime, reminder)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    db.run(recycleSql, [
      row.id, row.userId || SHARED_USER_ID, row.title, row.subTitle, row.priority, row.category,
      row.startDate, row.startTime, row.endTime, row.deadline,
      row.tags, row.status, row.createTime, row.reminder
    ], (err) => {
      if (err) {
        console.error('移到回收站失败:', err);
        return res.status(500).json({ error: '删除任务失败' });
      }
      
      // 从任务表删除
      db.run('DELETE FROM tasks WHERE id = ?', [id], function(err) {
        if (err) {
          console.error('删除任务失败:', err);
          return res.status(500).json({ error: '删除任务失败' });
        }
        console.log(`任务已移到回收站: ${id}`);
        res.json({ success: true });
      });
    });
  });
});

// ===== 回收站API =====

// 获取回收站列表 - 支持多用户共享
app.get('/api/recycle-bin', (req, res) => {
  const userId = getUserId(req);
  console.log(`获取回收站列表 - 用户: ${userId}`);
  
  db.all('SELECT * FROM recycle_bin ORDER BY deletedAt DESC', [], (err, rows) => {
    if (err) {
      console.error('获取回收站失败:', err);
      return res.status(500).json({ error: '获取回收站失败' });
    }
    
    const tasks = rows.map(row => ({
      ...row,
      tags: row.tags ? JSON.parse(row.tags) : [],
      reminder: row.reminder ? JSON.parse(row.reminder) : null
    }));
    
    console.log(`返回回收站 ${tasks.length} 个任务`);
    res.json({ success: true, data: tasks });
  });
});

// 从回收站恢复任务 - 支持多用户共享
app.post('/api/recycle-bin/:id/restore', (req, res) => {
  const userId = getUserId(req);
  const { id } = req.params;
  
  console.log(`恢复任务 - 用户: ${userId}, 任务ID: ${id}`);
  
  db.get('SELECT * FROM recycle_bin WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('获取回收站任务失败:', err);
      return res.status(500).json({ error: '恢复任务失败' });
    }
    if (!row) {
      return res.status(404).json({ error: '任务不存在' });
    }
    
    // 插入回任务表
    const insertSql = `INSERT INTO tasks (id, userId, title, subTitle, priority, category, startDate, startTime, endTime, deadline, tags, status, createTime, reminder)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    db.run(insertSql, [
      row.id, row.userId || SHARED_USER_ID, row.title, row.subTitle, row.priority, row.category,
      row.startDate, row.startTime, row.endTime, row.deadline,
      row.tags, row.status, row.createTime, row.reminder
    ], (err) => {
      if (err) {
        console.error('恢复任务失败:', err);
        return res.status(500).json({ error: '恢复任务失败' });
      }
      
      // 从回收站删除
      db.run('DELETE FROM recycle_bin WHERE id = ?', [id], function(err) {
        if (err) {
          console.error('从回收站删除失败:', err);
          return res.status(500).json({ error: '恢复任务失败' });
        }
        console.log(`任务恢复成功: ${id}`);
        res.json({ success: true });
      });
    });
  });
});

// 永久删除回收站任务 - 支持多用户共享
app.delete('/api/recycle-bin/:id', (req, res) => {
  const userId = getUserId(req);
  const { id } = req.params;
  
  console.log(`永久删除回收站任务 - 用户: ${userId}, 任务ID: ${id}`);
  
  db.run('DELETE FROM recycle_bin WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('永久删除失败:', err);
      return res.status(500).json({ error: '删除失败' });
    }
    console.log(`回收站任务已永久删除: ${id}`);
    res.json({ success: true });
  });
});

// 清空回收站 - 支持多用户共享
app.delete('/api/recycle-bin', (req, res) => {
  const userId = getUserId(req);
  
  console.log(`清空回收站 - 用户: ${userId}`);
  
  db.run('DELETE FROM recycle_bin', function(err) {
    if (err) {
      console.error('清空回收站失败:', err);
      return res.status(500).json({ error: '清空回收站失败' });
    }
    console.log('回收站已清空');
    res.json({ success: true });
  });
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: '服务运行正常',
    mode: '多用户共享模式',
    timestamp: new Date().toISOString()
  });
});

// 获取服务器信息
app.get('/api/info', (req, res) => {
  res.json({
    success: true,
    mode: '多用户共享模式',
    description: '所有用户共享同一组任务数据，实现云端同步',
    features: [
      '多用户数据共享',
      '云端同步',
      '回收站功能',
      '实时更新'
    ]
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('重要事务记录本 - 服务端已启动');
  console.log('='.repeat(50));
  console.log(`端口: ${PORT}`);
  console.log(`模式: 多用户共享模式`);
  console.log(`功能: 所有用户共享同一组任务数据`);
  console.log(`API地址: http://localhost:${PORT}/api`);
  console.log('='.repeat(50));
});
