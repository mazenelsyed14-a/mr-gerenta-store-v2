// auth.js - مصادقة لوحة تحكم متجر mr.gerenta

// بيانات تسجيل دخول المالك الافتراضية
const ADMIN_CONFIG = {
  username: process.env.ADMIN_USER || "mohamedesslam1",
  password: process.env.ADMIN_PASS || "mohamedesslam273",
  sessionSecret: process.env.SESSION_SECRET || "mrgerenta_secret_key_2026_luxury"
};

// التحقق من صحة بيانات الدخول
function verifyCredentials(user, pass) {
  return user === ADMIN_CONFIG.username && pass === ADMIN_CONFIG.password;
}

// ميدلوير لحماية المسارات الخاصة بالمالك فقط
function onlyOwner(req, res, next) {
  if (req.session && req.session.owner) {
    return next();
  }
  return res.status(401).json({
    success: false,
    message: "غير مسموح - يرجى تسجيل الدخول كمالك للمتجر"
  });
}

module.exports = {
  ADMIN_CONFIG,
  verifyCredentials,
  onlyOwner
};
