import { PickerItem } from "../components/InfinitePicker/types";
import { padNumber } from "./padNumber";

export const generateFlatListData = (
    pickerItems: PickerItem[],
    options: {
        disableInfiniteScroll?: boolean;
        padWithNItems: number;
        repeatNTimes: number;
    }
) => {
    if (pickerItems.length === 0) {
        return [];
    }

    let flatListData = pickerItems;

    if (options.repeatNTimes > 1) {
        flatListData = Array(options.repeatNTimes).fill(flatListData).flat();
    }

    if (options.disableInfiniteScroll || options.repeatNTimes === 1) {
        flatListData.push(...Array(options.padWithNItems).fill(""));
        flatListData.unshift(...Array(options.padWithNItems).fill(""));
    }

    return flatListData;
};
