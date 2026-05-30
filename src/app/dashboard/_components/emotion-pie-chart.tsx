'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export interface EmotionPieDatum {
  name: string;
  value: number;
  fill: string;
}

interface Props {
  data: EmotionPieDatum[];
}

export default function EmotionPieChart({ data }: Props) {
  return (
    <>
      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={3}>
            {data.map((entry, i) => (
              <Cell key={`${entry.name}-${i}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v) => (typeof v === 'number' ? `${v.toFixed(1)}%` : String(v))}
            contentStyle={{
              background: 'rgba(15,15,15,0.9)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <ul className="space-y-2 mt-2">
        {data.slice(0, 4).map((e) => (
          <li key={e.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span aria-hidden className="w-2.5 h-2.5 rounded-full" style={{ background: e.fill }} />
              <span className="text-foreground/80">{e.name}</span>
            </div>
            <span className="font-semibold tabular-nums">{e.value.toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </>
  );
}
