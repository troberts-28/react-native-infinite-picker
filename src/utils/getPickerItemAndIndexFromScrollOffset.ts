import type { PickerItem } from "../components/InfinitePicker/types";

export const getPickerItemAndIndexFromScrollOffset = (variables: {
    disableInfiniteScroll: boolean;
    itemHeight: number;
    padWithNItems: number;
    pickerItems: PickerItem[];
    yContentOffset: number;
}) => {
    const {
        disableInfiniteScroll,
        itemHeight,
        padWithNItems,
        pickerItems,
        yContentOffset,
    } = variables;

    const index = Math.round(yContentOffset / itemHeight);

    const numberOfItems = pickerItems.length;

    const indexInInputList =
        (disableInfiniteScroll ? index : index + padWithNItems) % numberOfItems;

    const pickerItem = pickerItems?.[indexInInputList];

    return {
        pickerItem,
        index,
    };
};
