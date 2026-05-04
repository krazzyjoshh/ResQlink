import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Easing, Alert, Dimensions, Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

const { width } = Dimensions.get('window');

// ─── Theme ───────────────────────────────────────────────────────────────────
const C = {
  bg: '#07070e', card: '#0f0f1a', cardBorder: '#1a1a2e',
  primary: '#e53935', primaryDark: '#b71c1c',
  primaryGlow: 'rgba(229,57,53,0.25)', accent: '#ef5350',
  green: '#00e676', greenDim: 'rgba(0,230,118,0.15)',
  yellow: '#ffd740', text: '#ffffff', textSub: '#8888aa', textMuted: '#44445a',
};

// ─── Emergency Services ───────────────────────────────────────────────────────
const SERVICES = [
  { id: 'hospital',  label: 'Hospital',  icon: 'hospital',        lib: 'FontAwesome5', color: '#e53935' },
  { id: 'ambulance', label: 'Ambulance', icon: 'ambulance',       lib: 'FontAwesome5', color: '#ef5350' },
  { id: 'security',  label: 'Security',  icon: 'shield-checkmark',lib: 'Ionicons',     color: '#5c6bc0' },
  { id: 'bfp',       label: 'BFP',       icon: 'fire',            lib: 'FontAwesome5', color: '#ff7043' },
  { id: 'redcross',  label: 'Red Cross', icon: 'medkit',          lib: 'FontAwesome5', color: '#e53935' },
  { id: 'barangay',  label: 'Barangay',  icon: 'people',          lib: 'Ionicons',     color: '#26a69a' },
];

function ServiceIcon({ lib, icon, color, size }: { lib: string; icon: string; color: string; size: number }) {
  if (lib === 'FontAwesome5') return <FontAwesome5 name={icon as any} size={size} color={color} />;
  return <Ionicons name={icon as any} size={size} color={color} />;
}

