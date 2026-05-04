# ResqLink – Copilot Instructions

## Project Type
React Native mobile app built with Expo (TypeScript).

## Architecture
- Single-screen app: all UI lives in `App.tsx`
- Theme constants in the `C` object at the top of `App.tsx`
- Emergency services defined in the `SERVICES` array
- Uses `@expo/vector-icons` for icons (Ionicons, FontAwesome5, MaterialCommunityIcons)

## Coding Conventions
- Functional components with hooks only
- `StyleSheet.create` for all styles (no inline style objects except dynamic ones)
- Animated API for all animations (useNativeDriver where possible)
- `react-native-safe-area-context` for safe area handling

## Key Notes
- GPS location is currently static — use `expo-location` to make it live
- The hold-to-send mechanic uses `Animated.timing` on a `holdProgress` ref
- Colors, fonts, and spacing all follow the dark-red theme defined in `C`
