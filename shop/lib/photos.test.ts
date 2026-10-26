import { afterEach, describe, expect, it } from "vitest";
import { cloudName, photo } from "./photos";

const saved = { url: process.env.CLOUDINARY_URL, name: process.env.CLOUDINARY_CLOUD_NAME };
afterEach(() => {
  if (saved.url === undefined) delete process.env.CLOUDINARY_URL;
  else process.env.CLOUDINARY_URL = saved.url;
  if (saved.name === undefined) delete process.env.CLOUDINARY_CLOUD_NAME;
  else process.env.CLOUDINARY_CLOUD_NAME = saved.name;
});

describe("photo()", () => {
  it("ใช้ไฟล์ในเครื่องเมื่อไม่ได้ตั้ง Cloudinary", () => {
    delete process.env.CLOUDINARY_URL;
    delete process.env.CLOUDINARY_CLOUD_NAME;
    expect(cloudName()).toBeUndefined();
    expect(photo("rose-bouquet")).toBe("/photos/rose-bouquet.jpg");
  });

  it("ใช้ลิงก์ Cloudinary เมื่อมี CLOUDINARY_URL (ไม่รั่ว API secret)", () => {
    delete process.env.CLOUDINARY_CLOUD_NAME;
    process.env.CLOUDINARY_URL = "cloudinary://123456:SECRETSECRET@demo-cloud";
    const url = photo("rose-bouquet");
    expect(url).toBe("https://res.cloudinary.com/demo-cloud/image/upload/f_auto,q_auto/maison-fleur/seed/rose-bouquet");
    expect(url).not.toContain("SECRET");
  });

  it("CLOUDINARY_CLOUD_NAME ใช้แทนได้", () => {
    delete process.env.CLOUDINARY_URL;
    process.env.CLOUDINARY_CLOUD_NAME = "my-cloud";
    expect(photo("x")).toContain("/my-cloud/image/upload/");
  });
});
