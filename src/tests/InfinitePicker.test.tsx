import React from "react";

import { render } from "@testing-library/react-native";

import InfinitePicker from "../components/InfinitePicker";
import type { generateStyles } from "../components/InfinitePicker/styles";

describe("InfinitePicker", () => {
    const onDurationChangeMock = jest.fn();
    const emptyStyles = {
        pickerContainer: {},
        pickerLabelContainer: {},
        pickerLabel: {},
        pickerItemContainer: {},
        pickerItem: {},
        pickerAmPmContainer: {},
        pickerAmPmLabel: {},
        disabledPickerContainer: {},
        disabledPickerItem: {},
        pickerGradientOverlay: {},
    } as ReturnType<typeof generateStyles>;

    it("renders without crashing", () => {
        const { getByTestId } = render(
            <InfinitePicker
                aggressivelyGetLatestDuration={false}
                interval={1}
                maximumValue={1}
                onDurationChange={onDurationChangeMock}
                padWithNItems={0}
                repeatNumbersNTimesNotExplicitlySet={true}
                styles={emptyStyles}
                testID="duration-scroll"
            />
        );
        const component = getByTestId("duration-scroll");
        expect(component).toBeDefined();
    });

    it("renders the correct number of items", () => {
        const { getAllByTestId } = render(
            <InfinitePicker
                aggressivelyGetLatestDuration={false}
                interval={1}
                maximumValue={23}
                onDurationChange={onDurationChangeMock}
                padWithNItems={1}
                repeatNumbersNTimesNotExplicitlySet={true}
                styles={emptyStyles}
            />
        );
        const items = getAllByTestId("picker-item");
        expect(items).toHaveLength(10);
    });

    it("renders the label if provided", () => {
        const { getByText } = render(
            <InfinitePicker
                aggressivelyGetLatestDuration={false}
                interval={1}
                label="Duration"
                maximumValue={59}
                onDurationChange={onDurationChangeMock}
                padWithNItems={1}
                repeatNumbersNTimesNotExplicitlySet={true}
                styles={emptyStyles}
            />
        );
        const label = getByText("Duration");
        expect(label).toBeDefined();
    });
});
