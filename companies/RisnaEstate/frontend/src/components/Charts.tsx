/**
 * Chart Components - Recharts-based
 */
import { ResponsiveContainer, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart as RechartsPieChart, Pie, Cell, LineChart as RechartsLineChart, Line } from 'recharts';

const COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

// Bar Chart
export function BarChart({ data, dataKey, xAxisKey, height = 300 }: {
  data: any[];
  dataKey: string;
  xAxisKey: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xAxisKey} />
        <YAxis />
        <Tooltip />
        <Bar dataKey={dataKey} fill="#0ea5e9" radius={[4, 4, 0, 0]} />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}

// Pie Chart
export function DonutChart({ data, nameKey, dataKey, height = 300 }: {
  data: any[];
  nameKey: string;
  dataKey: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={5}
          dataKey={dataKey}
          label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}

// Line Chart
export function LineChartComponent({ data, dataKeys, height = 300 }: {
  data: any[];
  dataKeys: string[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        {dataKeys.map((key, i) => (
          <Line key={key} type="monotone" dataKey={key} stroke={COLORS[i]} strokeWidth={2} dot={{ r: 4 }} />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}

// Sparkline (mini chart)
export function Sparkline({ data, color = '#0ea5e9' }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((v - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox="0 0 100 100" className="w-full h-8">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
