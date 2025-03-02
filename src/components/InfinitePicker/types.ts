/* eslint-disable @typescript-eslint/no-explicit-any */
import type { MutableRefObject } from "react";

import type {
    View,
    FlatList as RNFlatList,
    FlatListProps as RNFlatListProps,
} from "react-native";

import type {
    CustomPickerStyles,
} from "../InfinitePicker/styles";

export type CustomFlatList = <ItemT = any>(
    props: React.PropsWithChildren<
        RNFlatListProps<ItemT> & React.RefAttributes<RNFlatList<ItemT>>
    >,
    ref: React.ForwardedRef<RNFlatList<ItemT>>
) => React.ReactElement | null;

export type ItemValue = string | number | null;

export interface PickerItem {
    isDisabled?: boolean;
    label: string | number;
    value: ItemValue;
}

export interface InfinitePickerProps {
    Audio?: any;
    FlatList?: CustomFlatList;
    Haptics?: any;
    LinearGradient?: any;
    MaskedView?: any;
    aggressivelyGetLatestValue?: boolean;
    allowFontScaling?: boolean;
    amLabel?: string;
    clickSoundAsset?: SoundAssetType;
    disableInfiniteScroll?: boolean;
    initialValue?: ItemValue;
    isDisabled?: boolean;
    label?: string | React.ReactElement;
    onChange: (value: PickerItem["value"]) => void;
    padWithNItems: number;
    pickerFeedback?: () => void | Promise<void>;
    pickerGradientOverlayProps?: Partial<LinearGradientProps>;
    pickerItems: PickerItem[];
    repeatValuesNTimes?: number;
    styles: CustomPickerStyles;
    testID?: string;
}

export interface InfinitePickerRef {
    latestValue: MutableRefObject<ItemValue>;
    reset: (options?: { animated?: boolean }) => void;
    setValue: (value: ItemValue, options?: { animated?: boolean }) => void;
}

type LinearGradientPoint = {
    x: number;
    y: number;
};

export type LinearGradientProps = React.ComponentProps<typeof View> & {
    colors: string[];
    end?: LinearGradientPoint | null;
    locations?: number[] | null;
    start?: LinearGradientPoint | null;
};

export type LimitType = {
    maxIndex?: number;
    minIndex?: number;
};

export type SoundAssetType =
    | number
    | {
          headers?: Record<string, string>;
          overrideFileExtensionAndroid?: string;
          uri: string;
      };
