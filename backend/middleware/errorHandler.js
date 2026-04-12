module.exports = function (err, req, res, next) {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Loi he thong',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
};