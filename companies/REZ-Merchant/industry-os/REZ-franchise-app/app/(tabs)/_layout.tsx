import { Tabs } from "expo-router";
export default function TabLayout() {
  return <Tabs><Tabs.Screen name="index" options={{ title: "Dashboard" }} /><Tabs.Screen name="locations" options={{ title: "Locations" }} /><Tabs.Screen name="royalties" options={{ title: "Royalties" }} /><Tabs.Screen name="profile" options={{ title: "Profile" }} /></Tabs>;
}