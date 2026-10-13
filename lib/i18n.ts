import type { Locale } from "@/lib/types";

const dictionaries = {
  en: {
    today: "Today", pages: "Pages", newPage: "New page", settings: "Settings", history: "History", statistics: "Statistics",
    thisWeek: "This week", complete: "Completed", missed: "Missed", pending: "Pending", addBlock: "Add block", emptyToday: "Nothing scheduled today.",
    noPages: "You don’t have any pages yet.", firstPage: "Create your first page", enableReminders: "Enable reminders so we can notify you when a task is due.",
    enable: "Enable", report: "Weekly report", edit: "Edit", duplicate: "Duplicate", delete: "Delete", language: "Language", timezone: "Timezone",
    weekStarts: "Week starts on", theme: "Theme", signOut: "Sign out", search: "Search routines…", currentWeek: "Current week", save: "Save",
  },
  ar: {
    today: "اليوم", pages: "الصفحات", newPage: "صفحة جديدة", settings: "الإعدادات", history: "السجل", statistics: "الإحصائيات",
    thisWeek: "هذا الأسبوع", complete: "مكتمل", missed: "فائت", pending: "قيد الانتظار", addBlock: "إضافة كتلة", emptyToday: "لا توجد مهام اليوم.",
    noPages: "ليس لديك صفحات بعد.", firstPage: "أنشئ صفحتك الأولى", enableReminders: "فعّل التذكيرات لنرسل لك إشعاراً عند موعد المهمة.",
    enable: "تفعيل", report: "تقرير أسبوعي", edit: "تعديل", duplicate: "نسخ", delete: "حذف", language: "اللغة", timezone: "المنطقة الزمنية",
    weekStarts: "بداية الأسبوع", theme: "المظهر", signOut: "تسجيل الخروج", search: "ابحث في الروتين…", currentWeek: "الأسبوع الحالي", save: "حفظ",
  },
} as const;

export function dictionary(locale: Locale) { return dictionaries[locale]; }
