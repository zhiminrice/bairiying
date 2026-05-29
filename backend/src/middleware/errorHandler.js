/**
 * 全局错误处理中间件
 */
function errorHandler(err, req, res, _next) {
  console.error('[Error]', err);

  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }

  // 数据库错误处理
  if (err.code === '23505') {
    return res.status(409).json({ error: '数据已存在，请勿重复提交' });
  }

  if (err.code === '23503') {
    return res.status(400).json({ error: '关联数据不存在' });
  }

  if (err.code === '23514') {
    return res.status(400).json({ error: '数据校验失败，字段值不符合约束' });
  }

  // 未知错误
  res.status(500).json({ error: '服务器内部错误' });
}

module.exports = errorHandler;
