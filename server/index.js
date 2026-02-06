const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 中间件
app.use(cors());
app.use(express.json());

// 数据库初始化
const dbPath = path.join(__dirname, 'data.db');
const db = new sqlite3.Database(dbPath);

// 创建表
db.serialize(() => {
  // 用户表
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    nickname TEXT NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 任务表
  db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    start_date TEXT,
    start_time TEXT,
    end_time TEXT,
    deadline TEXT,
    priority TEXT DEFAULT 'medium',
    tags TEXT,
    is_completed INTEGER DEFAULT 0,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  // 回收站表
  db.run(`CREATE TABLE IF NOT EXISTS recycle_bin (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    task_data TEXT NOT NULL,
    deleted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  console.log('数据库表初始化完成');
});

// 认证中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ code: 401, msg: '未提供认证令牌' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ code: 403, msg: '令牌无效或已过期' });
    }
    req.user = user;
    next();
  });
};

// 统一响应格式
const success = (data, msg = '操作成功') => ({ code: 200, data, msg });
const error = (msg, code = 500) => ({ code, msg });

// ==================== 用户认证接口 ====================

// 注册
app.post('/api/auth/register', async (req, res) => {
  try {
    const { nickname, email, password } = req.body;

    if (!nickname || !email || !password) {
      return res.status(400).json(error('请填写完整信息', 400));
    }

    // 检查邮箱是否已存在
    const existingUser = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });

    if (existingUser) {
      return res.status(409).json(error('该邮箱已被注册', 409));
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    // 创建用户
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO users (id, email, nickname, password) VALUES (?, ?, ?, ?)',
        [userId, email, nickname, hashedPassword],
        function(err) {
          if (err) reject(err);
          resolve(this.lastID);
        }
      );
    });

    // 生成 token
    const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });

    res.json(success({
      token,
      user: {
        id: userId,
        email,
        nickname
      }
    }, '注册成功'));
  } catch (err) {
    console.error('注册错误:', err);
    res.status(500).json(error('注册失败：' + err.message));
  }
});

// 登录
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json(error('请填写邮箱和密码', 400));
    }

    // 查找用户
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });

    if (!user) {
      return res.status(401).json(error('邮箱或密码错误', 401));
    }

    // 验证密码
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json(error('邮箱或密码错误', 401));
    }

    // 生成 token
    const token = jwt.sign({ userId: user.id, email }, JWT_SECRET, { expiresIn: '7d' });

    res.json(success({
      token,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname
      }
    }, '登录成功'));
  } catch (err) {
    console.error('登录错误:', err);
    res.status(500).json(error('登录失败：' + err.message));
  }
});

// 获取当前用户信息
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT id, email, nickname, created_at FROM users WHERE id = ?', [req.user.userId], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });

    if (!user) {
      return res.status(404).json(error('用户不存在', 404));
    }

    res.json(success(user));
  } catch (err) {
    console.error('获取用户信息错误:', err);
    res.status(500).json(error('获取用户信息失败'));
  }
});

// ==================== 任务管理接口 ====================

// 获取所有任务
app.get('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const tasks = await new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM tasks WHERE user_id = ? ORDER BY create_time DESC',
        [req.user.userId],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });

    res.json(success(tasks));
  } catch (err) {
    console.error('获取任务错误:', err);
    res.status(500).json(error('获取任务失败'));
  }
});

// 创建任务
app.post('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const taskId = uuidv4();
    const {
      title, content, start_date, start_time, end_time, deadline,
      priority, tags, is_completed
    } = req.body;

    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO tasks (id, user_id, title, content, start_date, start_time, end_time, deadline, priority, tags, is_completed)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [taskId, req.user.userId, title, content, start_date, start_time, end_time, deadline, priority, tags, is_completed ? 1 : 0],
        function(err) {
          if (err) reject(err);
          resolve(this.lastID);
        }
      );
    });

    const task = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM tasks WHERE id = ?', [taskId], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });

    res.json(success(task, '任务创建成功'));
  } catch (err) {
    console.error('创建任务错误:', err);
    res.status(500).json(error('创建任务失败'));
  }
});

// 更新任务
app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title, content, start_date, start_time, end_time, deadline,
      priority, tags, is_completed
    } = req.body;

    // 检查任务是否存在且属于当前用户
    const existingTask = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [id, req.user.userId], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });

    if (!existingTask) {
      return res.status(404).json(error('任务不存在', 404));
    }

    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE tasks SET
          title = ?, content = ?, start_date = ?, start_time = ?,
          end_time = ?, deadline = ?, priority = ?, tags = ?,
          is_completed = ?, update_time = CURRENT_TIMESTAMP
         WHERE id = ? AND user_id = ?`,
        [title, content, start_date, start_time, end_time, deadline, priority, tags, is_completed ? 1 : 0, id, req.user.userId],
        function(err) {
          if (err) reject(err);
          resolve();
        }
      );
    });

    const task = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM tasks WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });

    res.json(success(task, '任务更新成功'));
  } catch (err) {
    console.error('更新任务错误:', err);
    res.status(500).json(error('更新任务失败'));
  }
});

