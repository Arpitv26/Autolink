import { router } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { GiftedChat, type IMessage } from 'react-native-gifted-chat';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { useAutoLinkAI } from '../../hooks/useAutoLinkAI';
import { usePrimaryVehicleContext } from '../../hooks/usePrimaryVehicleContext';
import { theme } from '../../lib/theme';

export default function AiScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { primaryVehicle, loading: vehicleLoading, error: vehicleError, refresh } =
    usePrimaryVehicleContext(user);

  const primaryVehicleLabel = useMemo(() => {
    if (!primaryVehicle) return null;
    return `${primaryVehicle.year} ${primaryVehicle.make} ${primaryVehicle.model}`;
  }, [primaryVehicle]);

  const vehicleContext = primaryVehicleLabel ?? 'No vehicle selected';
  const { messages, loading, error, sendMessage, clearError } =
    useAutoLinkAI(vehicleContext);

  const onSend = useCallback(
    (newMessages: IMessage[] = []) => {
      const text = newMessages[0]?.text;
      if (typeof text === 'string' && text.trim().length > 0) {
        void sendMessage(text);
      }
    },
    [sendMessage]
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
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
          ) : primaryVehicleLabel ? (
            <Text style={styles.contextValue}>{primaryVehicleLabel}</Text>
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

      <View style={styles.chatWrap}>
        <GiftedChat
          messages={messages}
          onSend={onSend}
          user={{ _id: 'me', name: 'You' }}
          isTyping={loading}
          colorScheme="dark"
          isSendButtonAlwaysVisible
          messagesContainerStyle={styles.messagesContainer}
          textInputProps={{
            style: styles.composerInput,
            placeholderTextColor: theme.colors.textPlaceholder,
            placeholder: primaryVehicleLabel
              ? `Ask about your ${primaryVehicleLabel}...`
              : 'Ask a mod question...',
          }}
          keyboardAvoidingViewProps={{
            keyboardVerticalOffset: insets.top,
          }}
        />
      </View>
    </View>
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
  composerInput: {
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    marginRight: 8,
    fontSize: 16,
    lineHeight: 22,
  },
  buttonPressed: {
    transform: [{ scale: 0.985 }],
  },
});
