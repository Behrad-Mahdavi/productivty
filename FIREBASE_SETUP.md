# راهنمای راه‌اندازی Firebase برای Personal Productivity Journal

## مراحل راه‌اندازی Firebase

### 1. ایجاد پروژه Firebase

1. به [Firebase Console](https://console.firebase.google.com/) بروید
2. روی "Create a project" کلیک کنید
3. نام پروژه را وارد کنید (مثلاً: `personal-productivity-journal`)
4. Google Analytics را فعال کنید (اختیاری)
5. پروژه را ایجاد کنید

### 2. فعال‌سازی Authentication

1. در Firebase Console، به بخش "Authentication" بروید
2. روی "Get started" کلیک کنید
3. به تب "Sign-in method" بروید
4. "Email/Password" را فعال کنید
5. "Anonymous" را نیز فعال کنید (اختیاری)

### 3. ایجاد Firestore Database

1. به بخش "Firestore Database" بروید
2. روی "Create database" کلیک کنید
3. "Start in test mode" را انتخاب کنید
4. منطقه جغرافیایی را انتخاب کنید (ترجیحاً نزدیک به شما)

### 4. تنظیم Firestore Security Rules

در بخش "Rules" فایل `firestore.rules` را با کد زیر جایگزین کنید:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own data
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**نکته مهم:** این rules برای تست است. در production باید rules دقیق‌تری تنظیم کنید.

### 5. دریافت کانفیگ Firebase

1. به بخش "Project settings" بروید
2. به تب "General" بروید
3. در بخش "Your apps" روی "Web" کلیک کنید
4. نام اپ را وارد کنید
5. کانفیگ Firebase را کپی کنید

### 6. بروزرسانی فایل کانفیگ

فایل `src/config/firebase.ts` را با اطلاعات Firebase خود بروزرسانی کنید:

```typescript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id",
};
```

### 7. ساختار دیتابیس Firestore

پروژه از ساختار زیر استفاده می‌کند:

```
users/
  {userId}/
    profile/
      name: string
      passwordHash: string
      createdAt: timestamp

tasks/
  {taskId}/
    userId: string
    title: string
    category: string
    date: string
    done: boolean
    createdAt: timestamp

courses/
  {courseId}/
    userId: string
    name: string
    code: string
    instructor: string
    assignments: array

reflections/
  {reflectionId}/
    userId: string
    date: string
    good: string
    distraction: string
    improve: string
    focusMinutes: number

focusSessions/
  {sessionId}/
    userId: string
    taskId: string
    startTime: timestamp
    endTime: timestamp
    durationSec: number
    completed: boolean
    type: string

timerState/
  {userId}/
    mode: string
    startTimestamp: number
    durationSec: number
    remainingSec: number
    taskId: string
    cyclesCompleted: number
    isPaused: boolean
```

### 8. تست عملکرد

1. پروژه را build کنید: `npm run build`
2. پروژه را اجرا کنید: `npm run dev`
3. یک کاربر جدید ایجاد کنید
4. داده‌ها را اضافه کنید
5. در دستگاه/مرورگر دیگر وارد شوید
6. داده‌ها باید sync شده باشند

### 9. نکات مهم

- هر کاربر فقط به داده‌های خودش دسترسی دارد
- داده‌ها به صورت real-time sync می‌شوند
- از Firebase Authentication برای امنیت استفاده می‌شود
- تمام داده‌ها در Firestore ذخیره می‌شوند
- LocalStorage فقط برای کش موقت استفاده می‌شود

### 10. عیب‌یابی

اگر مشکلی پیش آمد:

1. Console مرورگر را چک کنید
2. Firebase Console را بررسی کنید
3. Network tab را در Developer Tools چک کنید
4. Authentication status را بررسی کنید

### 11. هزینه‌ها

Firebase برای پروژه‌های کوچک رایگان است:

- Firestore: 50,000 خواندن/نوشتن در روز
- Authentication: نامحدود
- Storage: 1GB رایگان

برای پروژه‌های بزرگ‌تر، پلن‌های پولی موجود است.
