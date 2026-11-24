import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator,
  Alert, Platform
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Accelerometer, Gyroscope, Magnetometer, Barometer } from 'expo-sensors';
import * as Location from 'expo-location';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import MapView, { Marker } from 'react-native-maps';

const BLUE = '#38BDF8';
const BG = '#07111F';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [tab, setTab] = useState('sensors');

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.splash}>
          <View style={styles.logo}><Text style={styles.logoText}>S</Text></View>
          <Text style={styles.splashTitle}>SensoricaApp</Text>
          <Text style={styles.splashSubtitle}>Explorando los sensores de tu dispositivo</Text>
          <View style={styles.splashBottom}>
            <ActivityIndicator color={BLUE} size="large" />
            <Text style={styles.dev}>Desarrollado por Santiago Velandia</Text>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <View><Text style={styles.brand}>SensoricaApp</Text><Text style={styles.tag}>LABORATORIO DE SENSÓRICA</Text></View>
          <View style={styles.pill}><Text style={styles.pillText}>EXPO</Text></View>
        </View>
        <View style={styles.content}>
          {tab === 'sensors' ? <SensorsScreen /> : tab === 'gps' ? <GpsScreen /> : <CameraScreen />}
        </View>
        <View style={styles.nav}>
          <NavButton title="Sensores" symbol="◉" active={tab === 'sensors'} onPress={() => setTab('sensors')} />
          <NavButton title="GPS y mapa" symbol="⌖" active={tab === 'gps'} onPress={() => setTab('gps')} />
          <NavButton title="Cámara" symbol="▣" active={tab === 'camera'} onPress={() => setTab('camera')} />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function NavButton({ title, symbol, active, onPress }) {
  return <TouchableOpacity onPress={onPress} style={[styles.navBtn, active && styles.navActive]}>
    <Text style={[styles.navSymbol, active && {color: BLUE}]}>{symbol}</Text>
    <Text style={[styles.navText, active && {color: '#F8FAFC'}]}>{title}</Text>
  </TouchableOpacity>;
}

function SectionTitle({ eyebrow, title, detail }) {
  return <View style={{marginBottom: 18}}><Text style={styles.eyebrow}>{eyebrow}</Text><Text style={styles.sectionTitle}>{title}</Text>{!!detail && <Text style={styles.detail}>{detail}</Text>}</View>;
}
function Metric({ title, value, unit, description }) {
  return <View style={styles.metric}><Text style={styles.metricTitle}>{title}</Text><View style={styles.metricRow}><Text style={styles.metricValue}>{value}</Text><Text style={styles.unit}>{unit || ''}</Text></View>{!!description && <Text style={styles.metricDesc}>{description}</Text>}</View>;
}

