import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_bottom',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen
        name="add-item"
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen
        name="bulk-add"
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen
        name="location-photo"
        options={{ presentation: 'fullScreenModal' }}
      />
      <Stack.Screen
        name="settings"
        options={{ presentation: 'modal' }}
      />
    </Stack>
  );
}
