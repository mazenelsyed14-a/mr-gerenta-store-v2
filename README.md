# 👑 متجر mr.gerenta الفاخر (MR. GERENTA STORE)
متجر إلكتروني متكامل للساعات الأصلية والعطور الفاخرة مع لوحة تحكم خاصة بالمالك، سلة مشتريات تفاعلية، وربط كامل مع واتساب لإتمام الطلبات بضغطة زر. جاهز للنشر السحابي المجاني 24/7 على **Vercel**.

---

## 📁 هيكل المشروع (Project Structure)

```text
mr-gerenta-store/
│── api/
│   └── index.js           # نقطة تشغيل دوال Vercel Serverless
│
│── backend/
│   ├── server.js          # خادم Express وواجهات الـ API
│   ├── auth.js            # إعدادات المصادقة وحماية لوحة المالك
│   ├── package.json       # تبعيات ومكتبات الباك إند
│   ├── products.json      # قاعدة بيانات المنتجات (JSON)
│   └── upload/            # مجلد حفظ صور المنتجات المرفوعة
│
│── frontend/
│   ├── index.html         # الواجهة الرئيسية للمتجر (العرض + السلة + واتساب)
│   ├── product.css        # التنسيقات الفاخرة لواجهة المتجر (Dark Luxury Theme)
│   ├── admin.html         # لوحة تحكم المالك (تسجيل الدخول + إضافة وحذف المنتجات)
│   └── admin.css          # تنسيقات لوحة التحكم
│
├── package.json           # ملف الحزم الرئيسي للنشر السحابي
├── vercel.json            # إعدادات التوجيه والنشر على Vercel
├── .gitignore             # تجاهل الملفات المؤقتة و node_modules
├── start.bat              # تشغيل محلي بضغطة زر
└── README.md              # دليل الاستخدام والنشر أونلاين
```

---

## 🌐 النشر المباشر على Vercel (1-Click Deploy)

يمكنك نشر المتجر بضغطة زر واحدة مجاناً من خلال الرابط التالي:  
👉 **[نشر المتجر الآن على Vercel](https://vercel.com/new/clone?repository-url=https://github.com/mazenelsyed14-a/mr-gerenta-store)**

1. سجل الدخول بحساب GitHub الخاص بك (`mazenelsyed14-a`).
2. اضغط على الزر **Deploy**.
3. خلال 30 ثانية سيعطيك Vercel الرابط الدائم الخاص بمتجرك (مثال: `https://mr-gerenta-store.vercel.app`).

---

## 🔑 بيانات تسجيل دخول المالك (Admin Credentials)

- **اسم المستخدم:** `mohamedesslam1`
- **كلمة المرور:** `mohamedesslam273`

---

## 💻 طريقة التشغيل محلياً على جهازك (Local Run)

1. اضغط مرتين على ملف `start.bat`.
2. أو من التيرمينال:
   ```bash
   cd backend
   npm install
   node server.js
   ```
3. افتح المتصفح على: `http://localhost:3000`
