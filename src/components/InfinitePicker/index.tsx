import React, {
    useRef,
    useCallback,
    forwardRef,
    useImperativeHandle,
    useState,
    useEffect,
    useMemo,
} from "react";

import { View, Text, FlatList as RNFlatList } from "react-native";
import type {
    ViewabilityConfigCallbackPairs,
    ViewToken,
    NativeSyntheticEvent,
    NativeScrollEvent,
} from "react-native";

import { colorToRgba } from "../../utils/colorToRgba";
import { findNearestEnabledItemAndIndex } from "../../utils/findNearestEnabledItemAndIndex";
import { generateFlatListData } from "../../utils/generateFlatListData";
import { getInitialScrollIndex } from "../../utils/getInitialScrollIndex";
import { getPickerItemAndIndexFromScrollOffset } from "../../utils/getPickerItemAndIndexFromScrollOffset";

import { generateStyles } from "./styles";
import type {
    InfinitePickerProps,
    InfinitePickerRef,
    PickerItem,
} from "./types";

const InfinitePicker = forwardRef<InfinitePickerRef, InfinitePickerProps>(
    (props, ref) => {
        const {
            aggressivelyGetLatestValue,
            allowFontScaling = false,
            Audio,
            clickSoundAsset,
            disableInfiniteScroll = false,
            FlatList = RNFlatList,
            Haptics,
            initialValue,
            isDisabled,
            label,
            LinearGradient,
            MaskedView,
            onChange,
            padWithNItems,
            pickerFeedback,
            pickerGradientOverlayProps,
            pickerItems,
            repeatValuesNTimes = 3,
            styles: customStyles,
            testID,
        } = props;

        const styles = useMemo(
            () => generateStyles(customStyles),

            [customStyles]
        );

        const safeRepeatValuesNTimes = useMemo(() => {
            const numberOfItems = pickerItems.length;

            // do not repeat values if there is only one option
            if (numberOfItems === 1) {
                return 1;
            }

            if (!disableInfiniteScroll && repeatValuesNTimes < 2) {
                return 2;
            } else if (repeatValuesNTimes < 1 || isNaN(repeatValuesNTimes)) {
                return 1;
            }

            // if this variable is not explicitly set, we calculate a reasonable value based on
            // the number of items in the picker, avoiding regular jumps up/down the list
            // whilst avoiding rendering too many items in the picker
            if (!props.repeatValuesNTimes) {
                return Math.max(Math.round(180 / numberOfItems), 1);
            }

            return Math.round(repeatValuesNTimes);
        }, [
            disableInfiniteScroll,
            pickerItems.length,
            props.repeatValuesNTimes,
            repeatValuesNTimes,
        ]);

        const flatListData = useMemo(() => {
            return generateFlatListData(pickerItems, {
                repeatNTimes: safeRepeatValuesNTimes,
                disableInfiniteScroll,
                padWithNItems,
            });
        }, [
            disableInfiniteScroll,
            padWithNItems,
            pickerItems,
            safeRepeatValuesNTimes,
        ]);

        const initialScrollIndex = useMemo(
            () =>
                getInitialScrollIndex({
                    disableInfiniteScroll,
                    initialValue,
                    numberOfItems: pickerItems.length,
                    padWithNItems,
                    pickerItems,
                    repeatValuesNTimes: safeRepeatValuesNTimes,
                }),
            [
                disableInfiniteScroll,
                initialValue,
                padWithNItems,
                pickerItems,
                safeRepeatValuesNTimes,
            ]
        );

        const numberOfItemsToShow = 1 + padWithNItems * 2;

        // keep track of the latest value as it scrolls
        const latestValue = useRef(pickerItems[0]?.value);
        // keep track of the last index scrolled past for haptic/audio feedback
        const lastFeedbackIndex = useRef(0);

        const flatListRef = useRef<RNFlatList>(null);

        const [clickSound, setClickSound] = useState<
            | {
                  replayAsync: () => Promise<void>;
                  unloadAsync: () => Promise<void>;
              }
            | undefined
        >();

        // Preload the sound when the component mounts
        useEffect(() => {
            const loadSound = async () => {
                if (Audio) {
                    const { sound } = await Audio.Sound.createAsync(
                        clickSoundAsset ?? {
                            // use a hosted sound as a fallback (do not use local asset due to loader issues
                            // in some environments when including mp3 in library)
                            uri: "https://drive.google.com/uc?export=download&id=10e1YkbNsRh-vGx1jmS1Nntz8xzkBp4_I",
                        },
                        { shouldPlay: false }
                    );
                    setClickSound(sound);
                }
            };

            loadSound();

            // Unload sound when component unmounts
            return () => {
                clickSound?.unloadAsync();
            };
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [Audio]);

        const renderItem = useCallback(
            ({ item }: { item: PickerItem }) => {
                const { isDisabled, label } = item;

                return (
                    <View
                        style={styles.pickerItemContainer}
                        testID="picker-item">
                        <Text
                            allowFontScaling={allowFontScaling}
                            style={[
                                styles.pickerItem,
                                isDisabled && styles.disabledPickerItem,
                            ]}>
                            {label}
                        </Text>
                    </View>
                );
            },
            [
                allowFontScaling,
                styles.disabledPickerItem,
                styles.pickerItem,
                styles.pickerItemContainer,
            ]
        );

        const onScroll = useCallback(
            (e: NativeSyntheticEvent<NativeScrollEvent>) => {
                // this function is used to ensure that the latest value is always available
                // even if the scrollview is still scrolling (if aggressivelyGetLatestValue is true)
                if (
                    !aggressivelyGetLatestValue &&
                    !Haptics &&
                    !Audio &&
                    !pickerFeedback
                ) {
                    return;
                }

                if (aggressivelyGetLatestValue) {
                    const { index: newIndex, pickerItem: newPickerItem } =
                        getPickerItemAndIndexFromScrollOffset({
                            disableInfiniteScroll,
                            itemHeight: styles.pickerItemContainer.height,
                            padWithNItems,
                            pickerItems,
                            yContentOffset: e.nativeEvent.contentOffset.y,
                        });

                    if (newPickerItem.value !== latestValue.current) {
                        // check whether item is disabled
                        // if so, get the value of the closest enabled item
                        if (newPickerItem.isDisabled) {
                            const { pickerItem: nearestEnabledItem } =
                                findNearestEnabledItemAndIndex({
                                    index: newIndex,
                                    pickerItems,
                                });
                            latestValue.current =
                                nearestEnabledItem?.value ?? null;
                        } else {
                            latestValue.current = newPickerItem.value;
                        }
                    }
                }

                if (Haptics || Audio || pickerFeedback) {
                    const feedbackIndex = Math.round(
                        (e.nativeEvent.contentOffset.y +
                            styles.pickerItemContainer.height / 2) /
                            styles.pickerItemContainer.height
                    );

                    if (feedbackIndex !== lastFeedbackIndex.current) {
                        // this check stops the feedback firing when the component mounts
                        if (lastFeedbackIndex.current) {
                            try {
                                // fire haptic feedback if available
                                Haptics?.selectionAsync();

                                // play click sound if available
                                clickSound?.replayAsync();

                                // fire custom feedback if available
                                pickerFeedback?.();
                            } catch {
                                // do nothing
                            }
                        }

                        lastFeedbackIndex.current = feedbackIndex;
                    }
                }
            },
            // eslint-disable-next-line react-hooks/exhaustive-deps
            [
                aggressivelyGetLatestValue,
                clickSound,
                disableInfiniteScroll,
                padWithNItems,
                pickerItems,
                styles.pickerItemContainer.height,
            ]
        );

        const onMomentumScrollEnd = useCallback(
            (e: NativeSyntheticEvent<NativeScrollEvent>) => {
                const { index: newIndex, pickerItem: newPickerItem } =
                    getPickerItemAndIndexFromScrollOffset({
                        disableInfiniteScroll,
                        itemHeight: styles.pickerItemContainer.height,
                        padWithNItems,
                        pickerItems,
                        yContentOffset: e.nativeEvent.contentOffset.y,
                    });

                let newValue = newPickerItem.value;

                // check whether item is disabled
                // if so, scroll to the closest enabled item
                if (newPickerItem.isDisabled) {
                    const {
                        index: nearestEnabledItemIndex,
                        pickerItem: nearestEnabledItem,
                    } = findNearestEnabledItemAndIndex({
                        index: newIndex,
                        pickerItems,
                    });

                    if (nearestEnabledItemIndex) {
                        flatListRef.current?.scrollToIndex({
                            animated: true,
                            index: nearestEnabledItemIndex,
                        });
                        newValue = nearestEnabledItem.value;
                    }
                }

                onChange(newValue);
            },
            [
                disableInfiniteScroll,
                styles.pickerItemContainer.height,
                padWithNItems,
                pickerItems,
                onChange,
            ]
        );

        const onViewableItemsChanged = useCallback(
            ({ viewableItems }: { viewableItems: ViewToken[] }) => {
                const numberOfItems = pickerItems.length;

                if (numberOfItems === 1) {
                    return;
                }

                if (
                    viewableItems[0]?.index &&
                    viewableItems[0].index < numberOfItems * 0.5
                ) {
                    flatListRef.current?.scrollToIndex({
                        animated: false,
                        index: viewableItems[0].index + numberOfItems,
                    });
                } else if (
                    viewableItems[0]?.index &&
                    viewableItems[0].index >=
                        numberOfItems * (safeRepeatValuesNTimes - 0.5)
                ) {
                    flatListRef.current?.scrollToIndex({
                        animated: false,
                        index: viewableItems[0].index - numberOfItems,
                    });
                }
            },
            [pickerItems.length, safeRepeatValuesNTimes]
        );

        const [
            viewabilityConfigCallbackPairs,
            setViewabilityConfigCallbackPairs,
        ] = useState<ViewabilityConfigCallbackPairs | undefined>(
            !disableInfiniteScroll
                ? [
                      {
                          viewabilityConfig: {
                              viewAreaCoveragePercentThreshold: 0,
                          },
                          onViewableItemsChanged: onViewableItemsChanged,
                      },
                  ]
                : undefined
        );

        const [flatListRenderKey, setFlatListRenderKey] = useState(0);

        const initialRender = useRef(true);

        useEffect(() => {
            // don't run on first render
            if (initialRender.current) {
                initialRender.current = false;
                return;
            }

            // if the onViewableItemsChanged callback changes, we need to update viewabilityConfigCallbackPairs
            // which requires the FlatList to be remounted, hence the increase of the FlatList key
            setFlatListRenderKey((prev) => prev + 1);
            setViewabilityConfigCallbackPairs(
                !disableInfiniteScroll
                    ? [
                          {
                              viewabilityConfig: {
                                  viewAreaCoveragePercentThreshold: 0,
                              },
                              onViewableItemsChanged: onViewableItemsChanged,
                          },
                      ]
                    : undefined
            );
        }, [disableInfiniteScroll, onViewableItemsChanged]);

        const getItemLayout = useCallback(
            (_: ArrayLike<PickerItem> | null | undefined, index: number) => ({
                length: styles.pickerItemContainer.height,
                offset: styles.pickerItemContainer.height * index,
                index,
            }),
            [styles.pickerItemContainer.height]
        );

        useImperativeHandle(
            ref,
            () => ({
                reset: (options) => {
                    flatListRef.current?.scrollToIndex({
                        animated: options?.animated ?? false,
                        index: initialScrollIndex,
                    });
                },
                setValue: (value, options) => {
                    flatListRef.current?.scrollToIndex({
                        animated: options?.animated ?? false,
                        index: getInitialScrollIndex({
                            disableInfiniteScroll,
                            initialValue: value,
                            numberOfItems: pickerItems.length,
                            padWithNItems,
                            pickerItems,
                            repeatValuesNTimes: safeRepeatValuesNTimes,
                        }),
                    });
                },
                latestValue,
            }),
            [
                disableInfiniteScroll,
                initialScrollIndex,
                padWithNItems,
                pickerItems,
                safeRepeatValuesNTimes,
            ]
        );

        const renderContent = useMemo(() => {
            return (
                <>
                    <FlatList
                        key={flatListRenderKey}
                        ref={flatListRef}
                        contentContainerStyle={
                            styles.pickerFlatListContentContainer
                        }
                        data={flatListData}
                        decelerationRate={0.88}
                        getItemLayout={getItemLayout}
                        initialScrollIndex={initialScrollIndex}
                        keyExtractor={(item, index) => `${item.value}-${index}`}
                        nestedScrollEnabled
                        onMomentumScrollEnd={onMomentumScrollEnd}
                        onScroll={onScroll}
                        renderItem={renderItem}
                        scrollEnabled={!isDisabled}
                        scrollEventThrottle={16}
                        showsVerticalScrollIndicator={false}
                        snapToAlignment="start"
                        // used in place of snapToInterval due to bug on Android
                        snapToOffsets={[...Array(flatListData.length)].map(
                            (_, i) => i * styles.pickerItemContainer.height
                        )}
                        style={styles.pickerFlatList}
                        testID="duration-scroll-flatlist"
                        viewabilityConfigCallbackPairs={
                            viewabilityConfigCallbackPairs
                        }
                        windowSize={numberOfItemsToShow}
                    />
                    <View
                        pointerEvents="none"
                        style={styles.pickerLabelContainer}>
                        {typeof label === "string" ? (
                            <Text
                                allowFontScaling={allowFontScaling}
                                style={styles.pickerLabel}>
                                {label}
                            </Text>
                        ) : (
                            label ?? null
                        )}
                    </View>
                </>
            );
        }, [
            FlatList,
            flatListRenderKey,
            styles.pickerFlatListContentContainer,
            styles.pickerFlatList,
            flatListData,
            getItemLayout,
            initialScrollIndex,
            onMomentumScrollEnd,
            onScroll,
            renderItem,
            isDisabled,
            viewabilityConfigCallbackPairs,
            numberOfItemsToShow,
            styles.pickerLabelContainer,
            styles.pickerLabel,
            styles.pickerItemContainer.height,
            label,
            allowFontScaling,
        ]);

        const renderLinearGradient = useMemo(() => {
            if (!LinearGradient) {
                return null;
            }

            let colors: string[];

            if (MaskedView) {
                // if using masked view, we only care about the opacity
                colors = [
                    "rgba(0,0,0,0)",
                    "rgba(0,0,0,1)",
                    "rgba(0,0,0,1)",
                    "rgba(0,0,0,0)",
                ];
            } else {
                const backgroundColor =
                    styles.pickerFlatListContainer.backgroundColor ?? "white";
                const transparentBackgroundColor = colorToRgba({
                    color: backgroundColor,
                    opacity: 0,
                });
                colors = [
                    backgroundColor,
                    transparentBackgroundColor,
                    transparentBackgroundColor,
                    backgroundColor,
                ];
            }

            // calculate the gradient height to cover the top item and bottom item
            const gradientHeight =
                padWithNItems > 0 ? 1 / (padWithNItems * 2 + 1) : 0.3;

            return (
                <LinearGradient
                    colors={colors}
                    locations={[0, gradientHeight, 1 - gradientHeight, 1]}
                    pointerEvents="none"
                    style={styles.pickerGradientOverlay}
                    {...pickerGradientOverlayProps}
                />
            );
        }, [
            LinearGradient,
            MaskedView,
            padWithNItems,
            pickerGradientOverlayProps,
            styles.pickerFlatListContainer.backgroundColor,
            styles.pickerGradientOverlay,
        ]);

        return (
            <View
                pointerEvents={isDisabled ? "none" : undefined}
                style={[
                    styles.pickerFlatListContainer,
                    {
                        height:
                            styles.pickerItemContainer.height *
                            numberOfItemsToShow,
                    },
                    isDisabled && styles.disabledPickerContainer,
                ]}
                testID={testID}>
                {MaskedView ? (
                    <MaskedView
                        maskElement={renderLinearGradient}
                        style={[styles.maskedView]}>
                        {renderContent}
                    </MaskedView>
                ) : (
                    <>
                        {renderContent}
                        {renderLinearGradient}
                    </>
                )}
            </View>
        );
    }
);

export default React.memo(InfinitePicker);
