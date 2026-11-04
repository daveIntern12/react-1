import { Text } from "react-native";
import { useCssElement } from "react-native-css";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

export const SafeAreaView = (
  props: React.ComponentProps<typeof RNSafeAreaView> & { className?: string },
) => useCssElement(RNSafeAreaView, props, { className: "style" });

const insights = () => {
  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <Text>insights</Text>
    </SafeAreaView>
  );
};

export default insights;
