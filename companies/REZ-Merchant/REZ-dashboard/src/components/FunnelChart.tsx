'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Funnel,
  FunnelChart,
  LabelList,
} from 'recharts';
import { funnelData } from '@/lib/mock-data';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      name: string;
      value: number;
      fill: string;
    };
  }>;
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const prevValue = funnelData[funnelData.findIndex((d) => d.name === data.name) - 1]?.value;
    const conversionRate = prevValue ? ((data.value / prevValue) * 100).toFixed(1) : '100';

    return (
      <div className="bg-dark-100 border border-slate-700 rounded-lg p-3 shadow-xl">
        <p className="text-white font-medium">{data.name}</p>
        <p className="text-primary-400 text-lg font-bold">{data.value.toLocaleString()}</p>
        <p className="text-slate-400 text-sm">Conversion: {conversionRate}%</p>
      </div>
    );
  }
  return null;
};

export default function FunnelChartComponent() {
  const data = funnelData.map((item, index) => ({
    ...item,
    conversionRate:
      index === 0
        ? 100
        : ((item.value / funnelData[index - 1].value) * 100).toFixed(1),
  }));

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <FunnelChart>
          <Tooltip content={<CustomTooltip />} />
          <Funnel
            dataKey="value"
            data={data}
            isAnimationActive
            animationDuration={1000}
            animationEasing="ease-out"
          >
            <LabelList
              position="right"
              fill="#f8fafc"
              stroke="none"
              dataKey="name"
              className="text-sm"
            />
            <LabelList
              position="center"
              fill="#f8fafc"
              stroke="none"
              dataKey="value"
              formatter={(val: number) => val.toLocaleString()}
              className="text-xs"
            />
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Funnel>
        </FunnelChart>
      </ResponsiveContainer>

      {/* Conversion rates below */}
      <div className="grid grid-cols-4 gap-2 mt-4">
        {data.slice(1).map((stage, index) => (
          <div key={stage.name} className="text-center">
            <p className="text-slate-500 text-xs">{data[index].name}</p>
            <p className="text-primary-400 text-sm font-medium">
              {stage.conversionRate}%
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