function PulseRing({ active }: { active: boolean }) {
  const scale1 = useRef(new Animated.Value(1)).current;
  const opacity1 = useRef(new Animated.Value(0.7)).current;
  const scale2 = useRef(new Animated.Value(1)).current;
  const opacity2 = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    if (!active) return;
    const pulse = (sv: Animated.Value, ov: Animated.Value, d: number) =>
      Animated.loop(Animated.sequence([
        Animated.delay(d),
        Animated.parallel([
          Animated.timing(sv, { toValue: 2.2, duration: 1500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(ov, { toValue: 0, duration: 1500, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(sv, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(ov, { toValue: 0.5, duration: 0, useNativeDriver: true }),
        ]),
      ]));
    const a1 = pulse(scale1, opacity1, 0); const a2 = pulse(scale2, opacity2, 700);
    a1.start(); a2.start();
    return () => { a1.stop(); a2.stop(); };
  }, [active]);
  if (!active) return null;
  return (<>
    <Animated.View style={[styles.pulseRing, { transform: [{ scale: scale1 }], opacity: opacity1 }]} />
    <Animated.View style={[styles.pulseRing, { transform: [{ scale: scale2 }], opacity: opacity2 }]} />
  </>);
}

function LiveBadge() {
  const blink = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(blink, { toValue: 0.2, duration: 800, useNativeDriver: true }),
      Animated.timing(blink, { toValue: 1, duration: 800, useNativeDriver: true }),
    ])).start();
  }, []);
  return (
    <View style={styles.liveBadge}>
      <Animated.View style={[styles.liveDot, { opacity: blink }]} />
      <Text style={styles.liveText}>LIVE</Text>
    </View>
  );
}

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
        <Text style={[styles.serviceTap, selected && { color: service.color }]}>{selected ? 'Selected ✓' : 'Tap to alert'}</Text>
        {selected && <View style={[styles.serviceSelectedBorder, { borderColor: service.color }]} />}
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Main Home ────────────────────────────────────────────────────────────────
export default function HomeScreen({ userName, onLogout }: { userName: string; onLogout: () => void }) {
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [alertSent, setAlertSent] = useState(false);
  const [holdProgress] = useState(new Animated.Value(0));
  const holdAnim = useRef<Animated.CompositeAnimation | null>(null);
  const btnScale = useRef(new Animated.Value(1)).current;

  // ─── Location state ───
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [address, setAddress] = useState('Acquiring location...');
  const [accuracy, setAccuracy] = useState('--');
  const [locError, setLocError] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setLocError('Location permission denied'); setAddress('Permission denied'); return; }
      // Get initial position
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation(loc);
      setAccuracy(`±${Math.round(loc.coords.accuracy ?? 0)}m`);
      // Reverse geocode
      try {
        const geo = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        if (geo.length > 0) {
          const g = geo[0];
          setAddress([g.street, g.city, g.region].filter(Boolean).join(', ') || 'Location found');
        }
      } catch { setAddress(`${loc.coords.latitude.toFixed(5)}, ${loc.coords.longitude.toFixed(5)}`); }
      // Watch position
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 5 },
        (newLoc) => {
          setLocation(newLoc);
          setAccuracy(`±${Math.round(newLoc.coords.accuracy ?? 0)}m`);
        }
      );
    })();
    return () => { sub?.remove(); };
  }, []);

  const toggleService = (id: string) => {
    setSelectedServices(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const sendAlert = () => {
    if (selectedServices.size === 0) {
      Alert.alert('No Service Selected', 'Please select at least one emergency service.'); return;
    }
    setAlertSent(true);
    const coords = location ? `\nCoordinates: ${location.coords.latitude.toFixed(5)}, ${location.coords.longitude.toFixed(5)}` : '';
    Alert.alert('🚨 Alert Sent!', `Emergency alert dispatched to: ${[...selectedServices].join(', ')}.${coords}\n\nHelp is on the way.`,
      [{ text: 'OK', onPress: () => setAlertSent(false) }]);
  };

  const onHoldIn = () => {
    Animated.timing(btnScale, { toValue: 0.96, duration: 100, useNativeDriver: true }).start();
    holdAnim.current = Animated.timing(holdProgress, { toValue: 1, duration: 3000, useNativeDriver: false });
    holdAnim.current.start(({ finished }) => {
      if (finished) {
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

  const region = location ? {
    latitude: location.coords.latitude, longitude: location.coords.longitude,
    latitudeDelta: 0.008, longitudeDelta: 0.008,
  } : { latitude: 14.6760, longitude: 121.0437, latitudeDelta: 0.05, longitudeDelta: 0.05 };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.planBadge}><View style={styles.planDot} /><Text style={styles.planText}>FREE PLAN · READY TO RESPOND</Text></View>
            <Text style={styles.greeting}>Hello, {userName}</Text>
          </View>
          <TouchableOpacity style={styles.avatar} onPress={onLogout}>
            <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        {/* ── GPS Card ── */}
        <View style={styles.gpsCard}>
          <View style={styles.gpsRow}>
            <View style={styles.gpsIconWrap}><Ionicons name="location" size={18} color={C.green} /></View>
            <View style={styles.gpsInfo}>
              <Text style={styles.gpsLabel}>GPS LOCATION</Text>
              <Text style={styles.gpsAddress}>{address}</Text>
              <Text style={styles.gpsAccuracy}>Accuracy {accuracy}</Text>
            </View>
            <LiveBadge />
          </View>
        </View>

        {/* ── Live Map ── */}
        <View style={styles.mapSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBg}><Ionicons name="map" size={14} color={C.green} /></View>
            <Text style={styles.sectionTitle}>YOUR LOCATION</Text>
          </View>
          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              style={styles.map}
              region={region}
              showsUserLocation={true}
              showsMyLocationButton={false}
              customMapStyle={mapDarkStyle}
            >
              {location && (
                <Marker
                  coordinate={{ latitude: location.coords.latitude, longitude: location.coords.longitude }}
                  title="Your Location"
                  description={address}
                />
              )}
            </MapView>
            {location && (
              <View style={styles.coordsBadge}>
                <Ionicons name="navigate" size={12} color={C.green} />
                <Text style={styles.coordsText}>
                  {location.coords.latitude.toFixed(5)}, {location.coords.longitude.toFixed(5)}
                </Text>
              </View>
            )}
            <TouchableOpacity style={styles.recenterBtn}
              onPress={() => location && mapRef.current?.animateToRegion({ ...region, latitudeDelta: 0.005, longitudeDelta: 0.005 }, 500)}>
              <Ionicons name="locate" size={18} color={C.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Emergency Services ── */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconBg}><Ionicons name="flash" size={14} color={C.primary} /></View>
          <Text style={styles.sectionTitle}>EMERGENCY SERVICES</Text>
        </View>
        <Text style={styles.sectionSub}>Contact Agencies Instantly</Text>
        <View style={styles.servicesGrid}>
          {SERVICES.map(s => <ServiceCard key={s.id} service={s} selected={selectedServices.has(s.id)} onPress={() => toggleService(s.id)} />)}
        </View>

        {/* ── Emergency Button ── */}
        <View style={styles.alertButtonWrapper}>
          <PulseRing active={alertSent} />
          <TouchableOpacity activeOpacity={0.9} onPress={sendAlert} onPressIn={onHoldIn} onPressOut={onHoldOut} delayLongPress={3000}>
            <Animated.View style={[styles.alertButton, { transform: [{ scale: btnScale }] }]}>
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
            <View style={styles.premiumBadge}><Ionicons name="star" size={10} color="#ffd740" /><Text style={styles.premiumBadgeText}>PREMIUM</Text></View>
            <Text style={styles.premiumTitle}>Upgrade to Premium</Text>
            <Text style={styles.premiumSub}>Family alerts, ambulance booking{'\n'}& priority dispatch</Text>
          </View>
          <View style={styles.premiumRight}><Text style={styles.premiumPrice}>₱49</Text><Text style={styles.premiumPer}>/mo</Text></View>
        </View>

        {/* ── Network Status ── */}
        <View style={styles.networkCard}>
          <View style={styles.networkHeader}><View style={[styles.networkDot, { backgroundColor: C.green }]} /><Text style={styles.networkTitle}>NETWORK STATUS</Text></View>
          <Text style={styles.networkStatus}>Connected Response Grid</Text>
          <Text style={styles.networkSub}>Alerts route to the nearest unit using live GPS and service selection.</Text>
          <View style={styles.networkStats}>
            {[{ label: 'Response Units', value: '47 Active' }, { label: 'Avg ETA', value: '4.2 min' }, { label: 'Coverage', value: '98.6%' }].map(stat => (
              <View key={stat.label} style={styles.networkStat}><Text style={styles.networkStatValue}>{stat.value}</Text><Text style={styles.networkStatLabel}>{stat.label}</Text></View>
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

// ─── Dark map style ───
const mapDarkStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1d1d2e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8888aa' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0f0f1a' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2a2a3e' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1a1a2e' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e0e1a' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
];

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, marginBottom: 16 },
  headerLeft: { flex: 1 },
  planBadge: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  planDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.green, marginRight: 6 },
  planText: { fontSize: 10, color: C.green, fontWeight: '700', letterSpacing: 1 },
  greeting: { fontSize: 26, fontWeight: '800', color: C.text },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.primaryGlow, borderWidth: 2, borderColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '800', color: C.primary },
  gpsCard: { backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.cardBorder, padding: 14, marginBottom: 20 },
  gpsRow: { flexDirection: 'row', alignItems: 'center' },
  gpsIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.greenDim, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  gpsInfo: { flex: 1 },
  gpsLabel: { fontSize: 9, color: C.textSub, letterSpacing: 1.2, fontWeight: '700', marginBottom: 2 },
  gpsAddress: { fontSize: 14, color: C.text, fontWeight: '600' },
  gpsAccuracy: { fontSize: 11, color: C.textSub, marginTop: 1 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(229,57,53,0.12)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(229,57,53,0.3)' },
  liveDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: C.primary, marginRight: 4 },
  liveText: { fontSize: 9, color: C.primary, fontWeight: '800', letterSpacing: 1 },
  // Map
  mapSection: { marginBottom: 20 },
  mapContainer: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.cardBorder, height: 220, marginTop: 8 },
  map: { width: '100%', height: '100%' },
  coordsBadge: { position: 'absolute', bottom: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(15,15,26,0.9)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: C.cardBorder },
  coordsText: { fontSize: 11, color: C.green, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  recenterBtn: { position: 'absolute', top: 10, right: 10, width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(15,15,26,0.9)', borderWidth: 1, borderColor: C.cardBorder, alignItems: 'center', justifyContent: 'center' },
  // Section
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  sectionIconBg: { width: 22, height: 22, borderRadius: 6, backgroundColor: C.primaryGlow, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  sectionTitle: { fontSize: 11, color: C.textSub, fontWeight: '700', letterSpacing: 1.2 },
  sectionSub: { fontSize: 18, color: C.text, fontWeight: '800', marginBottom: 14 },
  servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5, marginBottom: 20 },
  serviceCardWrapper: { width: '33.33%', paddingHorizontal: 5, marginBottom: 10 },
  serviceCard: { backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.cardBorder, padding: 12, alignItems: 'center', overflow: 'hidden' },
  serviceCardSelected: { borderColor: 'transparent' },
  serviceCardGlow: { ...StyleSheet.absoluteFillObject, borderRadius: 14 },
  serviceSelectedBorder: { ...StyleSheet.absoluteFillObject, borderRadius: 14, borderWidth: 1.5 },
  serviceIconBg: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginBottom: 8 },
  serviceLabel: { fontSize: 12, color: C.text, fontWeight: '700', marginBottom: 2, textAlign: 'center' },
  serviceTap: { fontSize: 10, color: C.textMuted, textAlign: 'center' },
  alertButtonWrapper: { alignItems: 'center', marginBottom: 20 },
  pulseRing: { position: 'absolute', width: 70, height: 70, borderRadius: 35, backgroundColor: C.primaryGlow, alignSelf: 'center', top: 12 },
  alertButton: { width: width - 32, backgroundColor: C.primary, borderRadius: 18, overflow: 'hidden', shadowColor: C.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 12 },
  holdBar: { position: 'absolute', top: 0, left: 0, height: '100%', backgroundColor: 'rgba(255,255,255,0.15)' },
  alertButtonInner: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 12 },
  alertTextBlock: { flex: 1 },
  alertButtonText: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '600', letterSpacing: 1 },
  alertButtonTextBig: { fontSize: 18, color: C.text, fontWeight: '900', letterSpacing: 0.5 },
  alertHint: { fontSize: 11, color: C.textSub, marginTop: 8, textAlign: 'center' },
  premiumCard: { backgroundColor: '#1a0f0f', borderRadius: 16, borderWidth: 1, borderColor: '#3a1a1a', padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  premiumLeft: { flex: 1 },
  premiumBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,215,64,0.12)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 6 },
  premiumBadgeText: { fontSize: 9, color: C.yellow, fontWeight: '800', letterSpacing: 1, marginLeft: 4 },
  premiumTitle: { fontSize: 16, color: C.text, fontWeight: '800', marginBottom: 4 },
  premiumSub: { fontSize: 12, color: C.textSub, lineHeight: 18 },
  premiumRight: { alignItems: 'center', justifyContent: 'center', backgroundColor: C.primaryGlow, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(229,57,53,0.3)' },
  premiumPrice: { fontSize: 22, color: C.primary, fontWeight: '900' },
  premiumPer: { fontSize: 11, color: C.textSub },
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
  footer: { alignItems: 'center', paddingTop: 12 },
  footerText: { fontSize: 11, color: C.textMuted },
  footerVersion: { fontSize: 10, color: C.textMuted, marginTop: 2 },
});
