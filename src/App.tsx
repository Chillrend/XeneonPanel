import { useState } from 'react';
import {
  Lightbulb,
  Lamp,
  Zap,
  Server,
  Activity,
  Thermometer,
  Droplet,
  Sliders,
  ShieldCheck,
  Cpu,
  Radio,
  Network,
} from 'lucide-react';
import { useHomeAssistant } from './hooks/useHomeAssistant';
import { useInfluxQuery } from './hooks/useInfluxQuery';
import { useSystemStatus } from './hooks/useSystemStatus';
import { MushroomHeader, type LayoutMode } from './components/mushroom/MushroomHeader';
import { MushroomButtonCard } from './components/mushroom/MushroomButtonCard';
import { MushroomGraphCard } from './components/mushroom/MushroomGraphCard';
import { MushroomSliderCard } from './components/mushroom/MushroomSliderCard';
import { MushroomStatCard } from './components/mushroom/MushroomStatCard';
import { DashboardGrid, SectionContainer } from './components/layout/DashboardGrid';
import { WebShortcutsSection } from './components/shortcuts/WebShortcutsSection';
import { ControlCenterDrawer } from './components/pc/ControlCenterDrawer';
import { usePcAgent } from './hooks/usePcAgent';

export function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const initialMode = (urlParams.get('layout') as LayoutMode) || 'grid';

  const [layoutMode, setLayoutMode] = useState<LayoutMode>(initialMode);
  const [isControlCenterOpen, setIsControlCenterOpen] = useState<boolean>(false);
  const systemStatus = useSystemStatus();
  const pcAgent = usePcAgent();

  // ==========================================
  // HOME ASSISTANT: BUTTONS & CONTROLS ONLY
  // ==========================================
  const { entities, toggle, setBrightness, callService, refetch: refetchHA } = useHomeAssistant(3000);

  const allBedroomLamps = entities['light.my_bedroom_light'];
  const lampAB = entities['light.lamp_a_b'];
  const lampCD = entities['light.lamp_c_d'];
  const homelabPlug = entities['switch.farhan_s_homelab_plug'];
  const pcUpsPlug = entities['switch.kamar_farhan_pc_ups_plug'];

  const allBedroomOn = allBedroomLamps?.state === 'on';
  const bedroomBrightness = allBedroomLamps?.attributes?.brightness
    ? Math.round((allBedroomLamps.attributes.brightness / 255) * 100)
    : 80;

  // ==========================================
  // INFLUXDB 2.x: ALL STATS & GRAPHS
  // ==========================================

  // Column 2 - Row 1: Temperature & Humidity (Current stats, no graph)
  const roomTempQuery = useInfluxQuery({
    bucket: 'farhan_homelab',
    measurement: '°C',
    field: 'value',
    entityId: 'kamar_farhan_tnh_sonoff_temperature',
    range: '2h',
    window: '5m',
    pollIntervalMs: 8000,
  });

  const roomHumidityQuery = useInfluxQuery({
    bucket: 'farhan_homelab',
    measurement: '%',
    field: 'value',
    entityId: 'kamar_farhan_tnh_sonoff_humidity',
    range: '2h',
    window: '5m',
    pollIntervalMs: 8000,
  });

  // Column 2 - Row 2: Whole Room Power Graph
  const roomPowerQuery = useInfluxQuery({
    bucket: 'farhan_homelab',
    measurement: 'W',
    field: 'value',
    entityId: 'farhan_s_room_total_power',
    range: '1h',
    window: '1m',
    pollIntervalMs: 4000,
  });

  // Column 2 - Row 3: Room Voltage Vitals Graph
  const roomVoltageQuery = useInfluxQuery({
    bucket: 'farhan_homelab',
    measurement: 'V',
    field: 'value',
    entityId: 'farhan_s_room_voltage_avg',
    range: '1h',
    window: '1m',
    pollIntervalMs: 5000,
  });

  // Column 3 - Row 1: Baremetal CPU Usage (PVE1 & NVR)
  const pve1CpuQuery = useInfluxQuery({
    bucket: 'infra_metrics',
    measurement: 'cpu',
    field: 'usage_idle',
    host: 'pve1',
    tagKey: 'cpu',
    tagValue: 'cpu-total',
    range: '1h',
    window: '1m',
    pollIntervalMs: 4000,
  });

  const nvrCpuQuery = useInfluxQuery({
    bucket: 'infra_metrics',
    measurement: 'cpu',
    field: 'usage_idle',
    host: 'nvr',
    tagKey: 'cpu',
    tagValue: 'cpu-total',
    range: '1h',
    window: '1m',
    pollIntervalMs: 4000,
  });

  // Column 3 - Row 2: Homelab UPS Battery SOC & Runtime
  const upsBatteryQuery = useInfluxQuery({
    bucket: 'infra_metrics',
    measurement: 'upsd',
    field: 'battery_charge_percent',
    host: 'pve1',
    range: '1h',
    window: '2m',
    pollIntervalMs: 6000,
  });

  const upsRuntimeQuery = useInfluxQuery({
    bucket: 'infra_metrics',
    measurement: 'upsd',
    field: 'battery_runtime',
    host: 'pve1',
    range: '1h',
    window: '2m',
    pollIntervalMs: 6000,
  });

  // Column 3 - Row 3: Mikrotik ether1 rate & Ping latency
  const mikrotikEther1Query = useInfluxQuery({
    bucket: 'infra_metrics',
    measurement: 'interface',
    ifName: 'ether1',
    field: 'ifHCInOctets',
    isNetworkRate: true,
    range: '30m',
    window: '1m',
    pollIntervalMs: 4000,
  });

  const pingQuery = useInfluxQuery({
    bucket: 'infra_metrics',
    measurement: 'ping',
    field: 'average_response_ms',
    host: 'pve1',
    url: '1.1.1.1',
    range: '30m',
    window: '1m',
    pollIntervalMs: 4000,
  });

  const handleRefreshAll = () => {
    refetchHA();
    roomTempQuery.refetch();
    roomHumidityQuery.refetch();
    roomPowerQuery.refetch();
    roomVoltageQuery.refetch();
    pve1CpuQuery.refetch();
    nvrCpuQuery.refetch();
    upsBatteryQuery.refetch();
    upsRuntimeQuery.refetch();
    mikrotikEther1Query.refetch();
    pingQuery.refetch();
  };

  const handleQuickScene = (scene: string) => {
    if (scene === 'focus') {
      callService('light', 'turn_on', {
        entity_id: 'light.my_bedroom_light',
        brightness: 255,
      });
    } else if (scene === 'night') {
      callService('automation', 'trigger', {
        entity_id: 'automation.sleep_routines_farhan',
      });
      callService('light', 'turn_off', {
        entity_id: 'light.my_bedroom_light',
      });
    } else if (scene === 'day') {
      callService('automation', 'trigger', {
        entity_id: 'automation.lampu_kamar_farhan_auto_on',
      });
    }
  };

  // Format UPS runtime
  const runtimeSeconds = upsRuntimeQuery.latestValue || 2389;
  const runtimeMinutes = Math.round(runtimeSeconds / 60);

  return (
    <div className="h-screen w-full bg-[#0a0b0e] text-slate-100 flex flex-col antialiased select-none overflow-hidden">
      {/* Top Mushroom Header bar with clock, live indicators, and quick scene triggers */}
      <MushroomHeader
        systemStatus={systemStatus}
        layoutMode={layoutMode}
        setLayoutMode={setLayoutMode}
        onRefreshAll={handleRefreshAll}
        onQuickScene={handleQuickScene}
        onToggleControlCenter={() => setIsControlCenterOpen(!isControlCenterOpen)}
        isControlCenterOpen={isControlCenterOpen}
        pcOnline={pcAgent.status.online}
        pcMasterVolume={pcAgent.status.master_volume}
      />

      {/* Android-style Slide-down Control Center & Audio Mixer Drawer */}
      <ControlCenterDrawer
        isOpen={isControlCenterOpen}
        onClose={() => setIsControlCenterOpen(false)}
      />

      {/* Main Panel Content Area - constrained to fit within Xeneon Edge display */}
      <main className="flex-1 w-full max-w-[1920px] mx-auto overflow-y-auto px-3 py-2">
        <DashboardGrid mode={layoutMode}>
          {/* ======================================================== */}
          {/* COLUMN 1: Home Assistant Bedroom Controls               */}
          {/* ======================================================== */}
          <SectionContainer
            title="Kontrol Kamar"
            badge="Home Assistant"
            mode={layoutMode}
          >
            {/* Row 1: Master All Bedroom Lamps Button */}
            <MushroomButtonCard
              title={allBedroomLamps?.attributes.friendly_name || 'Semua Lampu Kamar'}
              subtitle={allBedroomOn ? `Nyala • ${bedroomBrightness}%` : 'Mati'}
              icon={Lightbulb}
              active={allBedroomOn}
              accent="amber"
              onClick={() => toggle('light.my_bedroom_light')}
            />

            {/* Row 2: Master Brightness Slider */}
            <MushroomSliderCard
              title="Kecerahan Kamar"
              icon={Sliders}
              value={bedroomBrightness}
              active={allBedroomOn}
              accent="amber"
              onChange={(val) => setBrightness('light.my_bedroom_light', val)}
              onToggle={() => toggle('light.my_bedroom_light')}
            />

            {/* Row 3: Lamp Pairs (Lamp A-B & Lamp C-D) */}
            <div className="grid grid-cols-2 gap-2">
              <MushroomButtonCard
                title="Lamp A-B"
                subtitle={lampAB?.state === 'on' ? 'Nyala' : 'Mati'}
                icon={Lamp}
                active={lampAB?.state === 'on'}
                accent="orange"
                onClick={() => toggle('light.lamp_a_b')}
              />

              <MushroomButtonCard
                title="Lamp C-D"
                subtitle={lampCD?.state === 'on' ? 'Nyala' : 'Mati'}
                icon={Lamp}
                active={lampCD?.state === 'on'}
                accent="orange"
                onClick={() => toggle('light.lamp_c_d')}
              />
            </div>

            {/* Row 4: Smart Plugs in 2 columns */}
            <div className="grid grid-cols-2 gap-2">
              <MushroomButtonCard
                title="Homelab Plug"
                subtitle={homelabPlug?.state === 'on' ? 'On' : 'Off'}
                icon={Server}
                active={homelabPlug?.state === 'on'}
                accent="purple"
                onClick={() => toggle('switch.farhan_s_homelab_plug')}
              />

              <MushroomButtonCard
                title="PC UPS Plug"
                subtitle={pcUpsPlug?.state === 'on' ? 'On' : 'Off'}
                icon={ShieldCheck}
                active={pcUpsPlug?.state === 'on'}
                accent="cyan"
                onClick={() => toggle('switch.kamar_farhan_pc_ups_plug')}
              />
            </div>
          </SectionContainer>

          {/* ======================================================== */}
          {/* COLUMN 2: Lingkungan & Daya (EXACTLY 3 ROWS)            */}
          {/* ======================================================== */}
          <SectionContainer
            title="Lingkungan & Daya Kamar"
            badge="InfluxDB"
            mode={layoutMode}
          >
            {/* ROW 1: Suhu & Kelembaban (2 columns in a row, NO GRAPH) */}
            <div className="grid grid-cols-2 gap-2">
              <MushroomStatCard
                title="Suhu Kamar"
                value={roomTempQuery.latestValue || 0}
                unit="°C"
                icon={Thermometer}
                accent="rose"
                subtitle="Sonoff TnH"
              />

              <MushroomStatCard
                title="Kelembaban"
                value={roomHumidityQuery.latestValue || 0}
                unit="%"
                icon={Droplet}
                accent="cyan"
                subtitle="Sonoff TnH"
              />
            </div>

            {/* ROW 2: Whole Room Power Graph */}
            <MushroomGraphCard
              title="Total Daya Kamar Farhan"
              value={roomPowerQuery.latestValue || 0}
              unit="W"
              delta={roomPowerQuery.delta}
              icon={Zap}
              accent="amber"
              data={roomPowerQuery.points}
              chartHeight={48}
            />

            {/* ROW 3: Power Vitals (Voltage Only Graph) */}
            <MushroomGraphCard
              title="Tegangan Listrik Kamar"
              value={roomVoltageQuery.latestValue || 0}
              unit="V"
              delta={roomVoltageQuery.delta}
              icon={Activity}
              accent="emerald"
              data={roomVoltageQuery.points}
              chartHeight={48}
            />
          </SectionContainer>

          {/* ======================================================== */}
          {/* COLUMN 3: Homelab & Infrastruktur (EXACTLY 3 ROWS)      */}
          {/* ======================================================== */}
          <SectionContainer
            title="Homelab & Infrastruktur"
            badge="Telegraf • InfluxDB"
            mode={layoutMode}
          >
            {/* ROW 1: Baremetal CPU usage for both homelab machines in a row */}
            <div className="grid grid-cols-2 gap-2">
              <MushroomStatCard
                title="Proxmox PVE1"
                value={pve1CpuQuery.latestValue || 0}
                unit="%"
                icon={Cpu}
                accent="blue"
                subtitle="CPU Load"
              />

              <MushroomStatCard
                title="NVR Server"
                value={nvrCpuQuery.latestValue || 0}
                unit="%"
                icon={Cpu}
                accent="orange"
                subtitle="CPU Load"
              />
            </div>

            {/* ROW 2: Homelab UPS Battery SOC (with Runtime Remaining) */}
            <MushroomGraphCard
              title={`Homelab UPS (${runtimeMinutes}m remaining)`}
              value={upsBatteryQuery.latestValue || 100}
              unit="%"
              delta={upsBatteryQuery.delta}
              icon={ShieldCheck}
              accent="emerald"
              data={upsBatteryQuery.points}
              chartHeight={48}
            />

            {/* ROW 3: Mikrotik ether1 Rate & Ping Latency (2 columns in a row) */}
            <div className="grid grid-cols-2 gap-2">
              <MushroomStatCard
                title="Mikrotik ether1"
                value={mikrotikEther1Query.latestValue || 0}
                unit="Mbps"
                icon={Network}
                accent="purple"
                subtitle="Traffic Rate"
              />

              <MushroomStatCard
                title="Ping Latency"
                value={pingQuery.latestValue || 0}
                unit="ms"
                icon={Radio}
                accent="emerald"
                subtitle="Cloudflare 1.1.1.1"
              />
            </div>
          </SectionContainer>

          {/* ======================================================== */}
          {/* COLUMN 4: Configurable Web Shortcuts (SQLite)          */}
          {/* ======================================================== */}
          <WebShortcutsSection mode={layoutMode} />
        </DashboardGrid>
      </main>

      {/* Compact Bottom Status Bar */}
      <footer className="w-full bg-[#0a0b0e] border-t border-white/5 px-4 py-1.5 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Xeneon Edge Viewport</span>
        </div>
        <div className="font-mono text-[10px]">
          {layoutMode === 'ribbon' ? 'Ribbon Mode (32:9)' : 'Grid Mode (Responsive)'}
        </div>
      </footer>
    </div>
  );
}

export default App;