function SensorsScreen() {
  const [values, setValues] = useState({acc:null, gyro:null, mag:null, pressure:null});
  const [availability, setAvailability] = useState({});
  useEffect(() => {
    let subscriptions = [];
    const subscribe = async (Sensor, key, setter) => {
      try {
        const available = await Sensor.isAvailableAsync();
        setAvailability(old => ({...old, [key]: available}));
        if (available) {
          if (Sensor.setUpdateInterval) Sensor.setUpdateInterval(500);
          subscriptions.push(Sensor.addListener(v => setter(old => ({...old, [key]: v}))));
        }
      } catch { setAvailability(old => ({...old, [key]: false})); }
    };
    subscribe(Accelerometer, 'acc', v => setValues(old => ({...old, acc:v})));
    subscribe(Gyroscope, 'gyro', v => setValues(old => ({...old, gyro:v})));
    subscribe(Magnetometer, 'mag', v => setValues(old => ({...old, mag:v})));
    subscribe(Barometer, 'pressure', v => setValues(old => ({...old, pressure:v})));
    return () => subscriptions.forEach(s => s.remove());
  }, []);
  const fmt = (v, k) => v ? `${Number(v[k] ?? 0).toFixed(2)}` : '—';
  const sensorStatus = key => availability[key] === undefined ? 'Consultando sensor…' : availability[key] ? 'Disponible' : 'No disponible en este dispositivo';
  return <ScrollView contentContainerStyle={styles.scroll}>
    <SectionTitle eyebrow="LECTURAS EN TIEMPO REAL" title="Sensores del dispositivo" detail="Valores entregados por el hardware del teléfono." />
    <View style={styles.grid}>
      <Metric title="Acelerómetro · X" value={fmt(values.acc,'x')} unit="m/s²" description={sensorStatus('acc')} />
      <Metric title="Acelerómetro · Y" value={fmt(values.acc,'y')} unit="m/s²" description={sensorStatus('acc')} />
      <Metric title="Acelerómetro · Z" value={fmt(values.acc,'z')} unit="m/s²" description={sensorStatus('acc')} />
      <Metric title="Giroscopio · X" value={fmt(values.gyro,'x')} unit="rad/s" description={sensorStatus('gyro')} />
      <Metric title="Giroscopio · Y" value={fmt(values.gyro,'y')} unit="rad/s" description={sensorStatus('gyro')} />
      <Metric title="Giroscopio · Z" value={fmt(values.gyro,'z')} unit="rad/s" description={sensorStatus('gyro')} />
      <Metric title="Magnetómetro · X" value={fmt(values.mag,'x')} unit="µT" description={sensorStatus('mag')} />
      <Metric title="Magnetómetro · Y" value={fmt(values.mag,'y')} unit="µT" description={sensorStatus('mag')} />
      <Metric title="Magnetómetro · Z" value={fmt(values.mag,'z')} unit="µT" description={sensorStatus('mag')} />
      <Metric title="Presión atmosférica" value={values.pressure ? Number(values.pressure.pressure).toFixed(2) : '—'} unit="hPa" description={sensorStatus('pressure')} />
    </View>
    <View style={styles.notice}><Text style={styles.noticeTitle}>Sensores ambientales solicitados</Text>
      <Text style={styles.noticeText}>Temperatura de batería, temperatura interna, temperatura ambiental, humedad y luz: Expo Go no ofrece una API universal para leer estos sensores. El valor solo puede mostrarse si el teléfono incorpora el sensor y se integra un módulo nativo compatible. No se muestran datos inventados.</Text>
    </View>
  </ScrollView>;
}

