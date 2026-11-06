import clsx from "clsx";
import dayjs from "dayjs";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { icons } from "../constants/icons";

const CATEGORIES = [
  "Entertainment",
  "AI Tools",
  "Developer Tools",
  "Design",
  "Productivity",
  "Cloud",
  "Music",
  "Other",
] as const;

type SubscriptionCategory = (typeof CATEGORIES)[number];
type BillingFrequency = "Monthly" | "Yearly";

const CATEGORY_COLORS: Record<SubscriptionCategory, string> = {
  Entertainment: "#e8def8",
  "AI Tools": "#b8d4e3",
  "Developer Tools": "#d6e8c5",
  Design: "#f5c542",
  Productivity: "#f4d3c2",
  Cloud: "#c7e5f5",
  Music: "#b8e8d0",
  Other: "#f6eecf",
};

interface CreateSubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (subscription: Subscription) => void;
}

const CreateSubscriptionModal = ({
  visible,
  onClose,
  onCreate,
}: CreateSubscriptionModalProps) => {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [frequency, setFrequency] = useState<BillingFrequency>("Monthly");
  const [category, setCategory] = useState<SubscriptionCategory | null>(null);

  const parsedPrice = Number(price);
  const canSubmit = name.trim().length > 0 && Number.isFinite(parsedPrice) && parsedPrice > 0;

  const resetAndClose = () => {
    setName("");
    setPrice("");
    setFrequency("Monthly");
    setCategory(null);
    onClose();
  };

  const handleSubmit = () => {
    if (!canSubmit) return;

    const start = dayjs();
    const renewalDate =
      frequency === "Monthly" ? start.add(1, "month") : start.add(1, "year");
    const selectedCategory = category ?? "Other";

    onCreate({
      id: `subscription-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: name.trim(),
      price: parsedPrice,
      currency: "USD",
      frequency,
      category: selectedCategory,
      status: "active",
      startDate: start.toISOString(),
      renewalDate: renewalDate.toISOString(),
      icon: icons.wallet,
      billing: frequency,
      color: CATEGORY_COLORS[selectedCategory],
    });

    resetAndClose();
  };

  return (
    <Modal
      animationType="slide"
      onRequestClose={resetAndClose}
      transparent
      visible={visible}
    >
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable
          accessibilityLabel="Close new subscription form"
          className="modal-overlay"
          onPress={resetAndClose}
        >
          <Pressable className="modal-container" onPress={(event) => event.stopPropagation()}>
            <View className="modal-header">
              <Text className="modal-title">New Subscription</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                className="modal-close"
                onPress={resetAndClose}
              >
                <Text className="modal-close-text">×</Text>
              </Pressable>
            </View>

            <ScrollView
              className="modal-body"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View className="auth-form">
                <View className="auth-field">
                  <Text className="auth-label">Name</Text>
                  <TextInput
                    accessibilityLabel="Name"
                    autoCapitalize="words"
                    className="auth-input"
                    onChangeText={setName}
                    placeholder="e.g. Netflix"
                    placeholderTextColor="rgba(0, 0, 0, 0.45)"
                    returnKeyType="next"
                    value={name}
                  />
                </View>

                <View className="auth-field">
                  <Text className="auth-label">Price</Text>
                  <TextInput
                    accessibilityLabel="Price"
                    className="auth-input"
                    keyboardType="decimal-pad"
                    onChangeText={setPrice}
                    placeholder="0.00"
                    placeholderTextColor="rgba(0, 0, 0, 0.45)"
                    value={price}
                  />
                </View>

                <View className="auth-field">
                  <Text className="auth-label">Frequency</Text>
                  <View className="picker-row">
                    {(["Monthly", "Yearly"] as const).map((option) => (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityState={{ selected: frequency === option }}
                        className={clsx(
                          "picker-option",
                          frequency === option && "picker-option-active",
                        )}
                        key={option}
                        onPress={() => setFrequency(option)}
                      >
                        <Text
                          className={clsx(
                            "picker-option-text",
                            frequency === option && "picker-option-text-active",
                          )}
                        >
                          {option}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View className="auth-field">
                  <Text className="auth-label">Category</Text>
                  <View className="category-scroll">
                    {CATEGORIES.map((option) => (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityState={{ selected: category === option }}
                        className={clsx(
                          "category-chip",
                          category === option && "category-chip-active",
                        )}
                        key={option}
                        onPress={() => setCategory(option)}
                      >
                        <Text
                          className={clsx(
                            "category-chip-text",
                            category === option && "category-chip-text-active",
                          )}
                        >
                          {option}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <Pressable
                  accessibilityRole="button"
                  className={clsx("auth-button", !canSubmit && "auth-button-disabled")}
                  disabled={!canSubmit}
                  onPress={handleSubmit}
                >
                  <Text className="auth-button-text">Create Subscription</Text>
                </Pressable>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default CreateSubscriptionModal;
