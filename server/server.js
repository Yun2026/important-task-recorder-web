require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Sequelize, Model, DataTypes } = require('sequelize');

// 初始化服务
const app = express();
app.use(cors()); // 解决跨域
app.use(express.json()); // 解析JSON请求

// 数据库连接 - 使用 SQLite（无需安装 MySQL）
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: '/app/data/database.sqlite',
  logging: false
});

// 数据模型定义
// 用户模型
class User extends Model {}
User.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nickname: { type: DataTypes.STRING(50), allowNull: false },
  email: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  password: { type: DataTypes.STRING(255), allowNull: false }
}, { 
  sequelize, 
  modelName: 'user', 
  tableName: 'users', 
  timestamps: true, 
  createdAt: 'create_time', 
  updatedAt: 'update_time' 
});

// 事务模型
class Task extends Model {}
Task.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING(100), allowNull: false },
  content: { type: DataTypes.TEXT },
  start_time: { type: DataTypes.DATE },
  end_time: { type: DataTypes.DATE },
  priority: { type: DataTypes.ENUM('high', 'medium', 'low'), defaultValue: 'medium' },
  tags: { type: DataTypes.STRING(100) },
  is_completed: { type: DataTypes.TINYINT(1), defaultValue: 0 },
  // 提醒功能字段
  reminder_enabled: { type: DataTypes.TINYINT(1), defaultValue: 0 }, // 0=关闭, 1=开启
  reminder_time: { type: DataTypes.DATE, allowNull: true }, // 提醒时间
  // 专注功能字段
  focus_time: { type: DataTypes.INTEGER, defaultValue: 25 * 60 } // 专注时间（秒），默认25分钟
}, { 
  sequelize, 
  modelName: 'task', 
  tableName: 'tasks', 
  timestamps: true, 
  createdAt: 'create_time', 
  updatedAt: 'update_time' 
});

// 身份验证中间件（保护需要登录的接口）
const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ code: 401, msg: '请先登录' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'task_cloud_secret_key');
    req.user = decoded; // 解析出用户ID存入请求
    next();
  } catch (err) {
    return res.status(401).json({ code: 401, msg: '登录状态失效，请重新登录' });
  }
};

// 6. 核心接口
// 注册接口
app.post('/api/auth/register', async (req, res) => {
  try {
    const { nickname, email, password, confirmPassword } = req.body;
    // 基础校验
    if (!nickname || !email || !password || !confirmPassword) return res.status(400).json({ code: 400, msg: '请完善所有必填字段' });
    if (password !== confirmPassword) return res.status(400).json({ code: 400, msg: '两次密码不一致' });
    if (password.length < 6) return res.status(400).json({ code: 400, msg: '密码长度不能少于6位' });
    // 邮箱查重
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(400).json({ code: 400, msg: '该邮箱已注册' });
    // 密码加密
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    // 创建用户
    const user = await User.create({ nickname, email, password: hashedPassword });
    res.status(201).json({ code: 200, msg: '注册成功', data: { userId: user.id, nickname: user.nickname, email: user.email } });
  } catch (err) {
    console.error('注册失败：', err);
    res.status(500).json({ code: 500, msg: '服务器错误，注册失败' });
  }
});

// 登录接口
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    // 基础校验
    if (!email || !password) return res.status(400).json({ code: 400, msg: '请输入邮箱和密码' });
    // 查找用户
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ code: 400, msg: '邮箱或密码错误' });
    // 密码验证
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ code: 400, msg: '邮箱或密码错误' });
    // 生成JWT令牌（有效期7天）
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'task_cloud_secret_key',
      { expiresIn: '7d' }
    );
    res.json({
      code: 200,
      msg: '登录成功',
      data: {
        token,
        userInfo: { userId: user.id, nickname: user.nickname, email: user.email }
      }
    });
  } catch (err) {
    console.error('登录失败：', err);
    res.status(500).json({ code: 500, msg: '服务器错误，登录失败' });
  }
});

// 获取当前登录用户信息
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: ['id', 'nickname', 'email', 'create_time'] });
    if (!user) return res.status(404).json({ code: 404, msg: '用户不存在' });
    res.json({ code: 200, data: user });
  } catch (err) {
    console.error('获取用户信息失败：', err);
    res.status(500).json({ code: 500, msg: '服务器错误' });
  }
});

// 获取事务列表（支持登录/未登录）
app.get('/api/tasks', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    let userId = 0; // 未登录默认user_id=0（对应预置事务）
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'task_cloud_secret_key');
      userId = decoded.id;
    }
    // 查询事务（按创建时间倒序）
    const tasks = await Task.findAll({
      where: { user_id: userId },
      order: [['create_time', 'DESC']]
    });
    res.json({ code: 200, data: tasks });
  } catch (err) {
    console.error('获取事务列表失败：', err);
    res.status(500).json({ code: 500, msg: '服务器错误，获取事务失败' });
  }
});

