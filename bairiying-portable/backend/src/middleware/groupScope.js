/**
 * 组长作用域中间件
 * 对于 leader 角色，确保 req.user 上存在 group_id
 * 用于限制 leader 只能操作自己组内的数据
 */
function groupScope(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: '未认证' });
  }

  if (req.user.role === 'leader' && !req.user.group_id) {
    return res.status(403).json({ error: '组长未被分配到任何小组' });
  }

  next();
}

module.exports = groupScope;
