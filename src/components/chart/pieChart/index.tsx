import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  type ChartData,
  type CoreChartOptions,
  type ElementChartOptions,
  type PluginChartOptions,
  type DatasetChartOptions,
  type ScaleChartOptions,
  type PieControllerChartOptions,
} from "chart.js";

import ChartDataLabels from "chartjs-plugin-datalabels";
import type { _DeepPartialObject } from "../../../../node_modules/chart.js/dist/types/utils";
import { forwardRef, type CSSProperties } from "react";

ChartJS.register(ChartDataLabels, ArcElement, Title, Tooltip, Legend);

ChartJS.defaults.font.family = "Plus Jakarta Sans";
ChartJS.defaults.color = "#000";
ChartJS.defaults.font.size = 14;

type Props = {
  data: ChartData<"pie", number[], string>;
  height?: number;
  width?: number;
  style?: CSSProperties | undefined;
  options?: _DeepPartialObject<
    | (CoreChartOptions<"pie"> &
        ElementChartOptions<"pie"> &
        PluginChartOptions<"pie"> &
        DatasetChartOptions<"pie"> &
        ScaleChartOptions<"pie"> &
        PieControllerChartOptions)
    | undefined
  >;
  className?: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const PieChart = forwardRef<any, Props>(
  ({ data, width, height, style, options, className }, ref) => {
    return (
      <>
        <Pie
          ref={ref}
          className={className}
          data={data}
          width={width}
          height={height}
          style={style}
          options={{
            ...options,
            responsive: true,
            maintainAspectRatio: true,
            color: "#000",
            font: {
              family: "Plus Jakarta Sans",
              size: 14,
            },
          }}
        />
      </>
    );
  }
);
