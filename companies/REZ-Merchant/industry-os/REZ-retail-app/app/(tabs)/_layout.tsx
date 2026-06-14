import { Tabs } from "expo-router";
export default function TabLayout() {
  return <Tabs><Tabs.Screen name="index" options={{ title: "Dashboard" }} /><Tabs.Screen name="pos" options={{ title: "POS" }} /><Tabs.Screen name="inventory" options={{ title: "Inventory" }} /><Tabs.Screen name="loyalty" options={{ title: "Loyalty" }} /><Tabs.Screen name="profile" options={{ title: "Profile" }} /></Tabs>;
}