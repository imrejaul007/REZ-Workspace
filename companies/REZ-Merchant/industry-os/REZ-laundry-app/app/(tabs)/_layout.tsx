import { Tabs } from "expo-router";
export default function TabLayout() {
  return <Tabs><Tabs.Screen name="index" options={{ title: "Dashboard" }} /><Tabs.Screen name="orders" options={{ title: "Orders" }} /><Tabs.Screen name="customers" options={{ title: "Customers" }} /><Tabs.Screen name="profile" options={{ title: "Profile" }} /></Tabs>;
}