function GpsScreen() {
  const [permission, setPermission] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const locate = async () => {
    setLoading(true); setError('');
    try {
      const p = await Location.requestForegroundPermissionsAsync();
      setPermission(p.status);
      if (p.status !== 'granted') { setError('Debes permitir el acceso a la ubicación para continuar.'); return; }
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) { setError('Activa el GPS o los servicios de ubicación del teléfono.'); return; }
      const pos = await Location.getCurrentPositionAsync({accuracy: Location.Accuracy.Balanced});
      setLocation(pos);
    } catch (e) { setError('No fue posible obtener la ubicación. Comprueba el GPS e inténtalo de nuevo.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { locate(); }, []);
  const coords = location?.coords;
  return <ScrollView contentContainerStyle={styles.scroll}>
    <SectionTitle eyebrow="GEOLOCALIZACIÓN" title="Tu ubicación" detail="Consulta tus coordenadas y visualízalas en el mapa." />
    <View style={styles.panel}>
      {loading && !location ? <ActivityIndicator color={BLUE} /> : null}
      <Text style={styles.coordLabel}>LATITUD</Text><Text style={styles.coord}>{coords ? coords.latitude.toFixed(6) : '—'}</Text>
      <Text style={styles.coordLabel}>LONGITUD</Text><Text style={styles.coord}>{coords ? coords.longitude.toFixed(6) : '—'}</Text>
      <Text style={styles.detail}>Precisión: {coords ? `${Math.round(coords.accuracy || 0)} metros` : 'Sin datos'}</Text>
      {!!error && <Text style={styles.error}>{error}</Text>}
      <TouchableOpacity style={styles.primaryBtn} onPress={locate} disabled={loading}><Text style={styles.primaryText}>{loading ? 'Obteniendo ubicación…' : 'Actualizar ubicación'}</Text></TouchableOpacity>
    </View>
    {coords ? <View style={styles.mapWrap}><MapView style={styles.map} initialRegion={{latitude:coords.latitude,longitude:coords.longitude,latitudeDelta:0.008,longitudeDelta:0.008}} region={{latitude:coords.latitude,longitude:coords.longitude,latitudeDelta:0.008,longitudeDelta:0.008}}>
      <Marker coordinate={{latitude:coords.latitude,longitude:coords.longitude}} title="Mi ubicación" description="Ubicación actual del dispositivo" />
    </MapView></View> : <View style={styles.mapPlaceholder}><Text style={styles.detail}>El mapa aparecerá cuando se obtenga una ubicación válida.</Text></View>}
    <Text style={styles.small}>Estado del permiso: {permission || 'Pendiente'}</Text>
  </ScrollView>;
}

function CameraScreen() {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const cameraRef = useRef(null);
  const [facing, setFacing] = useState('back');
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);
  const takePhoto = async () => {
    if (!cameraRef.current || busy) return;
    try {
      setBusy(true);
      const result = await cameraRef.current.takePictureAsync({quality:0.85});
      setPhoto(result);
      let permission = mediaPermission;
      if (!permission?.granted) permission = await requestMediaPermission();
      if (permission?.granted) {
        await MediaLibrary.saveToLibraryAsync(result.uri);
        Alert.alert('Fotografía guardada', 'La imagen se guardó en la galería del teléfono.');
      } else {
        Alert.alert('Permiso requerido', 'La foto se tomó, pero debes permitir acceso a la galería para guardarla.');
      }
    } catch (e) { Alert.alert('Error', 'No se pudo capturar o guardar la fotografía.'); }
    finally { setBusy(false); }
  };
  const sharePhoto = async () => {
    if (!photo?.uri) return;
    try {
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(photo.uri);
      else Alert.alert('No disponible', 'La función de compartir no está disponible en este dispositivo.');
    } catch { Alert.alert('Error', 'No se pudo compartir la fotografía.'); }
  };
  if (!cameraPermission) return <View style={styles.center}><ActivityIndicator color={BLUE}/></View>;
  if (!cameraPermission.granted) return <View style={styles.scroll}><SectionTitle eyebrow="CÁMARA" title="Captura de fotografías"/><Text style={styles.detail}>Se necesita permiso para usar la cámara.</Text><TouchableOpacity style={styles.primaryBtn} onPress={requestCameraPermission}><Text style={styles.primaryText}>Permitir cámara</Text></TouchableOpacity></View>;
  return <ScrollView contentContainerStyle={styles.scroll}>
    <SectionTitle eyebrow="CAPTURA Y GALERÍA" title="Cámara" detail="Toma una fotografía, guárdala y compártela." />
    <View style={styles.cameraFrame}><CameraView ref={cameraRef} style={styles.camera} facing={facing} /></View>
    <View style={styles.buttonRow}>
      <TouchableOpacity style={styles.secondaryBtn} onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')}><Text style={styles.secondaryText}>Cambiar cámara</Text></TouchableOpacity>
      <TouchableOpacity style={styles.primaryBtn} onPress={takePhoto} disabled={busy}><Text style={styles.primaryText}>{busy ? 'Procesando…' : 'Tomar foto'}</Text></TouchableOpacity>
    </View>
    {photo && <View style={styles.panel}><Text style={styles.metricTitle}>Última fotografía capturada</Text><Text style={styles.detail}>La imagen se guardó en la galería si se concedió el permiso.</Text><TouchableOpacity style={styles.primaryBtn} onPress={sharePhoto}><Text style={styles.primaryText}>Compartir fotografía</Text></TouchableOpacity></View>}
  </ScrollView>;
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:BG}, splash:{flex:1,backgroundColor:BG,alignItems:'center',justifyContent:'center',padding:24},
  logo:{width:92,height:92,borderRadius:28,backgroundColor:'#12304A',borderWidth:1,borderColor:BLUE,alignItems:'center',justifyContent:'center',marginBottom:24},
  logoText:{fontSize:54,fontWeight:'900',color:BLUE}, splashTitle:{fontSize:32,fontWeight:'900',color:'#F8FAFC'}, splashSubtitle:{fontSize:13,color:'#94A3B8',marginTop:8,textAlign:'center'},
  splashBottom:{position:'absolute',bottom:55,alignItems:'center',gap:16},dev:{color:'#94A3B8',fontSize:12},
  header:{paddingHorizontal:20,paddingVertical:15,borderBottomWidth:1,borderBottomColor:'#1E293B',flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  brand:{color:'#F8FAFC',fontWeight:'900',fontSize:21},tag:{color:'#64748B',fontSize:9,letterSpacing:1.6,marginTop:3},pill:{backgroundColor:'#102C42',paddingHorizontal:11,paddingVertical:6,borderRadius:8},pillText:{color:BLUE,fontWeight:'800',fontSize:10},
  content:{flex:1},nav:{flexDirection:'row',backgroundColor:'#0D1B2B',borderTopWidth:1,borderTopColor:'#1E293B',paddingHorizontal:8,paddingVertical:7},
  navBtn:{flex:1,alignItems:'center',paddingVertical:7,borderRadius:10},navActive:{backgroundColor:'#132A40'},navSymbol:{fontSize:20,color:'#64748B'},navText:{fontSize:10,color:'#94A3B8',marginTop:3,fontWeight:'700'},
  scroll:{padding:18,paddingBottom:32},eyebrow:{color:BLUE,fontSize:10,fontWeight:'800',letterSpacing:1.8},sectionTitle:{color:'#F8FAFC',fontSize:25,fontWeight:'900',marginTop:5},detail:{color:'#94A3B8',fontSize:12,lineHeight:19,marginTop:6},
  grid:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between'},metric:{width:'48.3%',backgroundColor:'#101F30',borderWidth:1,borderColor:'#203348',borderRadius:14,padding:13,marginBottom:10,minHeight:112},
  metricTitle:{color:'#A8B8C9',fontSize:11,fontWeight:'700'},metricRow:{flexDirection:'row',alignItems:'baseline',marginTop:12},metricValue:{color:'#F8FAFC',fontSize:23,fontWeight:'800'},unit:{color:BLUE,fontSize:10,marginLeft:5},metricDesc:{color:'#64748B',fontSize:9,marginTop:7},
  notice:{backgroundColor:'#17283A',borderColor:'#31506A',borderWidth:1,borderRadius:14,padding:15,marginTop:8},noticeTitle:{color:'#F8FAFC',fontWeight:'800',fontSize:13},noticeText:{color:'#A8B8C9',fontSize:11,lineHeight:18,marginTop:7},
  panel:{backgroundColor:'#101F30',borderColor:'#203348',borderWidth:1,borderRadius:16,padding:17,marginBottom:16},coordLabel:{fontSize:10,color:'#64748B',fontWeight:'800',letterSpacing:1.4,marginTop:8},coord:{fontSize:24,color:'#F8FAFC',fontWeight:'800',marginTop:3},
  primaryBtn:{backgroundColor:'#1676B9',padding:14,borderRadius:11,alignItems:'center',marginTop:15},primaryText:{color:'white',fontWeight:'800',fontSize:12},
  error:{color:'#FDA4AF',fontSize:12,marginTop:12},mapWrap:{height:280,borderRadius:16,overflow:'hidden',borderWidth:1,borderColor:'#203348'},map:{width:'100%',height:'100%'},
  mapPlaceholder:{height:160,backgroundColor:'#101F30',borderRadius:16,alignItems:'center',justifyContent:'center',padding:20},small:{fontSize:10,color:'#64748B',marginTop:12},
  cameraFrame:{height:390,borderRadius:16,overflow:'hidden',backgroundColor:'#000',marginTop:8},camera:{flex:1},buttonRow:{flexDirection:'row',gap:10},secondaryBtn:{flex:1,borderWidth:1,borderColor:'#31506A',padding:14,borderRadius:11,alignItems:'center',marginTop:15},secondaryText:{color:'#C7D5E3',fontSize:12,fontWeight:'800'},
  center:{flex:1,alignItems:'center',justifyContent:'center'}
});