// 添加事务（需登录）
app.post('/api/tasks', authMiddleware, async (req, res) => {
  try {
    const { title, content, start_time, end_time, priority, tags, reminder_enabled, reminder_time } = req.body;
    if (!title) return res.status(400).json({ code: 400, msg: '事务标题不能为空' });
    // 创建事务（关联当前登录用户）
    const task = await Task.create({
      user_id: req.user.id,
      title,
      content,
      start_time: start_time ? new Date(start_time) : null,
      end_time: end_time ? new Date(end_time) : null,
      priority,
      tags,
      // 提醒字段：reminder_enabled 为 1 或 true 时开启
      reminder_enabled: reminder_enabled === 1 || reminder_enabled === true ? 1 : 0,
      reminder_time: reminder_time ? new Date(reminder_time) : null
    });
    res.status(201).json({ code: 200, msg: '事务添加成功', data: task });
  } catch (err) {
    console.error('添加事务失败：', err);
    res.status(500).json({ code: 500, msg: '服务器错误，添加事务失败' });
  }
});

// 更新事务（需登录）
app.put('/api/tasks/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, start_time, end_time, priority, tags, is_completed, reminder_enabled, reminder_time, focus_time } = req.body;
    // 验证事务归属
    const task = await Task.findOne({ where: { id, user_id: req.user.id } });
    if (!task) return res.status(404).json({ code: 404, msg: '事务不存在或无权限操作' });
    
    // 构建更新数据
    const updateData = {
      title,
      content,
      start_time: start_time ? new Date(start_time) : null,
      end_time: end_time ? new Date(end_time) : null,
      priority,
      tags,
      is_completed: is_completed !== undefined ? (is_completed ? 1 : 0) : task.is_completed
    };
    
    // 处理提醒字段（如果前端传了这两个字段）
    if (reminder_enabled !== undefined) {
      updateData.reminder_enabled = reminder_enabled === 1 || reminder_enabled === true ? 1 : 0;
    }
    if (reminder_time !== undefined) {
      updateData.reminder_time = reminder_time ? new Date(reminder_time) : null;
    }
    
    // 处理专注时间
    if (focus_time !== undefined && typeof focus_time === 'number' && focus_time > 0) {
      updateData.focus_time = focus_time;
    }
    
    // 更新事务
    await task.update(updateData);
    
    // 重新查询获取完整数据（包含更新后的字段）
    const updatedTask = await Task.findByPk(id);
    res.json({ code: 200, msg: '事务更新成功', data: updatedTask });
  } catch (err) {
    console.error('更新事务失败：', err);
    res.status(500).json({ code: 500, msg: '服务器错误，更新事务失败' });
  }
});

// 更新事务完成状态（需登录）
app.put('/api/tasks/:id/complete', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_completed } = req.body;
    // 验证事务归属
    const task = await Task.findOne({ where: { id, user_id: req.user.id } });
    if (!task) return res.status(404).json({ code: 404, msg: '事务不存在或无权限操作' });
    // 更新状态
    await task.update({ is_completed: is_completed ? 1 : 0 });
    res.json({ code: 200, msg: '状态更新成功', data: task });
  } catch (err) {
    console.error('更新事务状态失败：', err);
    res.status(500).json({ code: 500, msg: '服务器错误，更新状态失败' });
  }
});

// 删除事务（需登录）
app.delete('/api/tasks/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    // 验证事务归属
    const task = await Task.findOne({ where: { id, user_id: req.user.id } });
    if (!task) return res.status(404).json({ code: 404, msg: '事务不存在或无权限操作' });
    // 删除事务
    await task.destroy();
    res.json({ code: 200, msg: '事务删除成功' });
  } catch (err) {
    console.error('删除事务失败：', err);
    res.status(500).json({ code: 500, msg: '服务器错误，删除失败' });
  }
});

// 更新事务专注时间（需登录）
app.put('/api/tasks/:id/focus-time', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { focus_time } = req.body;
    
    // 验证专注时间
    if (!focus_time || typeof focus_time !== 'number' || focus_time <= 0) {
      return res.status(400).json({ code: 400, msg: '专注时间必须是正整数' });
    }
    
    // 验证事务归属
    const task = await Task.findOne({ where: { id, user_id: req.user.id } });
    if (!task) return res.status(404).json({ code: 404, msg: '事务不存在或无权限操作' });
    
    // 更新专注时间
    await task.update({ focus_time });
    
    // 重新查询获取完整数据
    const updatedTask = await Task.findByPk(id);
    res.json({ code: 200, msg: '专注时间更新成功', data: updatedTask });
  } catch (err) {
    console.error('更新专注时间失败：', err);
    res.status(500).json({ code: 500, msg: '服务器错误，更新专注时间失败' });
  }
});

// 一键清除已完成事务（需登录）
app.delete('/api/tasks/clear-completed', authMiddleware, async (req, res) => {
  try {
    await Task.destroy({ where: { user_id: req.user.id, is_completed: 1 } });
    res.json({ code: 200, msg: '已完成事务清除成功' });
  } catch (err) {
    console.error('清除已完成事务失败：', err);
    res.status(500).json({ code: 500, msg: '服务器错误，清除失败' });
  }
});

// 健康检查接口
app.get('/api/health', (req, res) => {
  res.json({ code: 200, msg: '服务正常运行' });
});

// 7. 启动服务
const PORT = process.env.PORT || 3001;
sequelize.authenticate()
  .then(() => {
    console.log('数据库连接成功');
    // 同步模型到数据库（自动创建表）
    return sequelize.sync({ alter: true });
  })
  .then(() => {
    console.log('数据库模型同步完成');
    app.listen(PORT, () => console.log(`服务器运行在 http://localhost:${PORT}`));
  })
  .catch(err => console.error('数据库连接失败：', err));
