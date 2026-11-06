import { useState } from "react";
import { FlatList, Text, TextInput, View } from "react-native";
import { useCssElement } from "react-native-css";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import SubscriptionCard from "../../components/SubscriptionCard";
import { useSubscriptions } from "../../components/SubscriptionsProvider";
import { posthog } from "../../lib/posthog";

export const SafeAreaView = (
  props: React.ComponentProps<typeof RNSafeAreaView> & { className?: string },
) => useCssElement(RNSafeAreaView, props, { className: "style" });

const Subcriptions = () => {
  const { subscriptions } = useSubscriptions();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<
    string | null
  >(null);
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredSubscriptions = subscriptions.filter((subscription) => {
    if (!normalizedSearchQuery) return true;

    return [subscription.name, subscription.plan, subscription.category].some(
      (value) => value?.toLowerCase().includes(normalizedSearchQuery),
    );
  });

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <FlatList
        data={filteredSubscriptions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SubscriptionCard
            {...item}
            expanded={expandedSubscriptionId === item.id}
            onPress={() => {
              if (expandedSubscriptionId !== item.id) {
                posthog?.capture("subscription_details_viewed", {
                  billing_interval: item.billing ?? null,
                  category: item.category ?? null,
                  subscription_status: item.status ?? null,
                });
              }
              setExpandedSubscriptionId((currentId) =>
                currentId === item.id ? null : item.id,
              );
            }}
          />
        )}
        ListHeaderComponent={
          <>
            <Text className="list-title mb-4">Subscriptions</Text>
            <TextInput
              accessibilityLabel="Search subscriptions"
              className="auth-input mb-5"
              onChangeText={setSearchQuery}
              placeholder="Search subscriptions"
              placeholderTextColor="rgba(0, 0, 0, 0.45)"
              returnKeyType="search"
              value={searchQuery}
            />
          </>
        }
        ItemSeparatorComponent={() => <View className="h-4" />}
        ListEmptyComponent={
          <Text className="home-empty-state">
            {searchQuery.trim()
              ? "No subscriptions match your search."
              : "No subscriptions yet."}
          </Text>
        }
        extraData={expandedSubscriptionId}
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-30"
      />
    </SafeAreaView>
  );
};

export default Subcriptions;
