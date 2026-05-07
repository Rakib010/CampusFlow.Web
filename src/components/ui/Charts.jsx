import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, CartesianGrid, AreaChart, Area,
} from 'recharts';

// Shared theme tokens for charts
export const CHART_COLORS = {
  cyan:   '#22d3ee',
  green:  '#4ade80',
  amber:  '#fbbf24',
  red:    '#f87171',
  purple: '#c084fc',
  blue:   '#60a5fa',
  pink:   '#f472b6',
  slate:  '#94a3b8',
};

const PALETTE = [
  CHART_COLORS.cyan,
  CHART_COLORS.green,
  CHART_COLORS.amber,
  CHART_COLORS.purple,
  CHART_COLORS.pink,
  CHART_COLORS.blue,
  CHART_COLORS.red,
  CHART_COLORS.slate,
];

const tooltipStyle = {
  background: 'rgba(15,23,42,0.95)',
  border: '1px solid rgba(34,211,238,0.3)',
  borderRadius: 8,
  padding: 10,
  color: '#f1f5f9',
  fontSize: 12,
  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
};

const axisStyle = { stroke: '#475569', fontSize: 11 };

/**
 * Wrapper card for any chart, with title + subtitle + optional empty state.
 */
export function ChartCard({ title, subtitle, children, height = 240, empty }) {
  return (
    <div className="card">
      <div style={{ marginBottom: 14 }}>
        <div className="card-title" style={{ marginBottom: subtitle ? 2 : 0 }}>{title}</div>
        {subtitle && <div className="card-subtitle">{subtitle}</div>}
      </div>
      {empty ? (
        <div style={{
          height,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-muted)', fontSize: 13,
        }}>
          {empty}
        </div>
      ) : (
        <div style={{ height, width: '100%' }}>{children}</div>
      )}
    </div>
  );
}

/**
 * Line chart — time-series over months/weeks.
 * data: [{ x, y }] or whatever; pass dataKey + xKey.
 */
export function LineTrend({ data, xKey = 'x', yKey = 'y', color = CHART_COLORS.cyan, formatX, valueLabel }) {
  return (
    <ResponsiveContainer>
      <LineChart data={data} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
        <XAxis dataKey={xKey} {...axisStyle} tickFormatter={formatX} />
        <YAxis {...axisStyle} />
        <Tooltip
          contentStyle={tooltipStyle}
          labelFormatter={formatX}
          formatter={(v) => [v, valueLabel || yKey]}
          cursor={{ stroke: 'rgba(34,211,238,0.2)' }}
        />
        <Line
          type="monotone"
          dataKey={yKey}
          stroke={color}
          strokeWidth={2.5}
          dot={{ r: 3, fill: color }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

/**
 * Area chart — like LineTrend but with fill, good for cumulative or volume-style metrics.
 */
export function AreaTrend({ data, xKey = 'x', yKey = 'y', color = CHART_COLORS.cyan, formatX, valueLabel }) {
  return (
    <ResponsiveContainer>
      <AreaChart data={data} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.5} />
            <stop offset="100%" stopColor={color} stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
        <XAxis dataKey={xKey} {...axisStyle} tickFormatter={formatX} />
        <YAxis {...axisStyle} />
        <Tooltip
          contentStyle={tooltipStyle}
          labelFormatter={formatX}
          formatter={(v) => [v, valueLabel || yKey]}
          cursor={{ stroke: 'rgba(34,211,238,0.2)' }}
        />
        <Area type="monotone" dataKey={yKey} stroke={color} strokeWidth={2.5} fill={`url(#grad-${color})`} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/**
 * Vertical bar chart — categorical comparisons.
 */
export function BarSeries({ data, xKey = 'x', yKey = 'y', color = CHART_COLORS.cyan, valueLabel, multiKeys }) {
  return (
    <ResponsiveContainer>
      <BarChart data={data} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
        <XAxis dataKey={xKey} {...axisStyle} interval={0} tick={{ ...axisStyle, fontSize: 10 }} />
        <YAxis {...axisStyle} />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(v) => [v, valueLabel || yKey]}
          cursor={{ fill: 'rgba(34,211,238,0.08)' }}
        />
        {multiKeys ? (
          <>
            <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
            {multiKeys.map((k, i) => (
              <Bar key={k.key} dataKey={k.key} fill={k.color || PALETTE[i % PALETTE.length]} radius={[4, 4, 0, 0]} name={k.label || k.key} />
            ))}
          </>
        ) : (
          <Bar dataKey={yKey} fill={color} radius={[4, 4, 0, 0]} />
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}

/**
 * Pie chart — proportions. data: [{ name, value }]
 */
export function PieBreakdown({ data, colors = PALETTE, innerRadius = 50, outerRadius = 80 }) {
  return (
    <ResponsiveContainer>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={2}
          stroke="rgba(15,23,42,0.6)"
          strokeWidth={2}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
        <Legend
          wrapperStyle={{ fontSize: 11, color: '#94a3b8' }}
          formatter={(v, e) => `${v} (${e.payload.value})`}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
