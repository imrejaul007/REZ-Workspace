import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: "Home", headerShown: false }} />
      <Tabs.Screen name="orders" options={{ title: "Orders", headerShown: false }} />
      <Tabs.Screen name="menu" options={{ title: "Menu", headerShown: false }} />
      <Tabs.Screen name="analytics" options={{ title: "Analytics", headerShown: false }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", headerShown: false }} />
    </Tabs>
  );
}