// 删除任务（移动到回收站）
app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // 获取任务数据
    const task = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [id, req.user.userId], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });

    if (!task) {
      return res.status(404).json(error('任务不存在', 404));
    }

    // 移动到回收站
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO recycle_bin (id, user_id, task_data) VALUES (?, ?, ?)',
        [uuidv4(), req.user.userId, JSON.stringify(task)],
        function(err) {
          if (err) reject(err);
          resolve();
        }
      );
    });

    // 删除任务
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM tasks WHERE id = ? AND user_id = ?', [id, req.user.userId], function(err) {
        if (err) reject(err);
        resolve();
      });
    });

    res.json(success(null, '任务已删除'));
  } catch (err) {
    console.error('删除任务错误:', err);
    res.status(500).json(error('删除任务失败'));
  }
});

// 切换任务完成状态
app.patch('/api/tasks/:id/toggle', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_completed } = req.body;

    const task = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [id, req.user.userId], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });

    if (!task) {
      return res.status(404).json(error('任务不存在', 404));
    }

    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE tasks SET is_completed = ?, update_time = CURRENT_TIMESTAMP WHERE id = ?',
        [is_completed ? 1 : 0, id],
        function(err) {
          if (err) reject(err);
          resolve();
        }
      );
    });

    res.json(success({ is_completed }, '状态更新成功'));
  } catch (err) {
    console.error('切换任务状态错误:', err);
    res.status(500).json(error('更新状态失败'));
  }
});

// 清空已完成任务
app.delete('/api/tasks/completed/clear', authenticateToken, async (req, res) => {
  try {
    // 获取所有已完成的任务
    const completedTasks = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM tasks WHERE user_id = ? AND is_completed = 1', [req.user.userId], (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      });
    });

    // 移动到回收站
    for (const task of completedTasks) {
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO recycle_bin (id, user_id, task_data) VALUES (?, ?, ?)',
          [uuidv4(), req.user.userId, JSON.stringify(task)],
          function(err) {
            if (err) reject(err);
            resolve();
          }
        );
      });
    }

    // 删除已完成的任务
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM tasks WHERE user_id = ? AND is_completed = 1', [req.user.userId], function(err) {
        if (err) reject(err);
        resolve();
      });
    });

    res.json(success(null, '已完成任务已清空'));
  } catch (err) {
    console.error('清空已完成任务错误:', err);
    res.status(500).json(error('清空失败'));
  }
});

// ==================== 回收站接口 ====================

// 获取回收站列表
app.get('/api/recycle-bin', authenticateToken, async (req, res) => {
  try {
    const items = await new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM recycle_bin WHERE user_id = ? ORDER BY deleted_at DESC',
        [req.user.userId],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows.map(row => ({
            ...row,
            task_data: JSON.parse(row.task_data)
          })));
        }
      );
    });

    res.json(success(items));
  } catch (err) {
    console.error('获取回收站错误:', err);
    res.status(500).json(error('获取回收站失败'));
  }
});

// 恢复任务
app.post('/api/recycle-bin/:id/restore', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const item = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM recycle_bin WHERE id = ? AND user_id = ?', [id, req.user.userId], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });

    if (!item) {
      return res.status(404).json(error('项目不存在', 404));
    }

    const taskData = JSON.parse(item.task_data);

    // 恢复任务
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO tasks (id, user_id, title, content, start_date, start_time, end_time, deadline, priority, tags, is_completed, create_time)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [taskData.id, taskData.user_id, taskData.title, taskData.content, taskData.start_date, taskData.start_time, taskData.end_time, taskData.deadline, taskData.priority, taskData.tags, taskData.is_completed, taskData.create_time],
        function(err) {
          if (err) reject(err);
          resolve();
        }
      );
    });

    // 从回收站删除
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM recycle_bin WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        resolve();
      });
    });

    res.json(success(null, '任务已恢复'));
  } catch (err) {
    console.error('恢复任务错误:', err);
    res.status(500).json(error('恢复失败'));
  }
});

// 永久删除
app.delete('/api/recycle-bin/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    await new Promise((resolve, reject) => {
      db.run('DELETE FROM recycle_bin WHERE id = ? AND user_id = ?', [id, req.user.userId], function(err) {
        if (err) reject(err);
        resolve();
      });
    });

    res.json(success(null, '已永久删除'));
  } catch (err) {
    console.error('永久删除错误:', err);
    res.status(500).json(error('删除失败'));
  }
});

// 清空回收站
app.delete('/api/recycle-bin/clear', authenticateToken, async (req, res) => {
  try {
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM recycle_bin WHERE user_id = ?', [req.user.userId], function(err) {
        if (err) reject(err);
        resolve();
      });
    });

    res.json(success(null, '回收站已清空'));
  } catch (err) {
    console.error('清空回收站错误:', err);
    res.status(500).json(error('清空失败'));
  }
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
  console.log(`数据库路径: ${dbPath}`);
});

// 优雅关闭
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('关闭数据库错误:', err);
    } else {
      console.log('数据库连接已关闭');
    }
    process.exit(0);
  });
});
