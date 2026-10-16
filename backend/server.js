// server.js - الخادم الرئيسي لمتجر mr.gerenta
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const session = require("express-session");
const { ADMIN_CONFIG, verifyCredentials, onlyOwner } = require("./auth");

const app = express();
const PORT = process.env.PORT || 3000;
const IS_VERCEL = !!process.env.VERCEL;
const ORIGINAL_DB = path.join(__dirname, "products.json");
const DB_FILE = IS_VERCEL ? path.join("/tmp", "products.json") : ORIGINAL_DB;
const UPLOAD_DIR = IS_VERCEL ? path.join("/tmp", "upload") : path.join(__dirname, "upload");

// التأكد من وجود مجلد رفع الصور ومجلد قاعدة البيانات
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// قراءة المنتجات بأمان
function loadProducts() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      let initialData = [];
      if (fs.existsSync(ORIGINAL_DB)) {
        try {
          initialData = JSON.parse(fs.readFileSync(ORIGINAL_DB, "utf8"));
        } catch (e) {}
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), "utf8");
      return initialData;
    }
    const data = fs.readFileSync(DB_FILE, "utf8");
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("خطأ أثناء قراءة ملف المنتجات:", error);
    return [];
  }
}

// حفظ المنتجات بأمان
function saveProducts(products) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(products, null, 2), "utf8");
    return true;
  } catch (error) {
    console.error("خطأ أثناء حفظ المنتجات:", error);
    return false;
  }
}

// إعدادات CORS للسماح بالاتصال من أي مسار محلي
app.use(
  cors({
    origin: (origin, callback) => {
      // السماح بجميع المنافذ المحلية أو ملفات المتصفح المحلية
      callback(null, true);
    },
    credentials: true
  })
);

// معالجة البيانات من نوع JSON و Form Data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// خدمة ملفات الصور المرفوعة
app.use("/upload", express.static(UPLOAD_DIR));

// دعم البروكسي عند النشر على منصات مثل Render أو Vercel
app.set("trust proxy", 1);

// خدمة ملفات الواجهة الأمامية مباشرة من مجلد frontend
const FRONTEND_DIR = path.join(__dirname, "../frontend");
if (fs.existsSync(FRONTEND_DIR)) {
  app.use(express.static(FRONTEND_DIR));
  app.get("/", (req, res) => res.sendFile(path.join(FRONTEND_DIR, "index.html")));
  app.get("/admin", (req, res) => res.sendFile(path.join(FRONTEND_DIR, "admin.html")));
}

// إعداد الجلسات (Sessions)
app.use(
  session({
    secret: ADMIN_CONFIG.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // يوم كامل
      httpOnly: true,
      sameSite: "lax",
      secure: false
    }
  })
);

// إعداد تخزين الصور بواسطة Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // استخراج الامتداد الأصلي وتنظيف الاسم
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanName = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, "_");
    cb(null, `${Date.now()}-${cleanName}${ext}`);
  }
});

// فلتر لفحص نوع الملف (صور فقط)
const fileFilter = (req, file, cb) => {
  const allowedMime = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/jpg"];
  if (allowedMime.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("يُسمح فقط برفع ملفات الصور (JPG, PNG, WEBP, GIF)"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // حد أقصى 5 ميجابايت
});

// ======================= المسارات (API Routes) ======================= //

// 1) فحص حالة تسجيل الدخول الحالية
app.get("/check-auth", (req, res) => {
  if (req.session && req.session.owner) {
    return res.json({ authenticated: true, user: "admin" });
  }
  return res.json({ authenticated: false });
});

// 2) تسجيل دخول المالك
app.post("/login", (req, res) => {
  const user = req.body.user || req.query.user;
  const pass = req.body.pass || req.query.pass;

  if (verifyCredentials(user, pass)) {
    req.session.owner = true;
    return res.json({
      success: true,
      message: "تم تسجيل الدخول بنجاح"
    });
  }

  return res.status(401).json({
    success: false,
    message: "خطأ في اسم المستخدم أو كلمة المرور"
  });
});

// 3) تسجيل خروج المالك
app.post("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ success: false, message: "فشل تسجيل الخروج" });
    }
    res.clearCookie("connect.sid");
    return res.json({ success: true, message: "تم تسجيل الخروج بنجاح" });
  });
});

// 4) جلب كل المنتجات للمتجر
app.get("/products", (req, res) => {
  const products = loadProducts();
  res.json(products);
});

// 5) إضافة منتج جديد (خاص بالمالك)
app.post("/add", onlyOwner, upload.single("image"), (req, res) => {
  try {
    const { name, price, category, description, imageUrl } = req.body;

    if (!name || !price) {
      return res.status(400).json({
        success: false,
        message: "اسم المنتج والسعر حقول مطلوبة"
      });
    }

    let imageWebPath = "";
    if (req.file) {
      // تجهيز مسار الصورة المرفوعة محلياً
      imageWebPath = "upload/" + req.file.filename;
    } else if (imageUrl && imageUrl.trim()) {
      // استخدام رابط الصورة المباشر
      imageWebPath = imageUrl.trim();
    } else {
      return res.status(400).json({
        success: false,
        message: "يرجى اختيار صورة للمنتج أو وضع رابط صورة مباشر"
      });
    }

    const newProduct = {
      id: Date.now().toString(),
      name: name.trim(),
      price: Number(price),
      category: category ? category.trim() : "ساعات",
      description: description ? description.trim() : "",
      image: imageWebPath,
      createdAt: new Date().toISOString()
    };

    products.unshift(newProduct); // إضافة في البداية ليظهر أحدث منتج أولاً
    saveProducts(products);

    res.json({
      success: true,
      message: "تم إضافة المنتج بنجاح إلى المتجر!",
      product: newProduct
    });
  } catch (err) {
    console.error("خطأ أثناء إضافة المنتج:", err);
    res.status(500).json({
      success: false,
      message: "حدث خطأ غير متوقع أثناء حفظ المنتج"
    });
  }
});

// 6) حذف منتج (خاص بالمالك)
app.delete("/products/:id", onlyOwner, (req, res) => {
  try {
    const productId = req.params.id;
    let products = loadProducts();

    const productToDelete = products.find(p => p.id === productId);
    if (!productToDelete) {
      return res.status(404).json({
        success: false,
        message: "المنتج غير موجود"
      });
    }

    // حذف ملف الصورة من السيرفر إذا كان موجوداً
    if (productToDelete.image && productToDelete.image.startsWith("upload/")) {
      const filePath = path.join(__dirname, productToDelete.image);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.warn("تعذر حذف ملف الصورة:", e.message);
        }
      }
    }

    // تصفية المصفوفة
    products = products.filter(p => p.id !== productId);
    saveProducts(products);

    res.json({
      success: true,
      message: "تم حذف المنتج بنجاح"
    });
  } catch (err) {
    console.error("خطأ أثناء حذف المنتج:", err);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء حذف المنتج"
    });
  }
});

// معالجة أخطاء Multer العامة
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ success: false, message: `خطأ في رفع الملف: ${err.message}` });
  } else if (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next();
});

// تشغيل السيرفر
if (!process.env.VERCEL) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`====================================================`);
    console.log(`🚀 خادم متجر mr.gerenta يعمل بنجاح!`);
    console.log(`🌐 واجهة المتجر:       http://localhost:${PORT}`);
    console.log(`👑 لوحة تحكم المالك:  http://localhost:${PORT}/admin.html`);
    console.log(`====================================================`);
  });
}

module.exports = app;
