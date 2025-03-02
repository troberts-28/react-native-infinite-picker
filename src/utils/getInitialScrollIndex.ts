import type { ItemValue, PickerItem } from "../components/InfinitePicker/types";

export const getInitialScrollIndex = (variables: {
    disableInfiniteScroll: boolean;
    initialValue: ItemValue | undefined;
    numberOfItems: number;
    padWithNItems: number;
    pickerItems: PickerItem[];
    repeatValuesNTimes: number;
}) => {
    const {
        disableInfiniteScroll,
        initialValue,
        numberOfItems,
        padWithNItems,
        pickerItems,
        repeatValuesNTimes,
    } = variables;

    let index = 0;

    if (initialValue !== undefined) {
        const indexOfInitialValue = pickerItems.findIndex(
            (item) => item.value === initialValue
        );

        if (indexOfInitialValue !== -1) {
            index = indexOfInitialValue;
        }
    }

    return Math.max(
        numberOfItems * Math.floor(repeatValuesNTimes / 2) +
            ((index + numberOfItems) % numberOfItems) -
            (!disableInfiniteScroll ? padWithNItems : 0),
        0
    );
};
