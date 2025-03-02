import type { PickerItem } from "../components/InfinitePicker/types";

export const findNearestEnabledItemAndIndex = (variables: {
    index: number;
    pickerItems: PickerItem[];
}) => {
    const { index, pickerItems } = variables;

    if (!pickerItems.length) {
        return {};
    }

    let left = index - 1;
    let right = index + 1;

    while (left <= 0 || right < pickerItems.length) {
        if (right < pickerItems.length && !pickerItems[right].isDisabled) {
            return { pickerItem: pickerItems[right], index: right };
        }
        if (left >= 0 && !pickerItems[left].isDisabled) {
            return { pickerItem: pickerItems[left], index: left };
        }

        left--;
        right++;
    }

    // all items are disabled
    return {};
};
