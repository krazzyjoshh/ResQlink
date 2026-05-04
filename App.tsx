import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// ─── Theme ───────────────────────────────────────────────────────────────────
const C = {
  bg: '#07070e',
  card: '#0f0f1a',
  cardBorder: '#1a1a2e',
  primary: '#e53935',
  primaryDark: '#b71c1c',
  primaryGlow: 'rgba(229,57,53,0.25)',
  accent: '#ef5350',
  green: '#00e676',
  greenDim: 'rgba(0,230,118,0.15)',
  yellow: '#ffd740',
  text: '#ffffff',
  textSub: '#8888aa',
  textMuted: '#44445a',
  gradient1: '#1a0a0a',
};

// ─── Emergency Services ───────────────────────────────────────────────────────
const SERVICES = [
  { id: 'hospital',   label: 'Hospital',   icon: 'hospital',        lib: 'FontAwesome5', color: '#e53935' },
  { id: 'ambulance',  label: 'Ambulance',  icon: 'ambulance',       lib: 'FontAwesome5', color: '#ef5350' },
  { id: 'security',   label: 'Security',   icon: 'shield-checkmark',lib: 'Ionicons',     color: '#5c6bc0' },
  { id: 'bfp',        label: 'BFP',        icon: 'fire',            lib: 'FontAwesome5', color: '#ff7043' },
  { id: 'redcross',   label: 'Red Cross',  icon: 'medkit',          lib: 'FontAwesome5', color: '#e53935' },
  { id: 'barangay',   label: 'Barangay',   icon: 'people',          lib: 'Ionicons',     color: '#26a69a' },
];

// ─── ServiceIcon helper ───────────────────────────────────────────────────────
function ServiceIcon({ lib, icon, color, size }: { lib: string; icon: string; color: string; size: number }) {
  if (lib === 'FontAwesome5') return <FontAwesome5 name={icon as any} size={size} color={color} />;
  return <Ionicons name={icon as any} size={size} color={color} />;
}

// ─── PulseRing ────────────────────────────────────────────────────────────────
function PulseRing({ active }: { active: boolean }) {
  const scale1 = useRef(new Animated.Value(1)).current;
  const opacity1 = useRef(new Animated.Value(0.7)).current;
  const scale2 = useRef(new Animated.Value(1)).current;
  const opacity2 = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (!active) return;
    const pulse = (scaleVal: Animated.Value, opacityVal: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(scaleVal, { toValue: 2.2, duration: 1500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
            Animated.timing(opacityVal, { toValue: 0, duration: 1500, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(scaleVal, { toValue: 1, duration: 0, useNativeDriver: true }),
            Animated.timing(opacityVal, { toValue: 0.5, duration: 0, useNativeDriver: true }),
          ]),
        ])
      );
    const a1 = pulse(scale1, opacity1, 0);
    const a2 = pulse(scale2, opacity2, 700);
    a1.start();
    a2.start();
    return () => { a1.stop(); a2.stop(); };
  }, [active]);

  if (!active) return null;
  return (
    <>
      <Animated.View style={[styles.pulseRing, { transform: [{ scale: scale1 }], opacity: opacity1 }]} />
      <Animated.View style={[styles.pulseRing, { transform: [{ scale: scale2 }], opacity: opacity2 }]} />
    </>
  );
}

// ─── LiveBadge ────────────────────────────────────────────────────────────────
function LiveBadge() {
  const blink = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(blink, { toValue: 0.2, duration: 800, useNativeDriver: true }),
        Animated.timing(blink, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <View style={styles.liveBadge}>
      <Animated.View style={[styles.liveDot, { opacity: blink }]} />
      <Text style={styles.liveText}>LIVE</Text>
    </View>
  );
}

