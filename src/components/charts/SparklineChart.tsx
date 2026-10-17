import React, { useEffect, useRef } from 'react';
import ApexCharts from 'apexcharts';
import type { MetricPoint, ThemeAccent } from '../../types';

interface SparklineChartProps {
  data: MetricPoint[];
  color?: ThemeAccent | string;
  height?: number;
  unit?: string;
  showGradient?: boolean;
}

const colorMap: Record<ThemeAccent, string> = {
  amber: '#f59e0b',
  blue: '#3b82f6',
  emerald: '#10b981',
  rose: '#f43f5e',
  purple: '#a855f7',
  cyan: '#06b6d4',
  orange: '#f97316',
  indigo: '#6366f1',
};

export const SparklineChart: React.FC<SparklineChartProps> = React.memo(({
  data,
  color = 'blue',
  height = 55,
  unit = '',
  showGradient = true,
}) => {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartInstanceRef = useRef<ApexCharts | null>(null);
  const prevDataKeyRef = useRef<string>('');

  const hexColor = (colorMap as Record<string, string>)[color] || color;

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const seriesData = data.map((d) => ({
      x: new Date(d.time).getTime(),
      y: d.value,
    }));

    const options: ApexCharts.ApexOptions = {
      series: [
        {
          name: 'Value',
          data: seriesData,
        },
      ],
      chart: {
        type: 'area',
        height: height,
        sparkline: {
          enabled: true,
        },
        animations: {
          enabled: false,
        },
        background: 'transparent',
      },
      colors: [hexColor],
      stroke: {
        curve: 'smooth',
        width: 2.2,
      },
      fill: {
        type: showGradient ? 'gradient' : 'solid',
        gradient: {
          shade: 'dark',
          type: 'vertical',
          shadeIntensity: 0.5,
          gradientToColors: [hexColor],
          inverseColors: false,
          opacityFrom: 0.45,
          opacityTo: 0.02,
          stops: [0, 100],
        },
      },
      tooltip: {
        enabled: true,
        theme: 'dark',
        fixed: {
          enabled: false,
        },
        x: {
          show: true,
          format: 'HH:mm',
        },
        y: {
          formatter: (val) => `${val}${unit ? ` ${unit}` : ''}`,
          title: {
            formatter: () => '',
          },
        },
        marker: {
          show: false,
        },
      },
      xaxis: {
        type: 'datetime',
        crosshairs: {
          show: false,
        },
      },
      yaxis: {
        show: false,
      },
      grid: {
        show: false,
        padding: {
          left: 0,
          right: 0,
          top: 0,
          bottom: 2,
        },
      },
    };

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const chart = new ApexCharts(chartContainerRef.current, options);
    chart.render();
    chartInstanceRef.current = chart;

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [hexColor, height, showGradient, unit]);

  // Update data smoothly without re-animating/flashing when points change
  useEffect(() => {
    if (chartInstanceRef.current && data) {
      const dataKey =
        data.length > 0
          ? `${data.length}-${data[data.length - 1].time}-${data[data.length - 1].value}`
          : 'empty';

      if (dataKey === prevDataKeyRef.current) return;
      prevDataKeyRef.current = dataKey;

      const seriesData = data.map((d) => ({
        x: new Date(d.time).getTime(),
        y: d.value,
      }));

      chartInstanceRef.current.updateSeries(
        [
          {
            name: 'Value',
            data: seriesData,
          },
        ],
        false // false tells ApexCharts not to run animation on update
      );
    }
  }, [data]);

  return <div ref={chartContainerRef} className="w-full overflow-hidden" />;
});
