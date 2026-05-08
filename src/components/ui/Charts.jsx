import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, CartesianGrid, AreaChart, Area,
} from 'recharts';

// Shared theme tokens for charts
export const CHART_COLORS = {
  cyan:   '#13c6c3',  // teal
  green:  '#34d399',
  amber:  '#fbbf24',
  red:    '#fb7185',
  purple: '#7c3aed',
  blue:   '#60a5fa',
  pink:   '#f472b6',
  slate:  '#cbd5e1',
  lavender: '#e9e4ff',
};

const PALETTE = [
  CHART_COLORS.cyan,
  CHART_COLORS.purple,
  CHART_COLORS.lavender,
  CHART_COLORS.green,
  CHART_COLORS.blue,
  CHART_COLORS.pink,
  CHART_COLORS.amber,
  CHART_COLORS.red,
  CHART_COLORS.slate,
];

const axisStyle = { stroke: '#475569', fontSize: 11 };

function ChartTooltip({ active, label, payload, labelFormatter }) {
  if (!active || !payload?.length) return null;
  const labelText = labelFormatter ? labelFormatter(label) : label;
  return (
    <div className="chart-tooltip">
      {labelText != null && labelText !== '' && <div className="chart-tooltip__label">{labelText}</div>}
      {payload.map((p) => (
        <div key={p.dataKey || p.name} className="chart-tooltip__row">
          <div className="chart-tooltip__name">
            <span className="chart-tooltip__dot" style={{ background: p.color || p.fill || 'var(--accent)' }} />
            <span>{p.name}</span>
          </div>
          <div className="chart-tooltip__value">{p.value}</div>
        </div>
      ))}
    </div>
  );
}

function ChartLegend({ payload }) {
  if (!payload?.length) return null;
  return (
    <div className="chart-legend">
      {payload.map((p) => (
        <div key={p.value} className="chart-legend__item">
          <span className="chart-legend__swatch" style={{ background: p.color }} />
          <span>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Wrapper card for any chart, with title + subtitle + optional empty state.
 */
export function ChartCard({ title, subtitle, children, height = 240, empty }) {
  return (
    <div className="card">
      <div className="chart-head">
        <div className="card-title">{title}</div>
        {subtitle && <div className="card-subtitle">{subtitle}</div>}
      </div>
      {empty ? (
        <div className="chart-empty" style={{ height }}>{empty}</div>
      ) : (
        <div className="chart-wrap" style={{ height }}>{children}</div>
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
          content={<ChartTooltip labelFormatter={formatX} />}
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
          content={<ChartTooltip labelFormatter={formatX} />}
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
          content={<ChartTooltip />}
          cursor={{ fill: 'rgba(34,211,238,0.08)' }}
        />
        {multiKeys ? (
          <>
            <Legend content={<ChartLegend />} />
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
export function PieBreakdown({ data, colors = PALETTE, innerRadius = 58, outerRadius = 86, centerLabel = 'Total' }) {
  const total = Array.isArray(data) ? data.reduce((sum, d) => sum + (Number(d.value) || 0), 0) : 0;
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
          paddingAngle={3}
          cornerRadius={999}
          startAngle={90}
          endAngle={-270}
          stroke="rgba(255,255,255,0.95)"
          strokeWidth={6}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
        </Pie>
        {/* Center label */}
        <text x="50%" y="48%" textAnchor="middle" dominantBaseline="middle" className="pie-center__value">
          {total}
        </text>
        <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" className="pie-center__label">
          {centerLabel}
        </text>

        <Tooltip content={<ChartTooltip />} />
        <Legend content={<ChartLegend />} />
      </PieChart>
    </ResponsiveContainer>
  );
}
