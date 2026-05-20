import { getMonth } from "@/functions/getMonth";
import { BasicSelectOpt } from "@/types";

interface ReturnProps {
  arr: BasicSelectOpt<number>[];
  loading: boolean;
}

interface Props {}

const useMonthOpts = ({}: Props = {}): ReturnProps => {
  return {
    arr: Array.from({ length: 12 }, (_, index) => {
      const monthNumber = index + 1;
      return {
        label: getMonth(monthNumber),
        value: monthNumber,
      };
    }),
    loading: false,
  };
};

export default useMonthOpts;
