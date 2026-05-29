/**
 * 角色授权中间件工厂函数
 * @param  {...string} roles 允许访问的角色列表
 * @returns {Function} Express 中间件
 */
function requireRole(...roles) {
  return function authorize(req, res, next) {
    if (!req.user) {
      return res.status(401).json({ error: '未认证' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: '权限不足，无法执行此操作' });
    }

    next();
  };
}

module.exports = requireRole;
