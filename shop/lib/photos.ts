/**
 * ที่อยู่รูปถ่ายประกอบร้าน (รูปในโฟลเดอร์ public/photos)
 *  - ตั้ง CLOUDINARY_URL (หรือ CLOUDINARY_CLOUD_NAME) แล้ว → ใช้รูปจาก Cloudinary
 *    (ต้องอัปโหลดก่อนด้วย `npm run photos:upload`)
 *  - ไม่ได้ตั้ง → ใช้ไฟล์ในเครื่อง /photos/<ชื่อ>.jpg (เครื่องพัฒนาไม่ต้องมีบัญชี Cloudinary)
 * ไฟล์นี้ไม่ import อะไรจากโปรเจกต์ เพื่อให้ seed และหน้าเว็บเรียกใช้ร่วมกันได้
 */
export const CLOUDINARY_FOLDER = "maison-fleur/seed";

export function cloudName(): string | undefined {
  const explicit = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  if (explicit) return explicit;
  return process.env.CLOUDINARY_URL?.match(/^cloudinary:\/\/[^:]+:[^@]+@(.+)$/)?.[1]?.trim();
}

/** `name` คือชื่อไฟล์ไม่มีนามสกุล เช่น "rose-bouquet" */
export function photo(name: string): string {
  const cloud = cloudName();
  return cloud
    ? `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto/${CLOUDINARY_FOLDER}/${name}`
    : `/photos/${name}.jpg`;
}
