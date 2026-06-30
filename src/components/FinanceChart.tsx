import {
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from 'recharts';

import { formatMoney } from '../utils/format';

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
}

interface Props {
  monthlyData: MonthlyData[];
}

type TooltipPayload = {
  name: string;
  value: number;
  color: string;
};

type CustomTooltipProps = {
  active?: boolean;
  label?: string;
  payload?: TooltipPayload[];
};

function CustomTooltip({
  active,
  label,
  payload,
}: CustomTooltipProps) {
  if (
    !active ||
    !payload ||
    payload.length === 0
  ) {
    return null;
  }

  return (
    <div className="chart-tooltip">
      <span className="chart-tooltip-label">
        {label}
      </span>

      {payload.map((item) => (
        <div
          key={item.name}
          className="chart-tooltip-row"
        >
          <span
            className="chart-tooltip-dot"
            style={{
              backgroundColor: item.color,
            }}
          />

          <span className="chart-tooltip-name">
            {item.name}
          </span>

          <strong>
            {formatMoney(item.value)}
          </strong>
        </div>
      ))}
    </div>
  );
}

export default function FinanceChart({
  monthlyData,
}: Props) {
  const hasData =
    monthlyData.length > 0 &&
    monthlyData.some(
      (item) =>
        item.income > 0 ||
        item.expense > 0,
    );

  if (!hasData) {
    return (
      <div className="chart-empty-state">
        <strong>
          Sem dados financeiros
        </strong>

        <span>
          Cadastre receitas ou despesas para visualizar a evolução.
        </span>
      </div>
    );
  }

  return (
    <div className="chart-wrapper">
      <ResponsiveContainer>
        <AreaChart
          data={monthlyData}
          margin={{
            top: 20,
            right: 18,
            left: 0,
            bottom: 8,
          }}
        >
          <defs>
            <linearGradient
              id="incomeGradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="5%"
                stopColor="#22c55e"
                stopOpacity={0.28}
              />

              <stop
                offset="95%"
                stopColor="#22c55e"
                stopOpacity={0}
              />
            </linearGradient>

            <linearGradient
              id="expenseGradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="5%"
                stopColor="#ef4444"
                stopOpacity={0.26}
              />

              <stop
                offset="95%"
                stopColor="#ef4444"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            opacity={0.08}
            vertical={false}
          />

          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{
              fontSize: 12,
            }}
            dy={10}
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{
              fontSize: 12,
            }}
            tickFormatter={(value) =>
              `R$ ${value}`
            }
          />

          <Tooltip
            content={
              <CustomTooltip />
            }
          />

          <Area
            type="monotone"
            dataKey="income"
            stroke="#22c55e"
            strokeWidth={4}
            fill="url(#incomeGradient)"
            name="Receitas"
            dot={{
              r: 4,
              strokeWidth: 2,
            }}
            activeDot={{
              r: 7,
              strokeWidth: 2,
            }}
          />

          <Area
            type="monotone"
            dataKey="expense"
            stroke="#ef4444"
            strokeWidth={4}
            fill="url(#expenseGradient)"
            name="Despesas"
            dot={{
              r: 4,
              strokeWidth: 2,
            }}
            activeDot={{
              r: 7,
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}