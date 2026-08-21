'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { api } from '@/lib/api';
import { 
  HealthResponse, SystemStatusResponse, SystemReadinessResponse,
  SystemDiagnosticsResponse, SegmentState, DirectionType, 
  CorridorMetricsSummary, IncidentImpactReport, DiversionRouteResponse, 
  EmergencyDispatchResponse, AlertItem, VMSAdvisory, PatrolRecommendation, 
  TimelineEvent, OperationalMode, IncidentType, SeverityType, DemoStepDetail
} from '@/lib/types';
import { SystemStatus } from './system-status';
import { RiskSummary } from './risk-summary';
import { WeatherSummary } from './weather-summary';
import { TrafficSummary } from './traffic-summary';
import { RoadTwinMap } from '../map/roadtwin-map';
import { SegmentDetails } from '../segment/segment-details';
import { IncidentModal } from '../simulation/incident-modal';
import { IncidentImpactPanel } from '../simulation/incident-impact-panel';
import { DiversionPanel } from '../simulation/diversion-panel';
import { EmergencyDispatchPanel } from '../simulation/emergency-dispatch-panel';
import { SimulationBanner } from '../simulation/simulation-banner';
import { AlertFeed } from '../alerts/alert-feed';
import { VMSAdvisoryPanel } from '../operations/vms-advisory-panel';
import { PatrolPanel } from '../operations/patrol-panel';
import { EventTimeline } from '../operations/event-timeline';
import { DataProvenanceDrawer } from '../operations/data-provenance-drawer';
import { DemoController } from '../demo/demo-controller';
import { DiagnosticsModal } from '../diagnostics/diagnostics-modal';
import { ErrorBoundary } from './error-boundary';
import { 
  WifiOff, RefreshCw, Layers, Bell, Radio, 
  Shield, History, Sliders, Database 
} from 'lucide-react';

