"use client";

/** ปุ่มส่งฟอร์มที่ถามยืนยันก่อน ใช้กับการลบข้อมูล */
export function ConfirmButton({
  message,
  className,
  children,
  ...props
}: { message: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
