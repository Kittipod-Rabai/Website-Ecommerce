"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Point = { date: string; revenue: number; orders: number };

const short = (d: string) => `${Number(d.slice(8, 10))}/${Number(d.slice(5, 7))}`;

export function RevenueChart({ data }: { data: Point[] }) {
  return (
    <div className="h-72 w-full" role="img" aria-label="กราฟรายได้ 30 วันล่าสุด">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#7a1f36" stopOpacity={0.35} />
              <stop offset="1" stopColor="#7a1f36" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(15,13,14,0.08)" vertical={false} />
          <XAxis dataKey="date" tickFormatter={short} tick={{ fontSize: 11, fill: "#7d7471" }} tickLine={false} axisLine={false} interval={4} />
          <YAxis tick={{ fontSize: 11, fill: "#7d7471" }} tickLine={false} axisLine={false} width={48} tickFormatter={(v) => `${v / 1000}k`} />
          <Tooltip
            formatter={(v) => [`฿${Number(v).toLocaleString("th-TH")}`, "รายได้"]}
            labelFormatter={(l) => `วันที่ ${short(String(l))}`}
            contentStyle={{ border: "1px solid rgba(15,13,14,0.12)", borderRadius: 0, fontSize: 12 }}
          />
          <Area type="monotone" dataKey="revenue" stroke="#7a1f36" strokeWidth={2} fill="url(#rev)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
