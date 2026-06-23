"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DailyCount } from "@/lib/types";

export default function ConversationsChart({ data }: { data: DailyCount[] }) {
  const isEmpty = data.every((d) => d.count === 0);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-medium text-slate-500">
        Conversas por dia (últimos 14 dias)
      </h2>

      <div className="relative mt-4 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              fontSize={12}
              stroke="#94a3b8"
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              fontSize={12}
              stroke="#94a3b8"
              width={32}
            />
            <Tooltip
              cursor={{ fill: "#fce7f3" }}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                fontSize: 12,
              }}
              labelFormatter={(label) => `Dia ${label}`}
              formatter={(value: number) => [value, "conversas"]}
            />
            <Bar dataKey="count" fill="#be185d" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>

        {isEmpty && (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-slate-400">
            Sem conversas no período ainda.
          </p>
        )}
      </div>
    </div>
  );
}
