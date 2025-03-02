import type { LimitType } from "../components/InfinitePicker/types";

export const getAdjustedLimit = (variables: {
    limit: LimitType | undefined;
    numberOfItems: number;
}) => {
    const { limit, numberOfItems } = variables;

    const maxIndex = numberOfItems - 1;

    if (!limit || (!limit.maxIndex && !limit.minIndex)) {
        return {
            max: maxIndex,
            min: 0,
        };
    }

    // guard against limits that are out of bounds
    const adjustedMaxLimit = limit.maxIndex
        ? Math.min(limit.maxIndex, maxIndex)
        : maxIndex;
    const adjustedMinLimit = limit.minIndex ? Math.max(limit.minIndex, 0) : 0;

    // guard against invalid limits
    if (adjustedMaxLimit < adjustedMinLimit) {
        return {
            max: maxIndex,
            min: 0,
        };
    }

    return {
        max: adjustedMaxLimit,
        min: adjustedMinLimit,
    };
};
