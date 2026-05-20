import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type ChartData,
  type CoreChartOptions,
  type ElementChartOptions,
  type PluginChartOptions,
  type DatasetChartOptions,
  type ScaleChartOptions,
  type BarControllerChartOptions,
} from "chart.js";
import "chartjs-plugin-zoom";
import type { _DeepPartialObject } from "../../../../node_modules/chart.js/dist/types/utils";
import type { CSSProperties, FC } from "react";

ChartJS.register(BarElement, Title, Tooltip, Legend);

ChartJS.defaults.font.family = "Plus Jakarta Sans";
ChartJS.defaults.color = "#000";
ChartJS.defaults.font.size = 14;

type Props = {
  data: ChartData<"bar", number[], string>;
  height?: number;
  width?: number;
  style?: CSSProperties | undefined;
  options?: _DeepPartialObject<
    | (CoreChartOptions<"bar"> &
        ElementChartOptions<"bar"> &
        PluginChartOptions<"bar"> &
        DatasetChartOptions<"bar"> &
        ScaleChartOptions<"bar"> &
        BarControllerChartOptions)
    | undefined
  >;
};

export const BarChart: FC<Props> = ({
  data,
  width,
  height,
  style,
  options,
}) => {
  return (
    <Bar
      data={data}
      width={width}
      height={height}
      style={style}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        color: "#000",
        font: {
          family: "Plus Jakarta Sans",
          size: 14,
        },
        ...options,
      }}
    />
  );
};
