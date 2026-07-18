import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  Bubble,
  GiftedChat,
  type BubbleProps,
  type IMessage,
} from 'react-native-gifted-chat';
import {
  KeyboardProvider,
  KeyboardStickyView,
} from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { useAutoLinkAI } from '../../hooks/useAutoLinkAI';
import { useBuildPlanner } from '../../hooks/useBuildPlanner';
import { usePrimaryVehicleContext } from '../../hooks/usePrimaryVehicleContext';
import {
  formatBuildContext,
  formatFeedContext,
  formatVehicleLabel,
  type AiPostSummary,
} from '../../lib/aiContext';
import { supabase } from '../../lib/supabase';
import { theme } from '../../lib/theme';

type PostCaptionRow = {
  caption: string | null;
  created_at: string;
};

const TAB_BAR_STYLE = {
  height: 70,
  paddingTop: 5,
  paddingBottom: 7,
  borderTopWidth: 1,
  borderTopColor: theme.colors.borderDefault,
  backgroundColor: theme.colors.surface,
} as const;

export default function AiScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { primaryVehicle, loading: vehicleLoading, error: vehicleError, refresh } =
    usePrimaryVehicleContext(user);
  const {
    items: buildItems,
    totalCost,
    loading: buildLoading,
  } = useBuildPlanner(user, primaryVehicle?.id ?? null);

  const [feedPosts, setFeedPosts] = useState<AiPostSummary[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [draft, setDraft] = useState('');

  const refreshFeedContext = useCallback(async (): Promise<void> => {
    if (!user || !primaryVehicle?.id) {
      setFeedPosts([]);
      setFeedLoading(false);
      return;
    }

    setFeedLoading(true);
    const { data, error } = await supabase
      .from('posts')
      .select('caption, created_at')
      .eq('user_id', user.id)
      .eq('vehicle_id', primaryVehicle.id)
      .order('created_at', { ascending: false })
      .limit(5)
      .returns<PostCaptionRow[]>();

    if (error) {
      setFeedPosts([]);
      setFeedLoading(false);
      return;
    }

    setFeedPosts(
      (data ?? []).map((row) => ({
        caption: row.caption ?? '',
        createdAt: row.created_at,
      }))
    );
    setFeedLoading(false);
  }, [primaryVehicle?.id, user]);

  useFocusEffect(
    useCallback(() => {
      void refreshFeedContext();
      return () => {
        navigation.setOptions({ tabBarStyle: TAB_BAR_STYLE });
        setKeyboardOpen(false);
        Keyboard.dismiss();
      };
    }, [navigation, refreshFeedContext])
  );

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => {
      setKeyboardOpen(true);
      navigation.setOptions({ tabBarStyle: { display: 'none' } });
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardOpen(false);
      navigation.setOptions({ tabBarStyle: TAB_BAR_STYLE });
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [navigation]);

  const primaryVehicleLabel = useMemo(
    () => formatVehicleLabel(primaryVehicle),
    [primaryVehicle]
  );

  const buildContext = useMemo(
    () =>
      formatBuildContext(
        buildItems.map((item) => ({
          category: item.category,
          partName: item.partName,
          brand: item.brand,
          price: item.price,
          status: item.status,
        })),
        totalCost
      ),
    [buildItems, totalCost]
  );

  const feedContext = useMemo(() => formatFeedContext(feedPosts), [feedPosts]);

  const aiContext = useMemo(
    () => ({
      vehicleContext: primaryVehicle ? primaryVehicleLabel : 'No vehicle selected',
      buildContext,
      feedContext,
    }),
    [buildContext, feedContext, primaryVehicle, primaryVehicleLabel]
  );

  const { messages, loading, error, sendMessage, clearError } = useAutoLinkAI(aiContext);

  const handleSend = useCallback(() => {
    const trimmed = draft.trim();
    if (!trimmed || loading) return;
    setDraft('');
    void sendMessage(trimmed);
  }, [draft, loading, sendMessage]);

  const renderBubble = useCallback((props: BubbleProps<IMessage>) => {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          left: styles.aiBubble,
          right: styles.userBubble,
        }}
        textStyle={{
          left: styles.aiBubbleText,
          right: styles.userBubbleText,
        }}
      />
    );
  }, []);

  const contextBusy = vehicleLoading || buildLoading || feedLoading;
  const buildSummary = primaryVehicle
    ? buildItems.length > 0
      ? `${buildItems.length} Planner part${buildItems.length === 1 ? '' : 's'} · $${totalCost.toFixed(0)}`
      : 'Planner build empty — add parts in Planner for smarter recs'
    : null;

  const canSend = draft.trim().length > 0 && !loading;

  return (
    <KeyboardProvider statusBarTranslucent navigationBarTranslucent>
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        {!keyboardOpen ? (
          <View style={styles.header}>
            <Text style={styles.title}>AI Assistant</Text>
            <Text style={styles.subtitle}>
              Ask about mods, fitment, and budget tiers for your garage car.
            </Text>

            <View style={styles.contextCard}>
              <Text style={styles.contextTitle}>Vehicle Context</Text>
              {vehicleLoading ? (
                <View style={styles.contextStatusRow}>
                  <ActivityIndicator size="small" color={theme.colors.accentGreen} />
                  <Text style={styles.contextValue}>Loading your garage vehicle...</Text>
                </View>
              ) : vehicleError ? (
                <>
                  <Text style={styles.contextErrorText}>{vehicleError}</Text>
                  <Pressable
                    onPress={() => void refresh()}
                    style={({ pressed }) => [
                      styles.contextActionButton,
                      pressed && styles.buttonPressed,
                    ]}
                  >
                    <Text style={styles.contextActionText}>Retry</Text>
                  </Pressable>
                </>
              ) : primaryVehicle ? (
                <>
                  <Text style={styles.contextValue}>{primaryVehicleLabel}</Text>
                  <Text style={styles.contextMeta}>
                    {contextBusy && buildSummary === null
                      ? 'Loading Planner + posts…'
                      : buildSummary}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.contextValue}>
                    Add a vehicle in Profile to personalize AI responses.
                  </Text>
                  <Pressable
                    onPress={() => router.push('/(tabs)/profile')}
                    style={({ pressed }) => [
                      styles.contextActionButton,
                      pressed && styles.buttonPressed,
                    ]}
                  >
                    <Text style={styles.contextActionText}>Go to Profile</Text>
                  </Pressable>
                </>
              )}
            </View>

            {error ? (
              <Pressable
                onPress={clearError}
                style={({ pressed }) => [styles.errorBanner, pressed && styles.buttonPressed]}
              >
                <Text style={styles.errorText}>{error}</Text>
                <Text style={styles.errorDismiss}>Tap to dismiss</Text>
              </Pressable>
            ) : null}
          </View>
        ) : error ? (
          <Pressable
            onPress={clearError}
            style={({ pressed }) => [
              styles.errorBannerCompact,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.errorText}>{error}</Text>
          </Pressable>
        ) : (
          <View style={styles.compactBar}>
            <Text style={styles.compactTitle} numberOfLines={1}>
              {primaryVehicle ? primaryVehicleLabel : 'AI Assistant'}
            </Text>
          </View>
        )}

        <View style={styles.chatWrap}>
          <GiftedChat
            messages={messages}
            user={{ _id: 'me', name: 'You' }}
            isTyping={loading}
            colorScheme="dark"
            renderAvatar={null}
            renderBubble={renderBubble}
            renderInputToolbar={() => null}
            messagesContainerStyle={styles.messagesContainer}
            messageTextProps={{
              phone: false,
              hashtag: false,
              mention: false,
              email: false,
            }}
            keyboardAvoidingViewProps={{
              enabled: false,
            }}
            listProps={{
              contentContainerStyle: styles.messagesContent,
              keyboardShouldPersistTaps: 'handled',
            }}
          />

          <KeyboardStickyView
            offset={{ closed: 0, opened: 0 }}
            style={styles.stickyComposer}
          >
            <View
              style={[
                styles.composerBar,
                { paddingBottom: keyboardOpen ? 10 : Math.max(insets.bottom, 8) },
              ]}
            >
              <TextInput
                value={draft}
                onChangeText={setDraft}
                style={styles.composerInput}
                placeholder={
                  primaryVehicle
                    ? `Ask about your ${primaryVehicleLabel}...`
                    : 'Ask a mod question...'
                }
                placeholderTextColor={theme.colors.textPlaceholder}
                multiline
                maxLength={2000}
                editable={!loading}
                blurOnSubmit={false}
                onSubmitEditing={handleSend}
              />
              <Pressable
                onPress={handleSend}
                disabled={!canSend}
                style={({ pressed }) => [
                  styles.sendButton,
                  !canSend && styles.sendButtonDisabled,
                  pressed && canSend && styles.buttonPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Send message"
              >
                <Ionicons
                  name="arrow-up"
                  size={18}
                  color={canSend ? theme.colors.textIconDark : theme.colors.textDisabled}
                />
              </Pressable>
            </View>
          </KeyboardStickyView>
        </View>
      </View>
    </KeyboardProvider>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.appBackground,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderMuted,
    backgroundColor: theme.colors.surface,
  },
  compactBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderMuted,
    backgroundColor: theme.colors.surface,
  },
  compactTitle: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    marginTop: 8,
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  contextCard: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.borderMuted,
    backgroundColor: theme.colors.surfaceMuted,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  contextTitle: {
    color: theme.colors.accentGreenMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  contextValue: {
    marginTop: 4,
    color: theme.colors.accentGreen,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
  },
  contextMeta: {
    marginTop: 4,
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  contextStatusRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contextErrorText: {
    marginTop: 4,
    color: theme.colors.textDanger,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
  },
  contextActionButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.borderBrand,
    backgroundColor: theme.colors.surfaceBrand,
    paddingVertical: 6,
    paddingHorizontal: 11,
  },
  contextActionText: {
    color: theme.colors.accentGreen,
    fontSize: 13,
    fontWeight: '700',
  },
  errorBanner: {
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.borderDangerSoft,
    backgroundColor: theme.colors.surfaceDangerSoft,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorBannerCompact: {
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.borderDangerSoft,
    backgroundColor: theme.colors.surfaceDangerSoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  errorText: {
    color: theme.colors.textDanger,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
  },
  errorDismiss: {
    marginTop: 4,
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  chatWrap: {
    flex: 1,
  },
  messagesContainer: {
    backgroundColor: theme.colors.appBackground,
  },
  messagesContent: {
    paddingBottom: 96,
  },
  stickyComposer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  composerBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderMuted,
    backgroundColor: theme.colors.surface,
  },
  composerInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 16,
    lineHeight: 22,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.palette.mutedGold,
    marginBottom: 2,
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.surfaceDisabled,
  },
  aiBubble: {
    backgroundColor: '#1C1815',
    borderWidth: 1,
    borderColor: '#2E2823',
  },
  userBubble: {
    backgroundColor: '#3A2E24',
  },
  aiBubbleText: {
    color: theme.colors.textPrimary,
    lineHeight: 22,
  },
  userBubbleText: {
    color: theme.colors.textPrimary,
  },
  buttonPressed: {
    transform: [{ scale: 0.985 }],
  },
});
