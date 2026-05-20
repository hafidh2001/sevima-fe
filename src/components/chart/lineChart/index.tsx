import { Line } from "react-chartjs-2";
import "chartjs-adapter-dayjs-4/dist/chartjs-adapter-dayjs-4.esm";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale,
  type ChartData,
  type CoreChartOptions,
  type ElementChartOptions,
  type PluginChartOptions,
  type DatasetChartOptions,
  type ScaleChartOptions,
  type LineControllerChartOptions,
  type Plugin,
} from "chart.js";

import type { _DeepPartialObject } from "../../../../node_modules/chart.js/dist/types/utils";
import type { CSSProperties, FC } from "react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale
);

ChartJS.defaults.font.family = "Plus Jakarta Sans";
ChartJS.defaults.color = "#000";
ChartJS.defaults.font.size = 14;

type Props = {
  data: ChartData<"line", number[], string>;
  height?: number;
  width?: number;
  style?: CSSProperties | undefined;
  options?: _DeepPartialObject<
    | (CoreChartOptions<"line"> &
        ElementChartOptions<"line"> &
        PluginChartOptions<"line"> &
        DatasetChartOptions<"line"> &
        ScaleChartOptions<"line"> &
        LineControllerChartOptions)
    | undefined
  >;
  plugins?: Plugin<"line", any>[];
};

export const LineChart: FC<Props> = ({
  data,
  width,
  height,
  style,
  options,
  plugins,
}) => {
  return (
    <>
      <Line
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
        plugins={plugins}
      />
    </>
  );
};
