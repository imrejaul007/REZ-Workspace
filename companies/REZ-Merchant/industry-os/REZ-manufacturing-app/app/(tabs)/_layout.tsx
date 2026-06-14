import { Tabs } from "expo-router";
export default function TabLayout() {
  return <Tabs><Tabs.Screen name="index" options={{ title: "Dashboard" }} /><Tabs.Screen name="production" options={{ title: "Production" }} /><Tabs.Screen name="inventory" options={{ title: "Inventory" }} /><Tabs.Screen name="profile" options={{ title: "Profile" }} /></Tabs>;
}