'use client';

import {
  AreaChart, Area, ResponsiveContainer,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';

export interface SentimentTrendDatum {
  date: string;
  positive: number;
  negative: number;
  count: number;
}

interface Props {
  data: SentimentTrendDatum[];
  timeRange: number;
}

export default function SentimentTrendChart({ data, timeRange }: Props) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="posGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="negGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
          axisLine={false}
          tickLine={false}
          interval={Math.floor(timeRange / 7)}
        />
        <YAxis
          tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
          axisLine={false}
          tickLine={false}
          unit="%"
        />
        <Tooltip
          contentStyle={{
            background: 'rgba(15,15,15,0.9)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
          }}
        />
        <Area type="monotone" dataKey="positive" stroke="#10b981" fill="url(#posGrad)" strokeWidth={2} name="Positive" />
        <Area type="monotone" dataKey="negative" stroke="#ef4444" fill="url(#negGrad)" strokeWidth={2} name="Negative" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
