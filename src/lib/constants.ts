export const SECTORS = [
  "Teknoloji",
  "E-ticaret",
  "Finans",
  "Sağlık",
  "Eğitim",
  "Gayrimenkul",
  "Üretim",
  "Gıda",
  "Turizm",
  "Medya",
  "Lojistik",
  "Danışmanlık",
  "Diğer",
] as const;

export const CITIES = [
  "İstanbul",
  "Ankara",
  "İzmir",
  "Bursa",
  "Antalya",
  "Adana",
  "Konya",
  "Gaziantep",
  "Kayseri",
  "Eskişehir",
  "Trabzon",
  "Diğer",
] as const;

export const ENTREPRENEURSHIP_STATUSES = [
  "Fikir aşamasında",
  "Yeni başladım",
  "Aktif girişimci",
  "Ölçekleniyorum",
  "Yatırımcı",
  "Profesyonel / Çalışan",
  "Öğrenci",
] as const;

export const OPPORTUNITY_CATEGORIES = [
  "Ortak Arıyorum",
  "Yatırım Arıyorum",
  "Yatırımcı Arıyorum",
  "İş Ortağı Arıyorum",
  "Ekip Arkadaşı Arıyorum",
  "Proje",
  "Diğer",
] as const;

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function formatDateTime(value: string) {
  return new Date(value).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "az önce";
  if (min < 60) return `${min} dk önce`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours} sa önce`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} gün önce`;
  return formatDate(value);
}
