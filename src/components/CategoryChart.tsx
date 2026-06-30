import { useState } from 'react';

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';

import { formatMoney } from '../utils/format';

interface CategoryData {
  category: string;
  value: number;
}

interface Props {
  data: CategoryData[];
}

type TooltipPayload = {
  name: string;
  value: number;
  color: string;
};

type CustomTooltipProps = {
  active?: boolean;
  payload?: TooltipPayload[];
};

const COLORS = [
  '#22c55e',
  '#3b82f6',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
  '#84cc16',
];

function CustomTooltip({
  active,
  payload,
}: CustomTooltipProps) {
  if (
    !active ||
    !payload ||
    payload.length === 0
  ) {
    return null;
  }

  const item = payload[0];

  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-row">
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
    </div>
  );
}

export default function CategoryChart({
  data,
}: Props) {
  const [activeIndex, setActiveIndex] =
    useState<number | null>(null);

  const total = data.reduce(
    (acc, item) => acc + item.value,
    0,
  );

  return (
    <div className="chart-wrapper category-chart-wrapper">
      <div className="category-chart-center">
        <span>Total</span>

        <strong>
          {formatMoney(total)}
        </strong>
      </div>

      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="category"
            cx="50%"
            cy="48%"
            innerRadius={72}
            outerRadius={120}
            paddingAngle={5}
            labelLine={false}
            cornerRadius={8}
            onMouseLeave={() =>
              setActiveIndex(null)
            }
          >
            {data.map((_, index) => {
              const isActive =
                activeIndex === index;

              return (
                <Cell
                  key={index}
                  fill={
                    COLORS[
                      index %
                        COLORS.length
                    ]
                  }
                  stroke={
                    isActive
                      ? '#ffffff'
                      : 'rgba(255,255,255,0.72)'
                  }
                  strokeWidth={
                    isActive ? 4 : 2
                  }
                  opacity={
                    activeIndex === null ||
                    isActive
                      ? 1
                      : 0.45
                  }
                  style={{
                    filter: isActive
                      ? 'drop-shadow(0 8px 14px rgba(0,0,0,0.22))'
                      : 'none',
                    transition:
                      'opacity 0.2s ease, filter 0.2s ease, stroke-width 0.2s ease',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={() =>
                    setActiveIndex(
                      index,
                    )
                  }
                />
              );
            })}
          </Pie>

          <Tooltip
            content={
              <CustomTooltip />
            }
          />

          <Legend
            verticalAlign="bottom"
            iconType="circle"
            wrapperStyle={{
              paddingTop: 18,
              fontSize: 12,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}