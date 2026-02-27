import { motion } from "motion/react";
import { 
  LayoutDashboard, 
  Map, 
  BarChart3, 
  Bell, 
  Settings, 
  Sprout, 
  Download, 
  Calendar,
  AlertTriangle,
  Layers,
  Activity,
  ChevronRight,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Thermometer,
  Droplets,
  Wind,
  Satellite,
  MapPin,
  X
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icons in Leaflet
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// --- Types ---
type Screen = "home" | "dashboard" | "mapping" | "reports" | "alerts" | "config" | "calendar";

interface WeatherData {
  temp: number;
  humidity: number;
  condition: string;
  forecast: { day: string; temp: number; humidity: number }[];
}

interface ZoneData {
  id: string;
  name: string;
  score: number;
  status: "High Risk" | "Healthy" | "Moderate";
  temp: string;
  humidity: string;
  moisture: string;
}

interface AlertData {
  id: string;
  severity: "Critical" | "Warning" | "Resolved";
  zone: string;
  zoneId: string;
  type: string;
  current: string;
  baseline: string;
  time: string;
  duration: string;
  action: string;
}

// --- Mock Data ---
const ZONES: ZoneData[] = [
  {
    id: "ZN-8842-NP",
    name: "North Plateau - Alpha",
    score: 72,
    status: "High Risk",
    temp: "32.4°C",
    humidity: "42%",
    moisture: "18%",
  },
  {
    id: "ZN-1120-SR",
    name: "South River - Delta",
    score: 88,
    status: "Healthy",
    temp: "24.1°C",
    humidity: "68%",
    moisture: "72%",
  },
  {
    id: "ZN-5491-ER",
    name: "East Ridge - Gamma",
    score: 61,
    status: "Moderate",
    temp: "28.9°C",
    humidity: "55%",
    moisture: "41%",
  }
];

const ALERTS: AlertData[] = [
  {
    id: "AL-001",
    severity: "Critical",
    zone: "North Valley Sector A",
    zoneId: "NV-7721",
    type: "Temperature Spike",
    current: "38.4°C",
    baseline: "29.0°C",
    time: "Today, 10:24 AM",
    duration: "1h 12m",
    action: "Irrigation Activated"
  },
  {
    id: "AL-002",
    severity: "Warning",
    zone: "East Basin Plots",
    zoneId: "EB-4402",
    type: "Soil Moisture Drop",
    current: "12%",
    baseline: "18%",
    time: "Today, 08:15 AM",
    duration: "3h 21m",
    action: "Dismiss"
  },
  {
    id: "AL-003",
    severity: "Resolved",
    zone: "Central Plateau",
    zoneId: "CP-9910",
    type: "NDVI Low Alert",
    current: "0.42",
    baseline: "0.65",
    time: "Yesterday, 04:30 PM",
    duration: "Fixed in 45m",
    action: "Closed"
  },
  {
    id: "AL-004",
    severity: "Critical",
    zone: "West Ridge Orchard",
    zoneId: "WR-1123",
    type: "Wind Speed High",
    current: "45 km/h",
    baseline: "12 km/h",
    time: "Yesterday, 11:10 PM",
    duration: "8h 05m",
    action: "Alert Sent"
  },
  {
    id: "AL-005",
    severity: "Warning",
    zone: "South Slopes",
    zoneId: "SS-5021",
    type: "Humidity Low",
    current: "15%",
    baseline: "45%",
    time: "Oct 24, 02:00 PM",
    duration: "2h 45m",
    action: "View Profile"
  }
];

// --- Components ---

const Gauge = ({ value, color = "#8B5CF6" }: { value: number, color?: string }) => {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg className="w-40 h-40 transform -rotate-90">
        <circle
          className="text-white/5"
          cx="80"
          cy="80"
          fill="transparent"
          r={radius}
          stroke="currentColor"
          strokeWidth="12"
        />
        <motion.circle
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          cx="80"
          cy="80"
          fill="transparent"
          r={radius}
          stroke={color}
          strokeDasharray={circumference}
          strokeLinecap="round"
          strokeWidth="12"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
        <span className="text-4xl font-extrabold text-white">{value}</span>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">CSI SCORE</span>
      </div>
    </div>
  );
};