// ─── ServiceCard ──────────────────────────────────────────────────────────────
function ServiceCard({ service, selected, onPress }: { service: typeof SERVICES[0]; selected: boolean; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.93, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={handlePress} style={styles.serviceCardWrapper}>
      <Animated.View style={[styles.serviceCard, selected && styles.serviceCardSelected, { transform: [{ scale }] }]}>
        {selected && <View style={[styles.serviceCardGlow, { backgroundColor: service.color + '22' }]} />}
        <View style={[styles.serviceIconBg, { backgroundColor: service.color + '22', borderColor: service.color + '55' }]}>
          <ServiceIcon lib={service.lib} icon={service.icon} color={selected ? service.color : C.textSub} size={22} />
        </View>
        <Text style={[styles.serviceLabel, selected && { color: C.text }]}>{service.label}</Text>
        <Text style={[styles.serviceTap, selected && { color: service.color }]}>
          {selected ? 'Selected ✓' : 'Tap to alert'}
        </Text>
        {selected && <View style={[styles.serviceSelectedBorder, { borderColor: service.color }]} />}
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [alertSent, setAlertSent] = useState(false);
  const [holdProgress] = useState(new Animated.Value(0));
  const holdAnim = useRef<Animated.CompositeAnimation | null>(null);
  const btnScale = useRef(new Animated.Value(1)).current;

  const location = 'Rizal Avenue, Quezon City';
  const accuracy = '±6m';

  const toggleService = (id: string) => {
    setSelectedServices(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const sendAlert = () => {
    if (selectedServices.size === 0) {
      Alert.alert('No Service Selected', 'Please select at least one emergency service before sending an alert.', [{ text: 'OK' }]);
      return;
    }
    setAlertSent(true);
    Alert.alert(
      '🚨 Alert Sent!',
      `Emergency alert dispatched to: ${[...selectedServices].join(', ')}.\n\nHelp is on the way.`,
      [{ text: 'OK', onPress: () => setAlertSent(false) }]
    );
  };

  const onHoldIn = () => {
    Animated.timing(btnScale, { toValue: 0.96, duration: 100, useNativeDriver: true }).start();
    holdAnim.current = Animated.timing(holdProgress, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    });
    holdAnim.current.start(({ finished }) => {
      if (finished) {
        // Auto-select nearest and send
        setSelectedServices(new Set(SERVICES.map(s => s.id)));
        setTimeout(() => sendAlert(), 300);
        holdProgress.setValue(0);
      }
    });
  };

  const onHoldOut = () => {
    Animated.timing(btnScale, { toValue: 1, duration: 100, useNativeDriver: true }).start();
    holdAnim.current?.stop();
    Animated.timing(holdProgress, { toValue: 0, duration: 400, useNativeDriver: false }).start();
  };

  const holdWidth = holdProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.planBadge}>
              <View style={styles.planDot} />
              <Text style={styles.planText}>FREE PLAN · READY TO RESPOND</Text>
            </View>
            <Text style={styles.greeting}>Hello, Gwyneth</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>G</Text>
          </View>
        </View>

        {/* ── GPS ── */}
        <View style={styles.gpsCard}>
          <View style={styles.gpsRow}>
            <View style={styles.gpsIconWrap}>
              <Ionicons name="location" size={18} color={C.green} />
            </View>
            <View style={styles.gpsInfo}>
              <Text style={styles.gpsLabel}>GPS LOCATION</Text>
              <Text style={styles.gpsAddress}>{location}</Text>
              <Text style={styles.gpsAccuracy}>Accuracy {accuracy}</Text>
            </View>
            <LiveBadge />
          </View>
        </View>

        {/* ── Emergency Services ── */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconBg}>
            <Ionicons name="flash" size={14} color={C.primary} />
          </View>
          <Text style={styles.sectionTitle}>EMERGENCY SERVICES</Text>
        </View>
        <Text style={styles.sectionSub}>Contact Agencies Instantly</Text>

        <View style={styles.servicesGrid}>
          {SERVICES.map(service => (
            <ServiceCard
              key={service.id}
              service={service}
              selected={selectedServices.has(service.id)}
              onPress={() => toggleService(service.id)}
            />
          ))}
        </View>

        {/* ── Emergency Button ── */}
        <View style={styles.alertButtonWrapper}>
          <PulseRing active={alertSent} />
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={sendAlert}
            onPressIn={onHoldIn}
            onPressOut={onHoldOut}
            delayLongPress={3000}
          >
            <Animated.View style={[styles.alertButton, { transform: [{ scale: btnScale }] }]}>
              {/* Hold progress bar */}
              <Animated.View style={[styles.holdBar, { width: holdWidth }]} />
              <View style={styles.alertButtonInner}>
                <Ionicons name="warning" size={22} color="#fff" />
                <View style={styles.alertTextBlock}>
                  <Text style={styles.alertButtonText}>TAP TO SEND</Text>
                  <Text style={styles.alertButtonTextBig}>EMERGENCY ALERT</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.5)" />
              </View>
            </Animated.View>
          </TouchableOpacity>
          <Text style={styles.alertHint}>One tap = instant help · Hold for 3 secs to auto-select nearest</Text>
        </View>

        {/* ── Premium Banner ── */}
        <View style={styles.premiumCard}>
          <View style={styles.premiumLeft}>
            <View style={styles.premiumBadge}>
              <Ionicons name="star" size={10} color="#ffd740" />
              <Text style={styles.premiumBadgeText}>PREMIUM</Text>
            </View>
            <Text style={styles.premiumTitle}>Upgrade to Premium</Text>
            <Text style={styles.premiumSub}>Family alerts, ambulance booking{'\n'}& priority dispatch</Text>
          </View>
          <View style={styles.premiumRight}>
            <Text style={styles.premiumPrice}>₱49</Text>
            <Text style={styles.premiumPer}>/mo</Text>
          </View>
        </View>

        {/* ── Live Response ── */}
        <View style={styles.responseCard}>
          <View style={styles.responseHeader}>
            <LiveBadge />
            <Text style={styles.responseTitle}>LIVE RESPONSE</Text>
          </View>
          <Text style={styles.responseStatus}>No Active Alert</Text>
          <Text style={styles.responseSub}>
            Choose a service or use the emergency button to start an urgent dispatch.
          </Text>
          {/* Radar visual */}
          <View style={styles.radarWrapper}>
            <View style={styles.radarOuter}>
              <View style={styles.radarMid}>
                <View style={styles.radarInner}>
                  <Ionicons name="radio-outline" size={28} color={C.primary} />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ── Network Status ── */}
        <View style={styles.networkCard}>
          <View style={styles.networkHeader}>
            <View style={[styles.networkDot, { backgroundColor: C.green }]} />
            <Text style={styles.networkTitle}>NETWORK STATUS</Text>
          </View>
          <Text style={styles.networkStatus}>Connected Response Grid</Text>
          <Text style={styles.networkSub}>
            Alerts route to the nearest unit using live GPS and service selection.
          </Text>
          <View style={styles.networkStats}>
            {[
              { label: 'Response Units', value: '47 Active' },
              { label: 'Avg ETA', value: '4.2 min' },
              { label: 'Coverage', value: '98.6%' },
            ].map(stat => (
              <View key={stat.label} style={styles.networkStat}>
                <Text style={styles.networkStatValue}>{stat.value}</Text>
                <Text style={styles.networkStatLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>ResqLink · Emergency Response Network</Text>
          <Text style={styles.footerVersion}>v1.0.0 · Free Plan</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, marginBottom: 16 },
  headerLeft: { flex: 1 },
  planBadge: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  planDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.green, marginRight: 6 },
  planText: { fontSize: 10, color: C.green, fontWeight: '700', letterSpacing: 1 },
  greeting: { fontSize: 26, fontWeight: '800', color: C.text },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.primaryGlow, borderWidth: 2, borderColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '800', color: C.primary },

  // GPS
  gpsCard: { backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.cardBorder, padding: 14, marginBottom: 20 },
  gpsRow: { flexDirection: 'row', alignItems: 'center' },
  gpsIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.greenDim, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  gpsInfo: { flex: 1 },
  gpsLabel: { fontSize: 9, color: C.textSub, letterSpacing: 1.2, fontWeight: '700', marginBottom: 2 },
  gpsAddress: { fontSize: 14, color: C.text, fontWeight: '600' },
  gpsAccuracy: { fontSize: 11, color: C.textSub, marginTop: 1 },

  // Live badge
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(229,57,53,0.12)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(229,57,53,0.3)' },
  liveDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: C.primary, marginRight: 4 },
  liveText: { fontSize: 9, color: C.primary, fontWeight: '800', letterSpacing: 1 },

  // Section
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  sectionIconBg: { width: 22, height: 22, borderRadius: 6, backgroundColor: C.primaryGlow, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  sectionTitle: { fontSize: 11, color: C.textSub, fontWeight: '700', letterSpacing: 1.2 },
  sectionSub: { fontSize: 18, color: C.text, fontWeight: '800', marginBottom: 14 },

  // Services grid
  servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5, marginBottom: 20 },
  serviceCardWrapper: { width: '33.33%', paddingHorizontal: 5, marginBottom: 10 },
  serviceCard: { backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.cardBorder, padding: 12, alignItems: 'center', overflow: 'hidden' },
  serviceCardSelected: { borderColor: 'transparent' },
  serviceCardGlow: { ...StyleSheet.absoluteFillObject, borderRadius: 14 },
  serviceSelectedBorder: { ...StyleSheet.absoluteFillObject, borderRadius: 14, borderWidth: 1.5 },
  serviceIconBg: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginBottom: 8 },
  serviceLabel: { fontSize: 12, color: C.text, fontWeight: '700', marginBottom: 2, textAlign: 'center' },
  serviceTap: { fontSize: 10, color: C.textMuted, textAlign: 'center' },

  // Alert button
  alertButtonWrapper: { alignItems: 'center', marginBottom: 20 },
  pulseRing: { position: 'absolute', width: 70, height: 70, borderRadius: 35, backgroundColor: C.primaryGlow, alignSelf: 'center', top: 12 },
  alertButton: {
    width: width - 32,
    backgroundColor: C.primary,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  holdBar: { position: 'absolute', top: 0, left: 0, height: '100%', backgroundColor: 'rgba(255,255,255,0.15)' },
  alertButtonInner: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 12 },
  alertTextBlock: { flex: 1 },
  alertButtonText: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '600', letterSpacing: 1 },
  alertButtonTextBig: { fontSize: 18, color: C.text, fontWeight: '900', letterSpacing: 0.5 },
  alertHint: { fontSize: 11, color: C.textSub, marginTop: 8, textAlign: 'center' },

  // Premium
  premiumCard: { backgroundColor: '#1a0f0f', borderRadius: 16, borderWidth: 1, borderColor: '#3a1a1a', padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  premiumLeft: { flex: 1 },
  premiumBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,215,64,0.12)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 6 },
  premiumBadgeText: { fontSize: 9, color: C.yellow, fontWeight: '800', letterSpacing: 1, marginLeft: 4 },
  premiumTitle: { fontSize: 16, color: C.text, fontWeight: '800', marginBottom: 4 },
  premiumSub: { fontSize: 12, color: C.textSub, lineHeight: 18 },
  premiumRight: { alignItems: 'center', justifyContent: 'center', backgroundColor: C.primaryGlow, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(229,57,53,0.3)' },
  premiumPrice: { fontSize: 22, color: C.primary, fontWeight: '900' },
  premiumPer: { fontSize: 11, color: C.textSub },

  // Response
  responseCard: { backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.cardBorder, padding: 16, marginBottom: 16 },
  responseHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  responseTitle: { fontSize: 11, color: C.textSub, fontWeight: '700', letterSpacing: 1.2 },
  responseStatus: { fontSize: 20, color: C.text, fontWeight: '800', marginBottom: 6 },
  responseSub: { fontSize: 13, color: C.textSub, lineHeight: 20, marginBottom: 16 },
  radarWrapper: { alignItems: 'center', paddingVertical: 8 },
  radarOuter: { width: 100, height: 100, borderRadius: 50, borderWidth: 1, borderColor: 'rgba(229,57,53,0.15)', alignItems: 'center', justifyContent: 'center' },
  radarMid: { width: 70, height: 70, borderRadius: 35, borderWidth: 1, borderColor: 'rgba(229,57,53,0.25)', alignItems: 'center', justifyContent: 'center' },
  radarInner: { width: 46, height: 46, borderRadius: 23, borderWidth: 1, borderColor: 'rgba(229,57,53,0.4)', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(229,57,53,0.08)' },

  // Network
  networkCard: { backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.cardBorder, padding: 16, marginBottom: 16 },
  networkHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  networkDot: { width: 7, height: 7, borderRadius: 3.5 },
  networkTitle: { fontSize: 11, color: C.textSub, fontWeight: '700', letterSpacing: 1.2 },
  networkStatus: { fontSize: 18, color: C.text, fontWeight: '800', marginBottom: 6 },
  networkSub: { fontSize: 13, color: C.textSub, lineHeight: 19, marginBottom: 16 },
  networkStats: { flexDirection: 'row', justifyContent: 'space-between' },
  networkStat: { alignItems: 'center', flex: 1 },
  networkStatValue: { fontSize: 15, color: C.green, fontWeight: '800', marginBottom: 2 },
  networkStatLabel: { fontSize: 10, color: C.textSub, textAlign: 'center' },

  // Footer
  footer: { alignItems: 'center', paddingTop: 12 },
  footerText: { fontSize: 11, color: C.textMuted },
  footerVersion: { fontSize: 10, color: C.textMuted, marginTop: 2 },
});
