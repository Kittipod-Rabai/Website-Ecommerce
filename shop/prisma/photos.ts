// รูปถ่ายประกอบสินค้า (Unsplash — ใช้ฟรี) ตำแหน่งแรก = รูปหลัก ที่เหลือ = รูปแกลเลอรี
export const PRODUCT_PHOTOS: Record<string, string[]> = {
  "rouge-eternel": ["red-vase", "dark-bloom", "gerbera"],
  "blush-garden": ["pink-wrap", "pink-peonies", "peony-vase"],
  "blanc-pur": ["white-wrap", "white-poppies", "peach-white"],
  "soleil-d-ete": ["sunflowers", "sunflower-vase", "sunflower-hand"],
  "lavande-reve": ["lavender-vase", "lavender-linen", "lavender-bunch"],
  "peche-douce": ["peach-bouquet", "peach-white", "dried-peach"],
  "jardin-sauvage": ["wild-bouquet", "rose-bouquet", "ranunculus"],
  "cent-roses": ["gerbera", "red-vase", "dark-bloom"],
  "rose-poudree": ["pink-peonies", "peony-single", "pink-wrap"],
  "panier-blanc": ["peach-white", "white-wrap", "white-poppies"],
  "panier-printemps": ["sunflower-mix", "ranunculus", "tulips-market"],
  "panier-dore": ["sunflower-wrap", "sunflower-hand", "sunflowers"],
  "vase-silence": ["white-poppies", "white-wrap", "peach-white"],
  "vase-orchidee": ["lavender-bunch", "lavender-vase", "lavender-dried"],
  "vase-tulipe": ["tulip-vase", "tulips-market", "peony-vase"],
  "vase-pivoine": ["peony-single", "pink-peonies", "peony-vase"],
  "sec-dore": ["dried-peach", "peach-bouquet", "peach-white"],
  "sec-lavande": ["lavender-dried", "lavender-linen", "lavender-vase"],
  "sec-neige": ["white-wrap", "peach-white", "white-poppies"],
  "mille-fleurs": ["rose-bouquet", "sunflower-mix", "wild-bouquet"],
};

export { photo as photoUrl } from "../lib/photos";
