import { Tabs } from "expo-router";
export default function TabLayout() {
  return <Tabs><Tabs.Screen name="index" options={{ title: "Dashboard" }} /><Tabs.Screen name="bookings" options={{ title: "Bookings" }} /><Tabs.Screen name="flights" options={{ title: "Flights" }} /><Tabs.Screen name="hotels" options={{ title: "Hotels" }} /><Tabs.Screen name="profile" options={{ title: "Profile" }} /></Tabs>;
}