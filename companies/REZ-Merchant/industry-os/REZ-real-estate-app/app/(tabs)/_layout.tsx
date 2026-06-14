import { Tabs } from "expo-router";
export default function TabLayout() {
  return <Tabs><Tabs.Screen name="index" options={{ title: "Dashboard" }} /><Tabs.Screen name="leads" options={{ title: "Leads" }} /><Tabs.Screen name="properties" options={{ title: "Properties" }} /><Tabs.Screen name="deals" options={{ title: "Deals" }} /><Tabs.Screen name="profile" options={{ title: "Profile" }} /></Tabs>;
}