export function CommandCenter() {
  // Core Data State
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatusResponse | null>(null);
  const [readiness, setReadiness] = useState<SystemReadinessResponse | null>(null);
  const [diagnostics, setDiagnostics] = useState<SystemDiagnosticsResponse | null>(null);
  const [segments, setSegments] = useState<SegmentState[]>([]);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>('YE_MAIN_SB_050');
  const [selectedSegmentData, setSelectedSegmentData] = useState<SegmentState | null>(null);
  const [directionFilter, setDirectionFilter] = useState<DirectionType>('ALL');
  const [currentMode, setCurrentMode] = useState<OperationalMode>('BASELINE');

  // Operational Intelligence State
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [vmsAdvisories, setVmsAdvisories] = useState<VMSAdvisory[]>([]);
  const [patrolRecs, setPatrolRecs] = useState<PatrolRecommendation[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [activeTab, setActiveTab] = useState<'TELEMETRY' | 'ALERTS' | 'VMS' | 'PATROL' | 'TIMELINE'>('TELEMETRY');
  
  // Modals & Drawers
  const [isProvenanceOpen, setIsProvenanceOpen] = useState<boolean>(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState<boolean>(false);

  // SIH Demo Controller State
  const [isDemoActive, setIsDemoActive] = useState<boolean>(false);
  const [demoStep, setDemoStep] = useState<number>(1);
  const [demoDetail, setDemoDetail] = useState<DemoStepDetail | null>(null);
  const [demoLoading, setDemoLoading] = useState<boolean>(false);

  // Simulation State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [impactReport, setImpactReport] = useState<IncidentImpactReport | null>(null);
  const [diversionData, setDiversionData] = useState<DiversionRouteResponse | null>(null);
  const [emergencyData, setEmergencyData] = useState<EmergencyDispatchResponse | null>(null);
  const [isEmergencyAnimating, setIsEmergencyAnimating] = useState<boolean>(false);

  // Loading & Error States
  const [loading, setLoading] = useState<boolean>(true);
  const [segmentLoading, setSegmentLoading] = useState<boolean>(false);
  const [simulationLoading, setSimulationLoading] = useState<boolean>(false);
  const [diversionLoading, setDiversionLoading] = useState<boolean>(false);
  const [emergencyLoading, setEmergencyLoading] = useState<boolean>(false);
  const [resetLoading, setResetLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Segment lookup map
  const segmentStatesMap = useMemo(() => {
    const map: Record<string, SegmentState> = {};
    segments.forEach((s) => {
      map[s.segment_id] = s;
    });
    return map;
  }, [segments]);

  // Aggregate Corridor Metrics
  const metrics: CorridorMetricsSummary = useMemo(() => {
    const total = segments.length;
    if (total === 0) {
      return {
        total_segments: 405,
        mainline_segments: 366,
        ramp_segments: 39,
        critical_risk_count: 0,
        high_risk_count: 0,
        moderate_risk_count: 0,
        low_risk_count: 405,
        mean_speed_kph: 92.4,
        mean_congestion_ratio: 0.05,
        mean_risk_score: 0.007,
        corridor_length_km: 165.0,
      };
    }

    let critical = 0;
    let high = 0;
    let moderate = 0;
    let low = 0;
    let speedSum = 0;
    let congestionSum = 0;
    let riskSum = 0;
    let mainline = 0;
    let ramps = 0;

    segments.forEach((s) => {
      if (s.is_mainline) mainline++;
      if (s.is_ramp) ramps++;
      if (s.risk_category === 'CRITICAL_RISK') critical++;
      else if (s.risk_category === 'HIGH_RISK') high++;
      else if (s.risk_category === 'MODERATE_RISK') moderate++;
      else low++;

      speedSum += s.speed_kph || 0;
      congestionSum += s.congestion_ratio || 0;
      riskSum += s.risk_score || 0;
    });

    return {
      total_segments: total,
      mainline_segments: mainline,
      ramp_segments: ramps,
      critical_risk_count: critical,
      high_risk_count: high,
      moderate_risk_count: moderate,
      low_risk_count: low,
      mean_speed_kph: speedSum / total,
      mean_congestion_ratio: congestionSum / total,
      mean_risk_score: riskSum / total,
      corridor_length_km: 165.0,
    };
  }, [segments]);

  // 1. Master Data Fetch (State, Alerts, VMS, Patrol, Timeline, Diagnostics)
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [healthData, statusData, readinessData, diagData, stateData, alertsData, vmsData, patrolData, tlData] = await Promise.all([
        api.getHealth().catch(() => null),
        api.getSystemStatus().catch(() => null),
        api.getReadiness().catch(() => null),
        api.getDiagnostics().catch(() => null),
        api.getDigitalTwinState(405).catch(() => null),
        api.getActiveAlerts().catch(() => ({ alerts: [] })),
        api.getVMSAdvisories().catch(() => ({ advisories: [] })),
        api.getPatrolRecommendations().catch(() => ({ recommendations: [] })),
        api.getTimeline().catch(() => ({ events: [] })),
      ]);

      if (healthData) setHealth(healthData);
      if (statusData) {
        setSystemStatus(statusData);
        setCurrentMode(statusData.mode || 'BASELINE');
      }
      if (readinessData) setReadiness(readinessData);
      if (diagData) setDiagnostics(diagData);
      if (stateData && stateData.segments) {
        setSegments(stateData.segments);
        setLastUpdated(stateData.last_update_timestamp);
      }
      if (alertsData && alertsData.alerts) {
        setAlerts(alertsData.alerts);
      }
      if (vmsData && vmsData.advisories) {
        setVmsAdvisories(vmsData.advisories);
      }
      if (patrolData && patrolData.recommendations) {
        setPatrolRecs(patrolData.recommendations);
      }
      if (tlData && tlData.events) {
        setTimelineEvents(tlData.events);
      }
    } catch (err: any) {
      console.error('FastAPI Backend fetch error:', err);
      setError(err.message || 'Failed to connect to RoadTwin backend');
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Fetch Selected Segment Details
  const fetchSelectedSegment = useCallback(async (segmentId: string) => {
    setSegmentLoading(true);
    try {
      const res = await api.getSegment(segmentId);
      if (res && res.state) {
        setSelectedSegmentData(res.state);
      }
    } catch (err) {
      if (segmentStatesMap[segmentId]) {
        setSelectedSegmentData(segmentStatesMap[segmentId]);
      }
    } finally {
      setSegmentLoading(false);
    }
  }, [segmentStatesMap]);

  // Initial Load & 30-Second Polling
  useEffect(() => {
    fetchAllData();
    const interval = setInterval(() => {
      fetchAllData();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchAllData]);

  useEffect(() => {
    if (selectedSegmentId) {
      fetchSelectedSegment(selectedSegmentId);
    }
  }, [selectedSegmentId, fetchSelectedSegment]);

  // 3. Handle Mode Switch
  const handleModeChange = async (newMode: OperationalMode) => {
    try {
      setLoading(true);
      await api.setMode(newMode);
      setCurrentMode(newMode);
      await fetchAllData();
      if (newMode === 'DEMO_NIGHT_FOG') {
        setActiveTab('ALERTS');
      }
    } catch (err: any) {
      alert(`Mode switch failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 4. Handle SIH Demo Controller Step Progression
  const handleRunDemoStep = async (stepNum: number) => {
    setDemoLoading(true);
    try {
      const res = await api.executeDemoStep(stepNum);
      if (res && res.demo_step) {
        setDemoStep(stepNum);
        setDemoDetail(res.demo_step);
        if (res.demo_step.target_segment_id) {
          setSelectedSegmentId(res.demo_step.target_segment_id);
        }
        if (res.demo_step.active_tab) {
          setActiveTab(res.demo_step.active_tab);
        }
        await fetchAllData();
      }
    } catch (err: any) {
      alert(`Demo step execution failed: ${err.message}`);
    } finally {
      setDemoLoading(false);
    }
  };

  const handleStartDemo = () => {
    setIsDemoActive(true);
    handleRunDemoStep(1);
  };

  const handleNextDemoStep = () => {
    if (demoStep < 10) {
      handleRunDemoStep(demoStep + 1);
    }
  };

  const handlePrevDemoStep = () => {
    if (demoStep > 1) {
      handleRunDemoStep(demoStep - 1);
    }
  };

  const handleResetDemo = async () => {
    setDemoLoading(true);
    try {
      await api.resetDemo();
      setImpactReport(null);
      setDiversionData(null);
      setEmergencyData(null);
      setIsEmergencyAnimating(false);
      setDemoStep(1);
      await handleRunDemoStep(1);
    } catch (err: any) {
      alert(`Demo reset failed: ${err.message}`);
    } finally {
      setDemoLoading(false);
    }
  };

  // 5. Handle Alert Acknowledgement
  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await api.acknowledgeAlert(alertId, 'Acknowledged from Command Center UI');
      await fetchAllData();
    } catch (err: any) {
      alert(`Acknowledgement failed: ${err.message}`);
    }
  };

  // 6. Handle Running What-If Incident Simulation
  const handleRunSimulation = async (params: {
    segment_id: string;
    incident_type: IncidentType;
    severity: SeverityType;
    capacity_factor: number;
  }) => {
    setSimulationLoading(true);
    try {
      const res = await api.simulateIncident({
        segment_id: params.segment_id,
        incident_type: params.incident_type,
        severity: params.severity,
        capacity_factor: params.capacity_factor,
      });

      if (res && res.impact_report) {
        setImpactReport(res.impact_report);
        setSelectedSegmentId(params.segment_id);
        setIsModalOpen(false);
        await fetchAllData();
        setActiveTab('TELEMETRY');
      }
    } catch (err: any) {
      alert(`Simulation failed: ${err.message}`);
    } finally {
      setSimulationLoading(false);
    }
  };

  // 7. Handle Calculating Diversion Route
  const handleCalculateDiversion = async () => {
    if (!impactReport) return;
    setDiversionLoading(true);
    try {
      const res = await api.computeDiversion({
        origin_node: '1803900020',
        dest_node: '11881660640',
        incident_segment_id: impactReport.incident_segment_id,
      });
      setDiversionData(res);
    } catch (err: any) {
      alert(`Diversion calculation error: ${err.message}`);
    } finally {
      setDiversionLoading(false);
    }
  };

  // 8. Handle Dispatching Emergency Response
  const handleDispatchEmergency = async () => {
    if (!impactReport) return;
    setEmergencyLoading(true);
    try {
      const res = await api.dispatchEmergency({
        target_segment_id: impactReport.incident_segment_id,
        incident_type: impactReport.incident_type,
        severity: impactReport.severity,
      });
      setEmergencyData(res);
      setIsEmergencyAnimating(true);
      await fetchAllData();
    } catch (err: any) {
      alert(`Emergency dispatch error: ${err.message}`);
    } finally {
      setEmergencyLoading(false);
    }
  };

  // 9. Handle Complete Simulation Reset
  const handleResetSimulation = async () => {
    setResetLoading(true);
    try {
      await api.resetSimulation();
      setImpactReport(null);
      setDiversionData(null);
      setEmergencyData(null);
      setIsEmergencyAnimating(false);
      await fetchAllData();
    } catch (err: any) {
      setImpactReport(null);
      setDiversionData(null);
      setEmergencyData(null);
      setIsEmergencyAnimating(false);
      await fetchAllData();
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <div className="flex flex-col min-h-screen bg-[#0B1120] text-slate-100">
        {/* Top Header System Status & Mode Switcher */}
        <SystemStatus
          health={health}
          systemStatus={systemStatus}
          currentMode={currentMode}
          onModeChange={handleModeChange}
          onOpenProvenance={() => setIsProvenanceOpen(true)}
          onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
          onOpenDemo={handleStartDemo}
          isDemoActive={isDemoActive}
          loading={loading}
          error={error}
          onRefresh={fetchAllData}
          lastUpdated={lastUpdated}
        />

        {/* Persistent Simulation Active Banner */}
        <SimulationBanner
          impact={impactReport}
          onReset={handleResetSimulation}
          resetLoading={resetLoading}
        />

        {/* Backend Connection Error Banner */}
        {error && (
          <div className="bg-red-950/90 border-b border-red-500/50 px-6 py-2 text-xs text-red-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-red-400" />
              <span>
                <strong>BACKEND OFFLINE:</strong> {error}. Running on local state cache.
              </span>
            </div>
            <button
              onClick={fetchAllData}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-red-800 hover:bg-red-700 text-white text-[11px] font-medium transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Corridor Level Metrics Summary Bar */}
        <RiskSummary metrics={metrics} loading={loading} />

        {/* Main Operational Dashboard Grid */}
        <main className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left/Center: Interactive Map (7 Columns on desktop) */}
          <div className="lg:col-span-7 flex flex-col h-[750px] lg:h-auto">
            <RoadTwinMap
              segmentStates={segmentStatesMap}
              selectedSegmentId={selectedSegmentId}
              onSelectSegment={(id) => {
                setSelectedSegmentId(id);
                setActiveTab('TELEMETRY');
              }}
              directionFilter={directionFilter}
              onDirectionChange={(dir) => setDirectionFilter(dir)}
              impactReport={impactReport}
              diversionData={diversionData}
              emergencyData={emergencyData}
              onOpenSimulationModal={() => setIsModalOpen(true)}
              isEmergencyAnimating={isEmergencyAnimating}
            />
          </div>

          {/* Right: Operational Hub & Telemetry (5 Columns on desktop) */}
          <div className="lg:col-span-5 flex flex-col gap-3 overflow-y-auto max-h-[85vh]">
            {/* Operational Hub Navigation Tabs */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-1 flex items-center justify-between text-xs font-mono">
              <button
                onClick={() => setActiveTab('TELEMETRY')}
                className={`flex-1 py-1.5 px-2 rounded font-semibold text-center transition-all flex items-center justify-center gap-1 ${
                  activeTab === 'TELEMETRY' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Telemetry</span>
              </button>
              <button
                onClick={() => setActiveTab('ALERTS')}
                className={`flex-1 py-1.5 px-2 rounded font-semibold text-center transition-all flex items-center justify-center gap-1 ${
                  activeTab === 'ALERTS' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Alerts ({alerts.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('VMS')}
                className={`flex-1 py-1.5 px-2 rounded font-semibold text-center transition-all flex items-center justify-center gap-1 ${
                  activeTab === 'VMS' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>VMS</span>
              </button>
              <button
                onClick={() => setActiveTab('PATROL')}
                className={`flex-1 py-1.5 px-2 rounded font-semibold text-center transition-all flex items-center justify-center gap-1 ${
                  activeTab === 'PATROL' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Patrol</span>
              </button>
              <button
                onClick={() => setActiveTab('TIMELINE')}
                className={`flex-1 py-1.5 px-2 rounded font-semibold text-center transition-all flex items-center justify-center gap-1 ${
                  activeTab === 'TIMELINE' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Timeline</span>
              </button>
            </div>

            {/* Active Incident Impact Panel */}
            {impactReport && (
              <IncidentImpactPanel
                impact={impactReport}
                onCalculateDiversion={handleCalculateDiversion}
                onDispatchEmergency={handleDispatchEmergency}
                onReset={handleResetSimulation}
                onSelectSegment={(id) => {
                  setSelectedSegmentId(id);
                  setActiveTab('TELEMETRY');
                }}
                diversionLoading={diversionLoading}
                emergencyLoading={emergencyLoading}
                resetLoading={resetLoading}
              />
            )}

            {/* Diversion Route Panel */}
            {diversionData && (
              <DiversionPanel
                diversion={diversionData}
                onClose={() => setDiversionData(null)}
              />
            )}

            {/* Emergency Response Panel */}
            {emergencyData && (
              <EmergencyDispatchPanel
                dispatch={emergencyData}
                onClose={() => {
                  setEmergencyData(null);
                  setIsEmergencyAnimating(false);
                }}
                isAnimating={isEmergencyAnimating}
                onToggleAnimation={() => setIsEmergencyAnimating(!isEmergencyAnimating)}
              />
            )}

            {/* Tab 1: Telemetry */}
            {activeTab === 'TELEMETRY' && (
              <>
                <SegmentDetails
                  segment={selectedSegmentData || (selectedSegmentId ? segmentStatesMap[selectedSegmentId] : null)}
                  loading={segmentLoading}
                  onClose={() => setSelectedSegmentId(null)}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <WeatherSummary
                    temperatureC={selectedSegmentData?.temperature_c || 22.0}
                    humidityPct={selectedSegmentData?.relative_humidity_pct || 65.0}
                    windSpeedMs={selectedSegmentData?.wind_speed_ms || 2.5}
                    fogRiskCode={selectedSegmentData?.fog_risk_code || 0}
                  />
                  <TrafficSummary
                    mode={currentMode}
                    meanSpeedKph={metrics.mean_speed_kph}
                    totalSegments={metrics.total_segments}
                    trafficProvider={systemStatus?.traffic_provider}
                  />
                </div>
              </>
            )}

            {/* Tab 2: Alerts */}
            {activeTab === 'ALERTS' && (
              <AlertFeed
                alerts={alerts}
                onSelectSegment={(id) => {
                  setSelectedSegmentId(id);
                  setActiveTab('TELEMETRY');
                }}
                onAcknowledge={handleAcknowledgeAlert}
              />
            )}

            {/* Tab 3: VMS Display Gantries */}
            {activeTab === 'VMS' && (
              <VMSAdvisoryPanel
                advisories={vmsAdvisories}
                onSelectSegment={(id) => {
                  setSelectedSegmentId(id);
                  setActiveTab('TELEMETRY');
                }}
              />
            )}

            {/* Tab 4: Patrol Deployments */}
            {activeTab === 'PATROL' && (
              <PatrolPanel
                recommendations={patrolRecs}
                onSelectSegment={(id) => {
                  setSelectedSegmentId(id);
                  setActiveTab('TELEMETRY');
                }}
              />
            )}

            {/* Tab 5: Event Timeline */}
            {activeTab === 'TIMELINE' && (
              <EventTimeline
                events={timelineEvents}
                onSelectSegment={(id) => {
                  setSelectedSegmentId(id);
                  setActiveTab('TELEMETRY');
                }}
              />
            )}
          </div>
        </main>

        {/* What-If Incident Modal */}
        <IncidentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          selectedSegmentId={selectedSegmentId || 'YE_MAIN_SB_050'}
          onRunSimulation={handleRunSimulation}
          loading={simulationLoading}
        />

        {/* Data Provenance & Safety Semantics Drawer */}
        <DataProvenanceDrawer
          isOpen={isProvenanceOpen}
          onClose={() => setIsProvenanceOpen(false)}
        />

        {/* Diagnostics & Observability Modal */}
        <DiagnosticsModal
          isOpen={isDiagnosticsOpen}
          onClose={() => setIsDiagnosticsOpen(false)}
          readiness={readiness}
          diagnostics={diagnostics}
          loading={loading}
          onRefresh={fetchAllData}
        />

        {/* SIH 2026 Official Demo Controller */}
        <DemoController
          isOpen={isDemoActive}
          currentStep={demoStep}
          stepDetail={demoDetail}
          onNextStep={handleNextDemoStep}
          onPrevStep={handlePrevDemoStep}
          onResetDemo={handleResetDemo}
          onCloseDemo={() => setIsDemoActive(false)}
          loading={demoLoading}
        />

        {/* Footer */}
        <footer className="bg-slate-900 border-t border-slate-800 px-6 py-2 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
          <div>
            RoadTwin AI © 2026 · Team CltAltDefeat · G. L. Bajaj Institute of Technology & Management
          </div>
          <div className="flex items-center gap-4 font-mono text-[10px]">
            <span>Corridor: Yamuna Expressway (165 km)</span>
            <span>•</span>
            <span>Mode: {currentMode}</span>
            <span>•</span>
            <span>CP07 XGBoost: 31 Features</span>
            <span>•</span>
            <span>Readiness: {readiness?.status || 'READY'}</span>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}