const Home = ({ onStart, setScreen }: { onStart: () => void, setScreen: (s: Screen) => void }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4 pt-32"
    >
      {/* Immersive Background Elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vw] pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-primary/20 rounded-[100%] blur-[120px] opacity-50" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-accent-blue/20 rounded-[100%] blur-[120px] opacity-50" />
      </div>

      <nav className="fixed top-0 left-0 right-0 p-8 flex justify-between items-center z-50 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/40">
            <Sprout className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-extrabold font-display tracking-tight text-white">
            Terra<span className="text-primary">Pulse</span>
          </span>
        </div>
        <button 
          onClick={onStart}
          className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-primary hover:text-white transition-all shadow-xl"
        >
          Start now
        </button>
      </nav>

      <div className="relative z-10 text-center max-w-4xl space-y-12">
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-6xl md:text-8xl font-bold text-white font-display leading-[0.9] tracking-tight">
            Take Control <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-accent-blue">
              of your Fields
            </span>
          </h1>
        </motion.div>

        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed"
        >
          Discover a user-friendly platform for tracking over 12,000 hectares of agricultural assets with real-time NASA satellite intelligence.
        </motion.p>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="pt-8"
        >
          <div className="relative group cursor-pointer" onClick={onStart}>
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent-blue rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative glass rounded-3xl overflow-hidden aspect-video w-full max-w-2xl mx-auto border border-white/10">
              <img 
                src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-1.2.1&auto=format&fit=crop&w=1600&q=80" 
                alt="Dashboard Preview"
                className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/0 transition-colors">
                <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform">
                  <ChevronRight className="w-10 h-10 text-white" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Floating Stats */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-12 text-center">
        {[
          { label: "Active Satellites", value: "12" },
          { label: "Monitored Area", value: "12k Ha" },
          { label: "Data Accuracy", value: "99.8%" },
        ].map((stat, i) => (
          <div key={i}>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">{stat.label}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

const Sidebar = ({ currentScreen, setScreen }: { currentScreen: Screen, setScreen: (s: Screen) => void }) => {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "mapping", label: "Field Mapping", icon: Map },
    { id: "reports", label: "CSI Reports", icon: BarChart3 },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "alerts", label: "Active Alerts", icon: Bell },
    { id: "config", label: "Configuration", icon: Settings },
  ];

  return (
    <aside className="w-64 flex-shrink-0 glass border-r border-white/5 z-20 flex flex-col h-screen sticky top-0">
      <div className="p-8 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent-blue flex items-center justify-center shadow-lg shadow-primary/20">
          <Sprout className="text-white w-5 h-5" />
        </div>
        <span className="text-xl font-extrabold font-display tracking-tight text-white">
          Terra<span className="text-primary">Pulse</span>
        </span>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setScreen(item.id as Screen)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              currentScreen === item.id 
                ? "bg-primary/10 text-primary font-medium" 
                : "text-slate-500 hover:text-primary hover:bg-white/5"
            }`}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5">
        <button 
          onClick={() => setScreen("home")}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <ChevronRight className="w-5 h-5 rotate-180" />
          Back to Home
        </button>
      </div>

      <div className="p-6 mt-auto">
        <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-white/5">
          <p className="text-[10px] text-indigo-300 font-semibold mb-1 uppercase tracking-wider">NASA Data Feed</p>
          <p className="text-[10px] text-slate-400">Live Satellite Uplink Active</p>
          <div className="mt-3 w-full bg-white/5 h-1 rounded-full overflow-hidden">
            <motion.div 
              animate={{ width: ["0%", "75%", "75%", "0%"] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="bg-primary h-full"
            />
          </div>
        </div>
      </div>
    </aside>
  );
};

interface MarkerData {
  id: number;
  lat: number;
  lng: number;
  info: {
    temp: string;
    humidity: string;
    moisture: string;
    type: string;
    address?: string;
  };
}

const MapController = ({ center }: { center: [number, number] | null }) => {
  const map = useMap();
  
  useEffect(() => {
    // Force map to recalculate its size on mount
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [map]);

  useEffect(() => {
    if (center) {
      map.flyTo(center, 15);
    }
  }, [center, map]);
  return null;
};

const MapEvents = ({ onMapClick, isAdding }: { onMapClick: (lat: number, lng: number) => void, isAdding: boolean }) => {
  useMapEvents({
    click(e) {
      if (isAdding) {
        onBackToHome(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  
  // Helper to bridge the gap since we can't rename the prop easily in this context
  function onBackToHome(lat: number, lng: number) {
    onMapClick(lat, lng);
  }
  
  return null;
};

const FieldMapping = ({ onBack, onGenerateReport }: { onBack: () => void, onGenerateReport: (zone: ZoneData) => void }) => {
  const [showZones, setShowZones] = useState(true);
  const [isAddingMarker, setIsAddingMarker] = useState(false);
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
  
  // Coordinate Search State
  const [searchLat, setSearchLat] = useState("");
  const [searchLng, setSearchLng] = useState("");
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);

  const handleLocate = () => {
    const lat = parseFloat(searchLat);
    const lng = parseFloat(searchLng);
    if (!isNaN(lat) && !isNaN(lng)) {
      setMapCenter([lat, lng]);
    }
  };

  const handleMapClick = async (lat: number, lng: number) => {
    // Reverse geocoding to get "correct information of that place"
    let address = "Unknown Location";
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      address = data.display_name || "Agricultural Zone";
    } catch (e) {
      console.error("Geocoding failed", e);
    }

    // Fetch weather from OpenWeatherMap
    let weatherInfo = { temp: "N/A", humidity: "N/A" };
    try {
      const apiKey = "b9e34a8303d4ff5d89ae8db003872e2a";
      const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`);
      const data = await res.json();
      weatherInfo = {
        temp: `${data.main.temp.toFixed(1)}°C`,
        humidity: `${data.main.humidity}%`
      };
    } catch (e) {
      console.error("Weather fetch failed", e);
    }

    const newMarker: MarkerData = {
      id: Date.now(),
      lat,
      lng,
      info: {
        temp: weatherInfo.temp,
        humidity: weatherInfo.humidity,
        moisture: `${(10 + Math.random() * 80).toFixed(0)}%`,
        type: ["Loamy", "Sandy", "Clay", "Silty"][Math.floor(Math.random() * 4)],
        address
      }
    };

    setMarkers([...markers, newMarker]);
    setIsAddingMarker(false);
    setSelectedMarker(newMarker);
  };

  const handleGenerateReport = () => {
    if (!selectedMarker) return;
    
    const score = Math.floor(Math.random() * 40) + 60; // 60-100
    const status = score > 85 ? "Healthy" : score > 70 ? "Moderate" : "High Risk";
    
    const newZone: ZoneData = {
      id: `ZN-${Math.floor(Math.random() * 9000) + 1000}-NEW`,
      name: selectedMarker.info.address?.split(',')[0] || "New Field Zone",
      score,
      status,
      temp: selectedMarker.info.temp,
      humidity: selectedMarker.info.humidity,
      moisture: selectedMarker.info.moisture
    };
    
    onGenerateReport(newZone);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-8 h-full"
    >
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 glass rounded-lg hover:bg-white/10 text-white transition-colors"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white font-display">Field Mapping</h1>
            <p className="text-slate-400 mt-1">Interactive spatial analysis of agricultural zones.</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          {/* Coordinate Search Form */}
          <div className="flex items-center gap-2 glass px-3 py-1.5 rounded-xl border border-white/5">
            <div className="flex flex-col">
              <span className="text-[8px] font-bold text-slate-500 uppercase ml-1">Latitude</span>
              <input 
                type="text" 
                placeholder="37.7749" 
                value={searchLat}
                onChange={(e) => setSearchLat(e.target.value)}
                className="bg-transparent border-none text-xs text-white focus:ring-0 w-20 p-0"
              />
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div className="flex flex-col">
              <span className="text-[8px] font-bold text-slate-500 uppercase ml-1">Longitude</span>
              <input 
                type="text" 
                placeholder="-122.4194" 
                value={searchLng}
                onChange={(e) => setSearchLng(e.target.value)}
                className="bg-transparent border-none text-xs text-white focus:ring-0 w-20 p-0"
              />
            </div>
            <button 
              onClick={handleLocate}
              className="p-2 bg-primary/20 hover:bg-primary text-primary hover:text-white rounded-lg transition-all"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>

          <button 
            onClick={() => setShowZones(!showZones)}
            className={`px-4 py-2 glass rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${showZones ? 'bg-primary/20 text-primary border-primary/30' : 'text-white hover:bg-white/10'}`}
          >
            <Layers className="w-4 h-4" />
            {showZones ? 'Hide Zones' : 'Show Zones'}
          </button>
          <button 
            onClick={() => setIsAddingMarker(!isAddingMarker)}
            className={`px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-all shadow-lg ${
              isAddingMarker 
                ? 'bg-accent-red text-white' 
                : 'bg-primary hover:bg-primary/90 text-white shadow-primary/20'
            }`}
          >
            <MapPin className="w-4 h-4" />
            {isAddingMarker ? 'Click on Map' : 'Add Marker'}
          </button>
        </div>
      </header>

      <div className="rounded-3xl overflow-hidden relative h-[700px] border border-white/10 shadow-2xl z-0 bg-slate-900">
        <MapContainer 
          center={[37.7749, -122.4194]} 
          zoom={13} 
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapController center={mapCenter} />
          <MapEvents onMapClick={handleMapClick} isAdding={isAddingMarker} />

          {markers.map(marker => (
            <Marker 
              key={marker.id} 
              position={[marker.lat, marker.lng]}
              eventHandlers={{
                click: () => setSelectedMarker(marker),
              }}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h4 className="font-bold text-slate-900 mb-2">Field Data</h4>
                  <p className="text-[10px] text-slate-500 mb-3 leading-tight">{marker.info.address}</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Soil:</span>
                      <span className="font-bold text-slate-900">{marker.info.type}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Temp:</span>
                      <span className="font-bold text-slate-900">{marker.info.temp}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Moisture:</span>
                      <span className="font-bold text-slate-900">{marker.info.moisture}</span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Marker Info Overlay (for selected marker) */}
        {selectedMarker && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-8 right-8 z-[1000] w-72 glass p-6 rounded-2xl border-primary/30"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-bold text-white">Location Details</h4>
                <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{selectedMarker.info.address}</p>
              </div>
              <button onClick={() => setSelectedMarker(null)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Coordinates</span>
                <span className="text-[10px] font-mono text-white">{selectedMarker.lat.toFixed(4)}, {selectedMarker.lng.toFixed(4)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Soil Type</span>
                <span className="text-xs font-bold text-white">{selectedMarker.info.type}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Temperature</span>
                <span className="text-xs font-bold text-white">{selectedMarker.info.temp}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Moisture</span>
                <span className="text-xs font-bold text-white">{selectedMarker.info.moisture}</span>
              </div>
            </div>
            <button 
              onClick={handleGenerateReport}
              className="w-full mt-4 py-2 bg-primary text-white text-[10px] font-bold rounded-lg transition-colors shadow-lg shadow-primary/20"
            >
              Generate Detailed Report
            </button>
          </motion.div>
        )}

        {/* Legend Overlay */}
        <div className="absolute bottom-8 left-8 glass p-6 rounded-2xl space-y-4 w-64 z-[1000]">
          <h4 className="font-bold text-white text-sm">Map Legend</h4>
          <div className="space-y-2">
            {[
              { label: "High Stress", color: "bg-accent-red" },
              { label: "Optimal Growth", color: "bg-accent-green" },
              { label: "Moderate Stress", color: "bg-amber-500" },
              { label: "Irrigation Active", color: "bg-accent-blue" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${item.color}`} />
                <span className="text-xs text-slate-400">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const CSIReports = () => {
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const data = [30, 45, 60, 40, 80, 90, 70, 50, 40, 60, 85, 95];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <header>
        <h1 className="text-3xl font-bold text-white font-display">CSI Reports</h1>
        <p className="text-slate-400 mt-1">Detailed historical analysis of Crop Stress Index metrics.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass p-8 rounded-3xl relative">
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-lg font-bold text-white">Monthly Stress Distribution</h4>
            {hoveredMonth !== null && (
              <motion.div 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-primary font-bold text-sm"
              >
                {months[hoveredMonth]}: {data[hoveredMonth]}% Stress
              </motion.div>
            )}
          </div>
          <div className="h-80 flex items-end justify-between gap-4">
            {data.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  onMouseEnter={() => setHoveredMonth(i)}
                  onMouseLeave={() => setHoveredMonth(null)}
                  className={`w-full rounded-t-lg transition-all cursor-pointer ${
                    hoveredMonth === i ? 'bg-primary shadow-[0_0_20px_rgba(139,92,246,0.5)]' : 'bg-primary/30'
                  }`}
                />
                <span className={`text-[10px] font-bold uppercase transition-colors ${
                  hoveredMonth === i ? 'text-primary' : 'text-slate-500'
                }`}>
                  {months[i][0]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass p-8 rounded-3xl space-y-6">
          <h4 className="text-lg font-bold text-white">Report Summary</h4>
          <div className="space-y-4">
            {[
              { label: "Highest Stress Month", value: "December", color: "text-accent-red" },
              { label: "Avg. Annual Score", value: "68.4", color: "text-white" },
              { label: "Recovery Rate", value: "+12.5%", color: "text-accent-green" },
              { label: "Data Points", value: "14,202", color: "text-slate-400" },
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center py-3 border-b border-white/5">
                <span className="text-sm text-slate-500">{item.label}</span>
                <span className={`text-sm font-bold ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>
          <button className="w-full bg-primary text-white py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-primary/20 hover:bg-primary/90">
            Download Full PDF
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const Configuration = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-8 max-w-4xl"
    >
      <header>
        <h1 className="text-3xl font-bold text-white font-display">Configuration</h1>
        <p className="text-slate-400 mt-1">Manage system thresholds, data feeds, and user preferences.</p>
      </header>

      <div className="space-y-6">
        <div className="glass p-8 rounded-3xl space-y-8">
          <section className="space-y-6">
            <h4 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Alert Thresholds
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <label className="text-sm text-slate-400">Critical CSI Score</label>
                  <span className="text-sm font-bold text-white">75+</span>
                </div>
                <input type="range" className="w-full accent-primary" defaultValue={75} />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <label className="text-sm text-slate-400">Temperature Warning</label>
                  <span className="text-sm font-bold text-white">35°C</span>
                </div>
                <input type="range" className="w-full accent-primary" defaultValue={35} />
              </div>
            </div>
          </section>

          <div className="h-px bg-white/5" />

          <section className="space-y-6">
            <h4 className="text-lg font-bold text-white flex items-center gap-2">
              <Satellite className="w-5 h-5 text-accent-blue" />
              Data Source Settings
            </h4>
            <div className="space-y-4">
              {[
                { label: "NASA Sentinel-2 Feed", desc: "High-resolution multispectral imaging", active: true },
                { label: "Landsat-9 Thermal", desc: "Surface temperature monitoring", active: true },
                { label: "Local Weather Station", desc: "Ground-level sensor data", active: false },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                  <div>
                    <p className="text-sm font-bold text-white">{item.label}</p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                  <div className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${item.active ? 'bg-primary' : 'bg-slate-700'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${item.active ? 'right-1' : 'left-1'}`} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="flex justify-end gap-4">
          <button className="px-6 py-3 rounded-xl text-sm font-bold text-slate-400 hover:text-white transition-colors">Discard Changes</button>
          <button className="px-8 py-3 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20">Save Configuration</button>
        </div>
      </div>
    </motion.div>
  );
};

const CalendarScreen = () => {
  const [currentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());
  
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  // Mock weather data for days
  const getDayWeather = (day: number) => {
    const seed = day + currentDate.getMonth();
    return {
      temp: 22 + (seed % 10),
      humidity: 40 + (seed % 30),
      condition: ['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain'][seed % 4],
      rainChance: seed % 100
    };
  };

  const selectedWeather = selectedDay ? getDayWeather(selectedDay) : null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-8"
    >
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white font-display">Agricultural Calendar</h1>
          <p className="text-slate-400 mt-1">Plan your harvest and irrigation cycles with precision.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setSelectedDay(new Date().getDate())}
            className="px-4 py-2 glass rounded-lg text-sm font-medium text-white hover:bg-white/10"
          >
            Today
          </button>
          <div className="flex glass rounded-lg overflow-hidden">
            <button className="p-2 hover:bg-white/10 text-white"><ChevronRight className="w-4 h-4 rotate-180" /></button>
            <button className="p-2 hover:bg-white/10 text-white"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 glass rounded-3xl p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-white">
              {currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}
            </h2>
          </div>
          
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {blanks.map(i => <div key={`blank-${i}`} className="aspect-square" />)}
            {days.map(day => {
              const hasEvent = [12, 15, 22].includes(day);
              const isToday = day === currentDate.getDate();
              const isSelected = selectedDay === day;
              return (
                <div 
                  key={day} 
                  onClick={() => setSelectedDay(day)}
                  className={`aspect-square glass rounded-2xl p-3 relative group cursor-pointer transition-all ${
                    isSelected ? 'border-primary bg-primary/20 ring-2 ring-primary/50' : 
                    isToday ? 'border-primary/50 bg-primary/5' : 'border-white/5 hover:bg-white/5'
                  }`}
                >
                  <span className={`text-sm font-bold ${isSelected || isToday ? 'text-primary' : 'text-slate-400'}`}>{day}</span>
                  {hasEvent && (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent-red" />
                  )}
                  {day === 15 && (
                    <div className="hidden group-hover:block absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 w-48 glass p-3 rounded-xl text-[10px] text-white">
                      <p className="font-bold text-accent-red mb-1">Critical Irrigation</p>
                      <p className="text-slate-400">North Plateau • 04:00 AM</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          {selectedDay && selectedWeather && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              key={selectedDay}
              className="glass p-6 rounded-3xl border-primary/30 bg-primary/5"
            >
              <h4 className="font-bold text-white mb-4 flex justify-between items-center">
                <span>Day Details</span>
                <span className="text-xs text-primary">{selectedDay} {currentDate.toLocaleString('default', { month: 'short' })}</span>
              </h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <Thermometer className="w-4 h-4 text-accent-red" />
                    Temp
                  </div>
                  <span className="text-sm font-bold text-white">{selectedWeather.temp}°C</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <Droplets className="w-4 h-4 text-accent-blue" />
                    Humidity
                  </div>
                  <span className="text-sm font-bold text-white">{selectedWeather.humidity}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <Wind className="w-4 h-4 text-slate-400" />
                    Weather
                  </div>
                  <span className="text-sm font-bold text-white">{selectedWeather.condition}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <Activity className="w-4 h-4 text-accent-green" />
                    Rain Chance
                  </div>
                  <span className="text-sm font-bold text-white">{selectedWeather.rainChance}%</span>
                </div>
              </div>
            </motion.div>
          )}

          <div className="glass p-6 rounded-3xl">
            <h4 className="font-bold text-white mb-4">Upcoming Tasks</h4>
            <div className="space-y-4">
              {[
                { time: "04:00 AM", task: "Irrigation Cycle", zone: "Zone Alpha", color: "bg-accent-blue" },
                { time: "09:30 AM", task: "Soil Sample", zone: "Zone Delta", color: "bg-accent-green" },
                { time: "02:00 PM", task: "Drone Survey", zone: "East Ridge", color: "bg-primary" },
              ].map((item, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className={`w-1 h-10 rounded-full ${item.color}`} />
                  <div>
                    <p className="text-xs font-bold text-white">{item.task}</p>
                    <p className="text-[10px] text-slate-500">{item.time} • {item.zone}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="glass p-6 rounded-3xl bg-gradient-to-br from-primary/20 to-accent-blue/20 border-primary/20">
            <h4 className="font-bold text-white mb-2">Harvest Forecast</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Based on current CSI trends, optimal harvest for Chardonnay blocks is predicted in <span className="text-white font-bold">18 days</span>.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const Dashboard = ({ zones, onZoneClick, onDeleteZone }: { zones: ZoneData[], onZoneClick: (zone: ZoneData) => void, onDeleteZone: (id: string) => void }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: "2026-08-12",
    end: "2026-08-19"
  });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  useEffect(() => {
    // Fetch weather from Open-Meteo (No API key required)
    const fetchWeather = async () => {
      try {
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=37.7749&longitude=-122.4194&current_weather=true&hourly=temperature_2m,relativehumidity_2m');
        const data = await res.json();
        setWeather({
          temp: data.current_weather.temperature,
          humidity: data.hourly.relativehumidity_2m[0],
          condition: "Clear Sky",
          forecast: [
            { day: "Mon", temp: 24, humidity: 45 },
            { day: "Tue", temp: 26, humidity: 42 },
            { day: "Wed", temp: 23, humidity: 50 },
            { day: "Thu", temp: 25, humidity: 48 },
          ]
        });
      } catch (e) {
        console.error("Weather fetch failed", e);
      }
    };
    fetchWeather();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <header className="flex justify-between items-end relative z-10">
        <div>
          <h1 className="text-3xl font-bold text-white font-display">Crop Intelligence Dashboard</h1>
          <p className="text-slate-400 mt-1">Real-time climate-tech monitoring via NASA-Sentinel datasets.</p>
        </div>
        <div className="flex items-center gap-4">
          {weather && (
            <div className="flex items-center gap-4 glass px-4 py-2 rounded-lg">
              <div className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-accent-red" />
                <span className="text-sm font-bold text-white">{weather.temp}°C</span>
              </div>
              <div className="w-px h-4 bg-white/10" />
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-accent-blue" />
                <span className="text-sm font-bold text-white">{weather.humidity}%</span>
              </div>
            </div>
          )}
          
          <div className="relative">
            <button 
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              className="px-4 py-2 glass rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-white/10 transition-colors text-white"
            >
              <Calendar className="w-4 h-4" />
              {formatDate(dateRange.start)} - {formatDate(dateRange.end)}
            </button>

            {isDatePickerOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 mt-2 z-50 w-72 glass p-6 rounded-2xl border-white/10 shadow-2xl"
              >
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-white text-sm">Select Period</h4>
                  <button onClick={() => setIsDatePickerOpen(false)} className="text-slate-500 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Start Date</label>
                    <input 
                      type="date" 
                      value={dateRange.start}
                      onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">End Date</label>
                    <input 
                      type="date" 
                      value={dateRange.end}
                      onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-primary"
                    />
                  </div>
                  <button 
                    onClick={() => setIsDatePickerOpen(false)}
                    className="w-full py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-all"
                  >
                    Apply Range
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          <button className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-all shadow-lg shadow-primary/20">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        {[
          { label: "Avg. Crop Stress Index (CSI)", value: "72", sub: "/100", trend: "+4.2%", trendColor: "text-accent-green", icon: Activity, iconColor: "text-primary" },
          { label: "High Risk Zones", value: "03", trend: "Action Required", trendColor: "text-accent-red", icon: AlertTriangle, iconColor: "text-accent-red", border: "border-l-4 border-accent-red" },
          { label: "Total Monitored Zones", value: "12", icon: Layers, iconColor: "text-accent-blue" },
          { label: "Active System Alerts", value: "05", icon: Bell, iconColor: "text-amber-500", ping: true },
        ].map((stat, i) => (
          <div key={i} className={`glass p-6 rounded-xl hover:bg-white/5 transition-all group ${stat.border || ""}`}>
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded-lg ${stat.iconColor.replace('text-', 'bg-')}/10 ${stat.iconColor}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              {stat.trend && (
                <span className={`text-[10px] font-bold ${stat.trendColor} ${stat.trendColor.replace('text-', 'bg-')}/10 px-2 py-1 rounded`}>
                  {stat.trend}
                </span>
              )}
              {stat.ping && <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />}
            </div>
            <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
            <h3 className="text-2xl font-bold text-white mt-1">
              {stat.value}
              {stat.sub && <span className="text-slate-500 text-lg font-normal">{stat.sub}</span>}
            </h3>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-8 relative z-10">
        {zones.map((zone) => (
          <div 
            key={zone.id} 
            className={`glass p-8 rounded-xl hover:scale-[1.01] transition-transform duration-300 cursor-pointer group relative ${zone.status === 'High Risk' ? 'glow-purple' : ''}`}
          >
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteZone(zone.id);
                }}
                className="p-2 bg-accent-red/10 text-accent-red rounded-lg hover:bg-accent-red hover:text-white transition-all"
                title="Delete Zone"
              >
                <X className="w-4 h-4" />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onZoneClick(zone);
                }}
                className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-all"
                title="View Details"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div onClick={() => onZoneClick(zone)}>
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h4 className="text-xl font-bold font-display text-white group-hover:text-primary transition-colors">{zone.name}</h4>
                  <p className="text-slate-400 text-sm">Zone ID: {zone.id}</p>
                </div>
                <span className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-widest border ${
                  zone.status === 'High Risk' ? 'bg-accent-red/20 text-accent-red border-accent-red/30' :
                  zone.status === 'Healthy' ? 'bg-accent-green/20 text-accent-green border-accent-green/30' :
                  'bg-amber-500/20 text-amber-500 border-amber-500/30'
                }`}>
                  {zone.status}
                </span>
              </div>
              
              <div className="my-10">
                <Gauge 
                  value={zone.score} 
                  color={
                    zone.status === 'High Risk' ? '#EF4444' : 
                    zone.status === 'Healthy' ? '#10B981' : 
                    '#F59E0B'
                  } 
                />
              </div>

              <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-8">
                {[
                  { label: "Temp", value: zone.temp, color: "bg-accent-red", icon: Thermometer },
                  { label: "Humidity", value: zone.humidity, color: "bg-accent-blue", icon: Droplets },
                  { label: "Soil Moisture", value: zone.moisture, color: "bg-amber-500", icon: Wind },
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter mb-1">{stat.label}</p>
                    <p className="text-lg font-semibold text-white">{stat.value}</p>
                    <div className={`mt-1 h-1 w-8 ${stat.color}/40 mx-auto rounded-full overflow-hidden`}>
                      <div className={`h-full ${stat.color}`} style={{ width: '60%' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        <div className="lg:col-span-2 glass rounded-xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-lg font-bold text-white">Stress Trend Analytics</h4>
            <div className="flex gap-2">
              <button className="px-3 py-1 text-xs font-semibold rounded-md bg-white/10 text-white">Daily</button>
              <button className="px-3 py-1 text-xs font-semibold rounded-md text-slate-400 hover:text-white transition-colors">Weekly</button>
            </div>
          </div>
          <div className="h-64 flex items-end justify-between gap-3 pt-4">
            {[40, 55, 45, 75, 85, 60, 50, 30, 65, 70, 40, 80].map((h, i) => (
              <div 
                key={i} 
                className={`w-full rounded-t-lg transition-all cursor-pointer hover:bg-primary ${
                  i === 4 ? 'bg-primary/40 border-t-2 border-primary shadow-[0_-4px_10px_rgba(139,92,246,0.3)]' : 'bg-primary/20'
                }`}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-4 px-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Aug 01</span>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Aug 15</span>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Aug 30</span>
          </div>
        </div>

        <div className="glass rounded-xl p-8">
          <h4 className="text-lg font-bold text-white mb-6">Recent Log Events</h4>
          <div className="space-y-6">
            {[
              { label: "Critical Heat Threshold Reached", sub: "North Plateau • 2 mins ago", color: "bg-accent-red" },
              { label: "Irrigation Sequence Completed", sub: "South River • 45 mins ago", color: "bg-accent-blue" },
              { label: "Sentinel-2 Data Sync Successful", sub: "Global • 2 hours ago", color: "bg-accent-green" },
              { label: "Soil Moisture Warning", sub: "East Ridge • 5 hours ago", color: "bg-amber-500" },
            ].map((log, i) => (
              <div key={i} className="flex gap-4">
                <div className={`w-1.5 h-1.5 rounded-full ${log.color} mt-2 flex-shrink-0`} />
                <div>
                  <p className="text-sm font-semibold text-slate-200">{log.label}</p>
                  <p className="text-xs text-slate-500">{log.sub}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-8 py-3 rounded-xl border border-white/5 text-sm font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all">
            View Full History
          </button>
        </div>
      </section>
    </motion.div>
  );
};

const Alerts = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-8"
    >
      <header className="flex justify-between items-end relative z-10">
        <div>
          <h1 className="text-4xl font-bold text-white font-space tracking-tight">Alerts & History</h1>
          <p className="text-slate-400 mt-2">Real-time anomaly detection and crop stress logging powered by NASA satellite feeds.</p>
        </div>
        <button className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg shadow-primary/20">
          <Download className="w-5 h-5" />
          Export Log
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { label: "Total Alerts (24h)", value: "124", trend: "12%", trendUp: true, color: "border-primary", icon: Activity, iconColor: "text-primary" },
          { label: "Unresolved Issues", value: "12", trend: "5%", trendUp: false, color: "border-amber-500", icon: AlertTriangle, iconColor: "text-amber-500" },
          { label: "Critical Failures", value: "3", trend: "2%", trendUp: true, color: "border-accent-red", icon: AlertTriangle, iconColor: "text-accent-red" },
        ].map((stat, i) => (
          <div key={i} className={`glass p-6 rounded-2xl border-l-4 ${stat.color} shadow-sm`}>
            <div className="flex justify-between items-start">
              <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
              <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
            </div>
            <div className="mt-2 flex items-baseline gap-3">
              <p className="text-3xl font-bold text-white">{stat.value}</p>
              <span className={`text-sm font-bold flex items-center gap-1 ${stat.trendUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                {stat.trendUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {stat.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            className="w-full bg-white/5 border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:ring-primary focus:border-primary outline-none" 
            placeholder="Search specific anomalies, zones, or issue types..." 
            type="text"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {["Severity: All", "Zone: All Regions", "Last 7 Days"].map((filter, i) => (
            <button key={i} className="flex items-center gap-2 px-4 py-2.5 glass rounded-xl text-sm font-medium hover:bg-white/10 transition-colors">
              <Filter className="w-4 h-4" />
              {filter}
              <ChevronRight className="w-4 h-4 rotate-90" />
            </button>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                {["Severity", "Zone Name", "Issue Type", "Current vs Baseline", "Time Detected", "Action Taken"].map((head) => (
                  <th key={head} className={`px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 ${head === 'Action Taken' ? 'text-right' : ''}`}>
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {ALERTS.map((alert) => (
                <tr key={alert.id} className="hover:bg-primary/5 transition-all group cursor-pointer">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <div className={`h-2.5 w-2.5 rounded-full ${
                        alert.severity === 'Critical' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]' :
                        alert.severity === 'Warning' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]' :
                        'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'
                      }`} />
                      <span className="text-sm font-medium text-white">{alert.severity}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-sm font-semibold text-white">{alert.zone}</div>
                    <div className="text-xs text-slate-500">ID: {alert.zoneId}</div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${
                      alert.severity === 'Critical' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                      alert.severity === 'Warning' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                      'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    }`}>
                      {alert.type}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{alert.current}</span>
                      {alert.severity !== 'Resolved' && (
                        alert.severity === 'Critical' ? <TrendingUp className="w-3 h-3 text-rose-500" /> : <TrendingDown className="w-3 h-3 text-amber-500" />
                      )}
                      <span className="text-xs text-slate-500">Base: {alert.baseline}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-sm">
                    <div className="text-white">{alert.time}</div>
                    <div className={`text-xs ${alert.severity === 'Resolved' ? 'text-emerald-500 font-medium' : 'text-slate-500'}`}>
                      Duration: {alert.duration}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    {alert.severity === 'Resolved' ? (
                      <div className="flex items-center justify-end gap-1 text-slate-500 text-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        Closed
                      </div>
                    ) : (
                      <button className={`text-sm font-bold hover:underline ${alert.severity === 'Critical' ? 'text-primary' : 'text-slate-400'}`}>
                        {alert.action}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 bg-white/5 border-t border-white/5 flex items-center justify-between">
          <p className="text-xs text-slate-500">Showing 1 to 5 of 124 entries</p>
          <div className="flex gap-2">
            <button className="h-8 w-8 flex items-center justify-center rounded-lg border border-white/10 text-slate-500 disabled:opacity-50" disabled>
              <ChevronRight className="w-4 h-4 rotate-180" />
            </button>
            <button className="h-8 w-8 flex items-center justify-center rounded-lg bg-primary text-white text-xs font-bold">1</button>
            <button className="h-8 w-8 flex items-center justify-center rounded-lg border border-white/10 text-slate-400 hover:text-white text-xs font-bold transition-colors">2</button>
            <button className="h-8 w-8 flex items-center justify-center rounded-lg border border-white/10 text-slate-400 hover:text-white text-xs font-bold transition-colors">3</button>
            <button className="h-8 w-8 flex items-center justify-center rounded-lg border border-white/10 text-slate-500">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 glass p-6 rounded-2xl flex flex-col justify-center items-center text-center">
          <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-4">
            <Satellite className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-white mb-1">NASA Sentinel-2 Feed</h4>
          <p className="text-xs text-slate-500 leading-relaxed">Active monitoring across 12,000 hectares. Next scan in 42 minutes.</p>
        </div>
        <div className="lg:col-span-3 h-48 rounded-2xl overflow-hidden relative border border-white/10">
          <img 
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-1.2.1&auto=format&fit=crop&w=1600&q=80" 
            alt="Satellite view"
            className="absolute inset-0 w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-primary/10 mix-blend-overlay" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
            <div className="text-center">
              <MapPin className="text-white w-10 h-10 mx-auto mb-2" />
              <p className="text-white font-bold">View Real-time Anomaly Map</p>
              <p className="text-white/70 text-xs">8 active hotspots detected</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [zones, setZones] = useState<ZoneData[]>(ZONES);
  const [selectedZone, setSelectedZone] = useState<ZoneData | null>(null);

  const addZone = (newZone: ZoneData) => {
    setZones(prev => [newZone, ...prev]);
  };

  const deleteZone = (id: string) => {
    setZones(prev => prev.filter(z => z.id !== id));
    if (selectedZone?.id === id) setSelectedZone(null);
  };

  return (
    <div className="flex h-screen overflow-hidden gradient-bg">
      {screen !== "home" && <Sidebar currentScreen={screen} setScreen={setScreen} />}
      
      <main className="flex-1 overflow-y-auto relative">
        {/* Background Glows (only for app screens) */}
        {screen !== "home" && (
          <>
            <div className="fixed top-[-10%] left-[30%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="fixed bottom-[-10%] right-[0%] w-[500px] h-[500px] bg-accent-blue/10 rounded-full blur-[100px] pointer-events-none" />
          </>
        )}

        <div className={screen === "home" ? "" : "max-w-7xl mx-auto p-8"}>
          {screen === "home" && <Home onStart={() => setScreen("dashboard")} setScreen={setScreen} />}
          {screen === "dashboard" && (
            <Dashboard 
              zones={zones} 
              onZoneClick={(zone) => setSelectedZone(zone)} 
              onDeleteZone={deleteZone}
            />
          )}
          {screen === "mapping" && (
            <FieldMapping 
              onBack={() => setScreen("dashboard")} 
              onGenerateReport={(zone) => {
                addZone(zone);
                setScreen("dashboard");
              }}
            />
          )}
          {screen === "reports" && <CSIReports />}
          {screen === "calendar" && <CalendarScreen />}
          {screen === "alerts" && <Alerts />}
          {screen === "config" && <Configuration />}
        </div>

        {/* Zone Detail Modal */}
        {selectedZone && (
          <div className="fixed inset-0 z-50 flex items-center justify-end p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              className="w-full max-w-md h-full glass rounded-3xl p-8 overflow-y-auto relative"
            >
              <button 
                onClick={() => setSelectedZone(null)}
                className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="space-y-8">
                <div>
                  <div className="flex items-center gap-2 text-primary mb-2">
                    <Satellite className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">NASA Landsat-9 Data</span>
                  </div>
                  <h2 className="text-3xl font-bold text-white">{selectedZone.name} Detail</h2>
                  <p className="text-slate-400 text-sm">North Vineyard • Premium Chardonnay Block</p>
                </div>

                <div className="flex justify-center py-8">
                  <Gauge value={selectedZone.score} color="#8B5CF6" />
                </div>

                <div className="flex justify-center gap-12 text-center border-b border-white/5 pb-8">
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Status</p>
                    <p className={`text-sm font-bold ${
                      selectedZone.status === 'Healthy' ? 'text-accent-green' : 
                      selectedZone.status === 'High Risk' ? 'text-accent-red' : 'text-amber-500'
                    }`}>
                      {selectedZone.status === 'Healthy' ? 'Optimal' : selectedZone.status}
                    </p>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Confidence</p>
                    <p className="text-sm font-bold text-white">98.2%</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Temperature", value: selectedZone.temp, icon: Thermometer, color: "text-accent-blue" },
                    { label: "Humidity", value: selectedZone.humidity, icon: Droplets, color: "text-accent-blue" },
                    { label: "Soil Moisty", value: selectedZone.moisture, icon: Wind, color: "text-amber-500" },
                  ].map((item, i) => (
                    <div key={i} className="glass p-4 rounded-2xl">
                      <item.icon className={`w-4 h-4 ${item.color} mb-2`} />
                      <p className="text-[10px] text-slate-500 font-medium mb-1">{item.label}</p>
                      <p className="text-sm font-bold text-white">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="p-6 rounded-2xl bg-primary/10 border border-primary/20 relative overflow-hidden">
                  <div className="flex items-center gap-2 text-primary mb-3">
                    <Activity className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">AI Recommendation</span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Soil moisture levels in {selectedZone.name} have dropped by <span className="text-white font-bold">4%</span> over the last 48 hours. Based on NASA satellite thermal imaging, we recommend a <span className="text-white font-bold underline">15-minute irrigation cycle</span> starting at 04:00 AM to prevent early crop stress.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white mb-4">7-Day CSI Trend</h4>
                  <div className="h-32 flex items-end gap-1">
                    {[40, 55, 45, 70, 85, 60, 95].map((h, i) => (
                      <div key={i} className="flex-1 bg-primary/20 rounded-t-sm relative group">
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          className="absolute bottom-0 left-0 right-0 bg-primary/40 group-hover:bg-primary transition-colors"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}
