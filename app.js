/**
 * ============================================================================
 * HRES MICROGRID SIMULATOR — JAVASCRIPT CONTROLLER (PHILIPPINE PESO ₱)
 * Zero-Flicker Architecture, Capacity Sizing Optimization & Diurnal Profile
 * Paper: Agajie et al., MDPI Sustainability 2023, 15, 8264
 * Implementation by Franz Xyrlo Tobias, PEE
 * ============================================================================
 */

document.addEventListener("DOMContentLoaded", () => {
  // 1. DATA REPOSITORY: 3 METAHEURISTIC OPTIMIZATION ALGORITHMS (PHP CONVERSION ₱61.50 = €1.00)
  const EUR_TO_PHP = 61.50;

  const ALGO_DATA = {
    NSWOA: {
      name: "Non-dominated Sorting Whale Optimization Algorithm",
      tag: "Optimal",
      pvCapacity: 5495.44,       // kWp
      biogasCapacity: 860.29,    // kW
      phesCapacity: 400.67,      // kW
      reservoirCap: 26798.14,    // m³
      smesCapacity: 142.28,      // kWh
      npcEur: 6.997,             // Million EUR
      npcPhp: 6.997 * EUR_TO_PHP,// Million PHP (₱430.31M)
      coeEur: 0.053102,
      coePhp: 0.053102 * EUR_TO_PHP, // ₱3.266/kWh
      lcoeEur: 0.046218,
      lcoePhp: 0.046218 * EUR_TO_PHP,// ₱2.842/kWh
      lpsp: 0.0085,              // 0.85%
      lole: 10.605,              // h/yr
      co2Reduction: 7.3679,      // Million kg CO2/yr
      co2Percent: "45.7%",
      pvEnergyShare: 43,
      biogasEnergyShare: 45,
      phesEnergyShare: 12
    },
    MOGWO: {
      name: "Multi-Objective Grey Wolf Optimizer",
      tag: "Pareto Front",
      pvCapacity: 5228.58,
      biogasCapacity: 936.94,
      phesCapacity: 378.97,
      reservoirCap: 25296.88,
      smesCapacity: 142.28,
      npcEur: 7.008,
      npcPhp: 7.008 * EUR_TO_PHP,    // ₱430.99M
      coeEur: 0.053625,
      coePhp: 0.053625 * EUR_TO_PHP, // ₱3.298/kWh
      lcoeEur: 0.046897,
      lcoePhp: 0.046897 * EUR_TO_PHP,// ₱2.884/kWh
      lpsp: 0.0089,
      lole: 11.502,
      co2Reduction: 7.3325,
      co2Percent: "45.5%",
      pvEnergyShare: 42,
      biogasEnergyShare: 46,
      phesEnergyShare: 12
    },
    MOPSO: {
      name: "Multi-Objective Particle Swarm Optimization",
      tag: "Pareto Front",
      pvCapacity: 5464.31,
      biogasCapacity: 941.63,
      phesCapacity: 362.86,
      reservoirCap: 24995.71,
      smesCapacity: 142.28,
      npcEur: 7.011,
      npcPhp: 7.011 * EUR_TO_PHP,    // ₱431.18M
      coeEur: 0.053743,
      coePhp: 0.053743 * EUR_TO_PHP, // ₱3.305/kWh
      lcoeEur: 0.046985,
      lcoePhp: 0.046985 * EUR_TO_PHP,// ₱2.890/kWh
      lpsp: 0.0092,
      lole: 14.201,
      co2Reduction: 7.3275,
      co2Percent: "45.4%",
      pvEnergyShare: 43,
      biogasEnergyShare: 45,
      phesEnergyShare: 12
    }
  };

  // 2. SIMULATION STATE
  const state = {
    algo: "NSWOA",
    customSizing: false,
    pvCap: 5495.44,           // Active PV capacity (kWp)
    biogasCap: 860.29,        // Active Biogas capacity (kW)
    phesCap: 400.67,          // Active PHES capacity (kW)
    smesCap: 142.28,          // Active SMES capacity (kWh)
    reservoirCap: 26798.14,   // m³
    solarIrradiance: 850,     // W/m² (0 to 1196 W/m²)
    loadDemand: 1185,         // kW (Nominal: 1185, Peak: 1707, Min: 663)
    phesReservoirSOC: 76.5,   // % of upper reservoir volume
    smesSOC: 85.0,            // % of SMES coil storage (5% to 100%)
    smesFloatCharging: false, // Float charge hysteresis state
    smesPower: 0,             // kW (+ discharging, - charging)
    smesImpulse: 0,           // kW transient damper
    biogasPower: 0,           // kW
    phesPower: 0,             // kW (+ generating, - pumping)
    pvPower: 0,               // kW
    gridPower: 0,             // kW (+ exporting, - importing)
    netPower: 0,              // kW
    unservedPower: 0,         // kW
    currentMode: "MODE I",
    viewMode: "flow",         // "flow", "profile", "trend"
    gridConnected: true,      // true: grid-connected, false: islanded microgrid
    autoRun: false,           // Continuous dynamic simulation active
    autoRunTime: 12.0,        // 24-hour cycle time in hours (0.0 to 24.0)
    soundEnabled: true,       // Audio FX toggle
    activeFilter: "all",      // Log filter: all, dispatch, storage, grid
    history: []               // Trend history buffer
  };

  // DOM Elements
  const algoButtons = document.querySelectorAll(".algo-btn");
  const badgeDispatchMode = document.getElementById("badge-dispatch-mode");
  const badgeGridStatus = document.getElementById("badge-grid-status");
  const valNetPower = document.getElementById("val-net-power");
  const valNetLabel = document.getElementById("val-net-label");

  const kpiNpc = document.getElementById("kpi-npc");
  const kpiLcoe = document.getElementById("kpi-lcoe");
  const kpiLpsp = document.getElementById("kpi-lpsp");
  const kpiRelSub = document.getElementById("kpi-rel-sub");
  const kpiCo2 = document.getElementById("kpi-co2");
  const kpiGhgSub = document.getElementById("kpi-ghg-sub");

  const canvasSectionTitle = document.getElementById("canvas-section-title");
  const chipPvVal = document.getElementById("chip-pv-val");
  const chipBiogasVal = document.getElementById("chip-biogas-val");
  const chipPhesVal = document.getElementById("chip-phes-val");
  const chipSmesVal = document.getElementById("chip-smes-val");
  const chipGridVal = document.getElementById("chip-grid-val");

  const lblGaugePhes = document.getElementById("lbl-gauge-phes");
  const barGaugePhes = document.getElementById("bar-gauge-phes");
  const lblGaugeSmes = document.getElementById("lbl-gauge-smes");
  const barGaugeSmes = document.getElementById("bar-gauge-smes");

  const sliderCapPv = document.getElementById("slider-cap-pv");
  const lblCapPv = document.getElementById("lbl-cap-pv");
  const sliderCapBiogas = document.getElementById("slider-cap-biogas");
  const lblCapBiogas = document.getElementById("lbl-cap-biogas");
  const sliderCapPhes = document.getElementById("slider-cap-phes");
  const lblCapPhes = document.getElementById("lbl-cap-phes");
  const sliderCapSmes = document.getElementById("slider-cap-smes");
  const lblCapSmes = document.getElementById("lbl-cap-smes");
  const btnOptimizeSize = document.getElementById("btn-optimize-size");
  const btnToggleSizing = document.getElementById("btn-toggle-sizing");
  const sizingSliderGrid = document.getElementById("sizing-slider-grid");

  const sliderIrradiance = document.getElementById("slider-irradiance");
  const lblIrradiance = document.getElementById("lbl-irradiance");
  const sliderLoad = document.getElementById("slider-load");
  const lblLoad = document.getElementById("lbl-load");

  const btnToggleView = document.getElementById("btn-toggle-view");
  const btnToggleProfile = document.getElementById("btn-toggle-profile");
  const btnToggleTrend = document.getElementById("btn-toggle-trend");
  const btnSimulate = document.getElementById("btn-simulate");
  const btnCloudShock = document.getElementById("btn-cloud-shock");
  const btnNightMode = document.getElementById("btn-night-mode");
  const btnIslandMode = document.getElementById("btn-island-mode");
  const btnSound = document.getElementById("btn-sound");
  const btnReset = document.getElementById("btn-reset");
  const btnInfo = document.getElementById("btn-info");
  const modalInfo = document.getElementById("modal-info");
  const btnCloseModal = document.getElementById("btn-close-modal");
  const lblSimStatus = document.getElementById("lbl-sim-status");

  const eventLogTerminal = document.getElementById("event-log-terminal");
  const logCounter = document.getElementById("log-counter");
  const btnClearLog = document.getElementById("btn-clear-log");
  const logFilterBtns = document.querySelectorAll(".log-filter-btn");

  const canvas = document.getElementById("flowCanvas");
  const ctx = canvas.getContext("2d");

  // 3. SOUND SYNTHESIZER
  let audioCtx = null;
  function getAudioCtx() {
    if (!audioCtx) {
      const AudioClass = window.AudioContext || window.webkitAudioContext;
      if (AudioClass) audioCtx = new AudioClass();
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playTone(freq = 480, duration = 0.08, type = "sine") {
    if (!state.soundEnabled) return;
    try {
      const ctx = getAudioCtx();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.03, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  }

  window.addEventListener("touchstart", () => getAudioCtx(), { once: true, passive: true });
  window.addEventListener("click", () => getAudioCtx(), { once: true, passive: true });

  // 4. ZERO-JITTER CANVAS INITIALIZATION
  let canvasLogicalW = 0;
  let canvasLogicalH = 0;

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const newW = Math.max(280, Math.floor(rect.width));
    const newH = Math.max(120, Math.floor(rect.height));

    if (newW !== canvasLogicalW || newH !== canvasLogicalH) {
      canvasLogicalW = newW;
      canvasLogicalH = newH;
      canvas.width = Math.round(newW * dpr);
      canvas.height = Math.round(newH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }

  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  // 5. SCADA EVENT LOGGER ENGINE
  const logEvents = [];
  let eventSeq = 0;

  function addLog(category, tag, message) {
    eventSeq++;
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;

    const eventObj = {
      id: eventSeq,
      category,
      tag,
      time: timeStr,
      msg: message
    };

    logEvents.push(eventObj);
    if (logEvents.length > 50) logEvents.shift();

    renderLogs();
  }

  function renderLogs() {
    logCounter.textContent = `${logEvents.length} Events`;
    const filtered = state.activeFilter === "all" 
      ? logEvents 
      : logEvents.filter(e => e.category === state.activeFilter);

    eventLogTerminal.innerHTML = "";
    filtered.slice(-25).forEach(e => {
      const line = document.createElement("div");
      line.className = "log-line";

      let tagClass = "log-tag-mode";
      if (e.tag === "SMES") tagClass = "log-tag-smes";
      else if (e.tag === "PHES") tagClass = "log-tag-phes";
      else if (e.tag === "BIOGAS") tagClass = "log-tag-biogas";
      else if (e.tag === "GRID") tagClass = "log-tag-grid";
      else if (e.tag === "ALGO") tagClass = "log-tag-algo";
      else if (e.tag === "OPT" || e.tag === "SIZING") tagClass = "log-tag-opt";

      line.innerHTML = `
        <span class="log-time">[${e.time}]</span>
        <span class="log-tag ${tagClass}">${e.tag}</span>
        <span class="log-msg">${e.msg}</span>
      `;
      eventLogTerminal.appendChild(line);
    });

    eventLogTerminal.scrollTop = eventLogTerminal.scrollHeight;
  }

  btnClearLog.addEventListener("click", () => {
    logEvents.length = 0;
    renderLogs();
    playTone(320, 0.05);
  });

  logFilterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      logFilterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.activeFilter = btn.getAttribute("data-filter");
      renderLogs();
      playTone(520, 0.05);
    });
  });

  addLog("algo", "INIT", "Debre Markos HRES Microgrid Simulator initialized in PHP (₱).");

  // 6. CORE PHYSICAL DISPATCH MODEL (EQ. 1 TO 31)
  let lastMode = "MODE I";

  function calculatePhysics(dt) {
    const curPvCap = state.pvCap;
    const curBiogasCap = state.biogasCap;
    const curPhesCap = state.phesCap;

    // Temperature derating calculation (Eq. 1-3)
    const T_amb = 22.0;
    const alpha_c = -0.0037;
    const G = state.solarIrradiance;
    const cellTemp = T_amb + 0.0256 * G;
    const tempCorrection = Math.max(0.65, 1 + alpha_c * (cellTemp - 25));
    const eta_inv = 0.95;

    // Solar PV Output (kW)
    state.pvPower = Math.round(curPvCap * (G / 1000) * tempCorrection * eta_inv);

    const PL = state.loadDemand;
    const PPV = state.pvPower;
    state.unservedPower = 0;

    // Fast SMES decay towards steady-state (Eq. 12-15)
    state.smesImpulse *= 0.88;
    if (Math.abs(state.smesImpulse) < 0.5) state.smesImpulse = 0;

    // Dispatch Logic (Section 4.2: Modes I to V)
    if (PPV >= PL) {
      // Surplus Solar Power
      const surplus = PPV - PL;
      state.biogasPower = 0;

      // Check if PHES upper reservoir has capacity to pump
      if (state.phesReservoirSOC < 99.5) {
        const pumpPower = Math.min(surplus, curPhesCap);
        state.phesPower = -pumpPower;

        const netAfterStorage = surplus - pumpPower;
        if (netAfterStorage > 0 && state.gridConnected) {
          state.gridPower = netAfterStorage;
          state.currentMode = state.phesReservoirSOC >= 95 ? "MODE III" : "MODE I";
        } else {
          state.gridPower = 0;
          state.currentMode = "MODE I";
        }
      } else {
        // Reservoir full -> Mode III: 100% Export to National Grid
        state.phesPower = 0;
        state.gridPower = state.gridConnected ? surplus : 0;
        state.currentMode = "MODE III";
      }

      // SMES float charge with clean HYSTERESIS (prevents 60Hz chatter)
      if (state.smesSOC < 88) {
        state.smesFloatCharging = true;
      } else if (state.smesSOC >= 95) {
        state.smesFloatCharging = false;
      }
      state.smesPower = state.smesFloatCharging ? -15 : 0;

    } else {
      // Deficit condition (PPV < PL)
      const deficit = PL - PPV;
      state.smesFloatCharging = false;

      if (PPV === 0) {
        // Mode IV: Night / Zero Solar
        state.currentMode = "MODE IV";
        state.biogasPower = Math.min(deficit, curBiogasCap);
        const remainingDeficit = deficit - state.biogasPower;

        if (remainingDeficit > 0 && state.phesReservoirSOC > 15) {
          const hydroGen = Math.min(remainingDeficit, curPhesCap);
          state.phesPower = hydroGen;
          const unserved = remainingDeficit - hydroGen;
          if (state.gridConnected) {
            state.gridPower = unserved > 0 ? -unserved : 0;
            if (unserved > 0) state.currentMode = "MODE V";
          } else {
            state.gridPower = 0;
            state.unservedPower = unserved > 0 ? unserved : 0;
            if (unserved > 0) state.currentMode = "MODE V";
          }
        } else if (remainingDeficit > 0) {
          state.phesPower = 0;
          if (state.gridConnected) {
            state.gridPower = -remainingDeficit;
            state.currentMode = "MODE V";
          } else {
            state.gridPower = 0;
            state.unservedPower = remainingDeficit;
            state.currentMode = "MODE V";
          }
        } else {
          state.phesPower = 0;
          state.gridPower = 0;
        }

      } else {
        // Mode II: Solar deficit during daylight
        state.currentMode = "MODE II";

        if (state.phesReservoirSOC > 15) {
          const hydroGen = Math.min(deficit, curPhesCap);
          state.phesPower = hydroGen;
          const remainingDeficit = deficit - hydroGen;

          if (remainingDeficit > 0) {
            state.biogasPower = Math.min(remainingDeficit, curBiogasCap);
            const stillDeficit = remainingDeficit - state.biogasPower;
            if (state.gridConnected) {
              state.gridPower = stillDeficit > 0 ? -stillDeficit : 0;
              if (stillDeficit > 0) state.currentMode = "MODE V";
            } else {
              state.gridPower = 0;
              state.unservedPower = stillDeficit > 0 ? stillDeficit : 0;
              if (stillDeficit > 0) state.currentMode = "MODE V";
            }
          } else {
            state.biogasPower = 0;
            state.gridPower = 0;
          }
        } else {
          state.phesPower = 0;
          state.biogasPower = Math.min(deficit, curBiogasCap);
          const stillDeficit = deficit - state.biogasPower;
          if (state.gridConnected) {
            state.gridPower = stillDeficit > 0 ? -stillDeficit : 0;
            if (stillDeficit > 0) state.currentMode = "MODE V";
          } else {
            state.gridPower = 0;
            state.unservedPower = stillDeficit > 0 ? stillDeficit : 0;
            if (stillDeficit > 0) state.currentMode = "MODE V";
          }
        }
      }

      state.smesPower = state.smesImpulse;
    }

    // Dynamic Reservoir & SMES SOC Integrations
    if (state.phesPower < 0) {
      const pumpedVolRate = (Math.abs(state.phesPower) * 0.77 * dt) / 3600;
      const pctDelta = (pumpedVolRate / (state.reservoirCap * 0.005)) * 100;
      state.phesReservoirSOC = Math.min(100, state.phesReservoirSOC + pctDelta);
    } else if (state.phesPower > 0) {
      const genVolRate = (state.phesPower * dt) / 3600;
      const pctDelta = (genVolRate / (state.reservoirCap * 0.005)) * 100;
      state.phesReservoirSOC = Math.max(10, state.phesReservoirSOC - pctDelta);
    }

    // SMES SOC update
    if (state.smesPower < 0) {
      state.smesSOC = Math.min(100, state.smesSOC + (Math.abs(state.smesPower) * dt) / 100);
    } else if (state.smesPower > 0) {
      state.smesSOC = Math.max(5, state.smesSOC - (state.smesPower * dt) / 100);
    }

    // ZERO-FLICKER NET POWER BALANCE:
    // Defined strictly as Generation (PV + Biogas) minus Demand (PL)
    state.netPower = (state.pvPower + state.biogasPower) - state.loadDemand;

    // SCADA Event Log Trigger on Mode Transition
    if (state.currentMode !== lastMode) {
      addLog("dispatch", state.currentMode, `Dispatch transitioned: Solar ${state.pvPower} kW | Load ${state.loadDemand} kW`);
      lastMode = state.currentMode;
    }

    // Record history buffer for trend chart
    if (Math.random() < 0.20) {
      state.history.push({
        pv: state.pvPower,
        load: state.loadDemand,
        biogas: state.biogasPower,
        hydro: state.phesPower,
        net: state.netPower
      });
      if (state.history.length > 50) state.history.shift();
    }
  }

  // 7. ZERO-FLICKER UI UPDATE LOGIC (PHILIPPINE PESO ₱)
  let lastNetVal = null;
  let lastNetClass = "";
  let lastNetLabel = "";

  function updateUI() {
    const curAlgo = ALGO_DATA[state.algo];

    // ZERO-FLICKER NET POWER BALANCE:
    const net = Math.round(state.netPower);
    if (net !== lastNetVal) {
      valNetPower.textContent = (net >= 0 ? "+" : "") + net.toLocaleString() + " kW";
      lastNetVal = net;
    }

    // Clean hysteresis on balance label (prevents 60Hz boundary flickering)
    let newClass = "balance-val text-blue";
    let newLabel = "Microgrid Balanced";

    if (net > 8) {
      newClass = "balance-val text-green";
      newLabel = "Clean Surplus";
    } else if (net < -8) {
      newClass = "balance-val text-red";
      newLabel = state.gridConnected ? "Grid Import Deficit" : "Unserved Deficit";
    }

    if (newClass !== lastNetClass) {
      valNetPower.className = newClass;
      lastNetClass = newClass;
    }
    if (newLabel !== lastNetLabel) {
      valNetLabel.textContent = newLabel;
      lastNetLabel = newLabel;
    }

    // Mode Pill Badge
    badgeDispatchMode.className = "badge-mode ";
    switch (state.currentMode) {
      case "MODE I":
        badgeDispatchMode.className += "mode-surplus";
        badgeDispatchMode.textContent = "MODE I • SOLAR SURPLUS (STORAGE PUMP)";
        break;
      case "MODE II":
        badgeDispatchMode.className += "mode-deficit";
        badgeDispatchMode.textContent = "MODE II • STORAGE DISPATCH (FAST BUFFER)";
        break;
      case "MODE III":
        badgeDispatchMode.className += "mode-surplus";
        badgeDispatchMode.textContent = "MODE III • CLEAN GRID EXPORT";
        break;
      case "MODE IV":
        badgeDispatchMode.className += "mode-night";
        badgeDispatchMode.textContent = "MODE IV • BIOGAS BASELOAD + HYDRO";
        break;
      case "MODE V":
        badgeDispatchMode.className += "mode-severe";
        badgeDispatchMode.textContent = state.gridConnected ? "MODE V • GRID IMPORT BACKUP" : "MODE V • ISLANDED DEFICIT";
        break;
    }

    // Grid Status Badge
    if (!state.gridConnected) {
      if (state.unservedPower > 0) {
        badgeGridStatus.textContent = `ISLANDED: ${Math.round(state.unservedPower)} kW UNSERVED`;
        badgeGridStatus.style.color = "#DC2626";
      } else {
        badgeGridStatus.textContent = "ISLANDED: 100% STANDALONE";
        badgeGridStatus.style.color = "#7C3AED";
      }
    } else if (state.gridPower > 0) {
      badgeGridStatus.textContent = `GRID: EXPORTING +${Math.round(state.gridPower)} kW`;
      badgeGridStatus.style.color = "#059669";
    } else if (state.gridPower < 0) {
      badgeGridStatus.textContent = `GRID: IMPORTING ${Math.round(Math.abs(state.gridPower))} kW`;
      badgeGridStatus.style.color = "#DC2626";
    } else {
      badgeGridStatus.textContent = "GRID: NET ZERO EXCHANGE";
      badgeGridStatus.style.color = "#64748B";
    }

    // Pareto KPIs in Philippine Peso (PHP, ₱)
    if (state.customSizing) {
      // Dynamic financial recalculation based on custom sizing
      // Unit capital costs from paper Table 1:
      // PV: 145.85 EUR/kW (₱8,970/kW), Biogas: 1,342.5 EUR/kW (₱82,564/kW), PHES: 450 EUR/kW (₱27,675/kW), SMES: 5,000 EUR/kW (₱307,500/kW)
      const capCostPhp = (state.pvCap * 8970 + state.biogasCap * 82564 + state.phesCap * 27675 + state.smesCap * 2160) * 1.35; // 25-yr lifecycle
      const customNpcPhpM = (capCostPhp / 1e6).toFixed(1);
      const customLcoePhp = (2.84 * (customNpcPhpM / 430.3)).toFixed(2);
      kpiNpc.textContent = `₱${customNpcPhpM}M`;
      kpiLcoe.textContent = `LCOE ₱${customLcoePhp}/kWh`;
    } else {
      kpiNpc.textContent = `₱${curAlgo.npcPhp.toFixed(1)}M`;
      kpiLcoe.textContent = `LCOE ₱${curAlgo.lcoePhp.toFixed(2)}/kWh`;
    }

    // Dynamic LPSP calculation
    if (state.unservedPower > 0) {
      const instantLPSP = ((state.unservedPower / state.loadDemand) * 100).toFixed(1);
      kpiLpsp.textContent = `${instantLPSP}%`;
      kpiLpsp.className = "kpi-val text-red";
      kpiRelSub.textContent = "Unserved Load!";
    } else {
      kpiLpsp.textContent = `${(curAlgo.lpsp * 100).toFixed(2)}%`;
      kpiLpsp.className = "kpi-val text-green";
      kpiRelSub.textContent = `${(100 - curAlgo.lpsp * 100).toFixed(2)}% Coverage`;
    }

    kpiCo2.textContent = `-${curAlgo.co2Reduction.toFixed(2)}M kg`;
    kpiGhgSub.textContent = `${curAlgo.co2Percent} Cut`;

    // Mini Dual Storage SOC Gauges
    const curPhesVol = Math.round((state.phesReservoirSOC / 100) * state.reservoirCap);
    lblGaugePhes.textContent = `${state.phesReservoirSOC.toFixed(1)}% (${curPhesVol.toLocaleString()} m³)`;
    barGaugePhes.style.width = `${state.phesReservoirSOC.toFixed(1)}%`;

    const curSmesKWh = Math.round((state.smesSOC / 100) * state.smesCap);
    lblGaugeSmes.textContent = `${state.smesSOC.toFixed(1)}% (${curSmesKWh} kWh)`;
    barGaugeSmes.style.width = `${state.smesSOC.toFixed(1)}%`;

    // Generator Chips
    chipPvVal.textContent = `${state.pvPower.toLocaleString()} kW`;
    chipBiogasVal.textContent = `${state.biogasPower.toLocaleString()} kW`;
    chipPhesVal.textContent = state.phesPower < 0 
      ? `-${Math.abs(state.phesPower)} kW` 
      : (state.phesPower > 0 ? `+${state.phesPower} kW` : "0 kW");
    chipSmesVal.textContent = state.smesPower !== 0 
      ? `${state.smesPower > 0 ? "+" : ""}${Math.round(state.smesPower)} kW` 
      : "0 kW";
    chipGridVal.textContent = state.gridConnected
      ? (state.gridPower > 0 ? `+${Math.round(state.gridPower)} kW` : (state.gridPower < 0 ? `-${Math.round(Math.abs(state.gridPower))} kW` : "0 kW"))
      : "ISLAND";

    // Slider readouts
    lblIrradiance.textContent = state.solarIrradiance;
    lblLoad.textContent = state.loadDemand.toLocaleString();
  }

  // 8. CANVAS VISUALIZERS (FLOW, PROFILE VS LOAD, TREND)
  let animTick = 0;

  function renderCanvas() {
    if (canvasLogicalW === 0 || canvasLogicalH === 0) return;
    const w = canvasLogicalW;
    const h = canvasLogicalH;
    ctx.clearRect(0, 0, w, h);
    animTick++;

    if (state.viewMode === "flow") {
      drawFlowMap(w, h);
    } else if (state.viewMode === "profile") {
      drawProfileChart(w, h);
    } else {
      drawTrendChart(w, h);
    }
  }

  // View 1: Flow Map
  function drawFlowMap(w, h) {
    ctx.save();
    const busX = w * 0.5;
    const busY = h * 0.48;

    // Central AC Bus line
    ctx.strokeStyle = "#0284C7";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(busX - 50, busY);
    ctx.lineTo(busX + 50, busY);
    ctx.stroke();

    // Central Bus Label
    ctx.fillStyle = "#0369A1";
    ctx.font = "bold 8.5px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("CAMPUS AC BUS", busX, busY - 7);

    // Nodes
    const nodes = [
      { name: "SOLAR PV", x: w * 0.17, y: h * 0.22, icon: "☀️", val: `${state.pvPower} kW`, color: "#D97706", active: state.pvPower > 0 },
      { name: "BIOGAS", x: w * 0.17, y: h * 0.78, icon: "🌾", val: `${state.biogasPower} kW`, color: "#059669", active: state.biogasPower > 0 },
      { name: "PHES HYDRO", x: w * 0.83, y: h * 0.22, icon: "💧", val: `${state.phesPower} kW`, color: "#0284C7", active: Math.abs(state.phesPower) > 0 },
      { name: "FAST SMES", x: w * 0.83, y: h * 0.78, icon: "🧲", val: `${state.smesSOC.toFixed(0)}% SOC`, color: "#7C3AED", active: Math.abs(state.smesPower) > 0 },
      { name: "CAMPUS LOAD", x: busX, y: h * 0.88, icon: "🏢", val: `${state.loadDemand} kW`, color: "#DC2626", active: true }
    ];

    // Connecting feeder lines
    nodes.forEach(n => {
      ctx.beginPath();
      ctx.strokeStyle = n.active ? n.color : "#E2E8F0";
      ctx.lineWidth = n.active ? 1.6 : 1;
      ctx.setLineDash(n.active ? [4, 4] : []);
      ctx.lineDashOffset = -animTick * 0.6;
      ctx.moveTo(n.x, n.y);
      ctx.lineTo(busX, busY);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Draw White Card Nodes
    nodes.forEach(n => {
      const boxW = 84;
      const boxH = 32;
      const bx = n.x - boxW / 2;
      const by = n.y - boxH / 2;

      ctx.fillStyle = "#FFFFFF";
      ctx.strokeStyle = n.active ? n.color : "#CBD5E1";
      ctx.lineWidth = n.active ? 1.5 : 1;

      ctx.beginPath();
      ctx.roundRect(bx, by, boxW, boxH, 5);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = n.color;
      ctx.font = "bold 8px ui-monospace, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${n.icon} ${n.name}`, n.x, n.y - 4);

      ctx.fillStyle = "#0F172A";
      ctx.font = "bold 8.5px ui-monospace, SFMono-Regular, monospace";
      ctx.fillText(n.val, n.x, n.y + 9);
    });

    ctx.restore();
  }

  // View 2: 24-Hour Diurnal Energy Profile (Production vs Load)
  function drawProfileChart(w, h) {
    ctx.save();
    const padL = 28;
    const padR = 12;
    const padT = 20;
    const padB = 22;
    const chartW = w - padL - padR;
    const chartH = h - padT - padB;
    const maxKW = 4500;

    // Background grid
    ctx.strokeStyle = "#F1F5F9";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padT + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + chartW, y);
      ctx.stroke();

      const kwLbl = Math.round(maxKW * (1 - i / 4));
      ctx.fillStyle = "#94A3B8";
      ctx.font = "7px ui-monospace, monospace";
      ctx.textAlign = "right";
      ctx.fillText(`${kwLbl}`, padL - 3, y + 2.5);
    }

    // X-Axis hour markers (00:00, 06:00, 12:00, 18:00, 24:00)
    const hours = [0, 6, 12, 18, 24];
    hours.forEach(hr => {
      const x = padL + (hr / 24) * chartW;
      ctx.fillStyle = "#94A3B8";
      ctx.font = "7.5px ui-monospace, monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${hr.toString().padStart(2, "0")}:00`, x, h - 6);
    });

    // Profile curve points generator (24 hours in 48 steps)
    const steps = 48;
    const solarCurve = [];
    const loadCurve = [];
    const biogasCurve = [];

    for (let s = 0; s <= steps; s++) {
      const hr = (s / steps) * 24;
      const x = padL + (hr / 24) * chartW;

      // Solar production curve based on current PV sizing
      let pv = 0;
      if (hr >= 6 && hr <= 18) {
        const sun = Math.sin(((hr - 6) / 12) * Math.PI);
        pv = state.pvCap * (1196 / 1000) * 0.95 * 0.88 * Math.max(0, sun);
      }
      solarCurve.push({ x, y: padT + chartH - (Math.min(maxKW, pv) / maxKW) * chartH });

      // Campus load curve
      const baseL = 850;
      const dayAdd = (hr >= 8 && hr <= 17) ? 550 : 0;
      const eveningDorm = (hr >= 18 && hr <= 22) ? 650 : 0;
      const ld = baseL + dayAdd + eveningDorm + Math.sin(hr) * 40;
      loadCurve.push({ x, y: padT + chartH - (Math.min(maxKW, ld) / maxKW) * chartH });

      // Biogas dispatch curve (covers evening/night deficit)
      let bio = 0;
      if (pv < ld) {
        bio = Math.min(state.biogasCap, ld - pv);
      }
      biogasCurve.push({ x, y: padT + chartH - (Math.min(maxKW, bio) / maxKW) * chartH });
    }

    // 1. Draw Solar PV Area (Golden)
    ctx.fillStyle = "rgba(245, 158, 11, 0.15)";
    ctx.beginPath();
    ctx.moveTo(padL, padT + chartH);
    solarCurve.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(padL + chartW, padT + chartH);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#F59E0B";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    solarCurve.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.stroke();

    // 2. Draw Biogas Dispatch Area (Emerald)
    ctx.fillStyle = "rgba(16, 185, 129, 0.12)";
    ctx.beginPath();
    ctx.moveTo(padL, padT + chartH);
    biogasCurve.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(padL + chartW, padT + chartH);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#10B981";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    biogasCurve.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.stroke();

    // 3. Draw Campus Load Curve (Crimson)
    ctx.strokeStyle = "#DC2626";
    ctx.lineWidth = 2;
    ctx.beginPath();
    loadCurve.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.stroke();

    // 4. Live Simulation Current Scrub Marker
    const curHr = state.autoRun ? state.autoRunTime : (state.solarIrradiance > 0 ? (6 + (state.solarIrradiance / 1196) * 6) : 21);
    const scrubX = padL + (curHr / 24) * chartW;

    ctx.strokeStyle = "#0284C7";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 2]);
    ctx.beginPath();
    ctx.moveTo(scrubX, padT);
    ctx.lineTo(scrubX, padT + chartH);
    ctx.stroke();
    ctx.setLineDash([]);

    // Scrub Dot on load curve
    const scrubY = padT + chartH - (state.loadDemand / maxKW) * chartH;
    ctx.fillStyle = "#0284C7";
    ctx.beginPath();
    ctx.arc(scrubX, scrubY, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Header Legend
    ctx.font = "bold 8px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillStyle = "#F59E0B"; ctx.fillText("● Solar PV", padL, 11);
    ctx.fillStyle = "#10B981"; ctx.fillText("● Biogas Gen", padL + 62, 11);
    ctx.fillStyle = "#DC2626"; ctx.fillText("━ Campus Load", padL + 130, 11);
    ctx.fillStyle = "#0284C7"; ctx.fillText(`[t=${Math.floor(curHr)}h]`, padL + chartW - 35, 11);

    ctx.restore();
  }

  // View 3: Live Rolling Trend Line Chart
  function drawTrendChart(w, h) {
    ctx.save();
    if (state.history.length < 2) {
      ctx.fillStyle = "#64748B";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Accumulating Live Telemetry Trend...", w / 2, h / 2);
      ctx.restore();
      return;
    }

    const pad = 24;
    const chartW = w - pad * 2;
    const chartH = h - pad * 2;
    const maxVal = 4500;

    ctx.strokeStyle = "#F1F5F9";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(pad, y);
      ctx.lineTo(pad + chartW, y);
      ctx.stroke();
    }

    ctx.font = "bold 8px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillStyle = "#D97706"; ctx.fillText("● Solar PV", pad, 12);
    ctx.fillStyle = "#DC2626"; ctx.fillText("● Load", pad + 55, 12);
    ctx.fillStyle = "#059669"; ctx.fillText("● Biogas", pad + 95, 12);
    ctx.fillStyle = "#0284C7"; ctx.fillText("● Net Hydro", pad + 145, 12);

    function plotLine(color, key) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      state.history.forEach((pt, i) => {
        const x = pad + (i / (state.history.length - 1)) * chartW;
        const val = Math.max(0, pt[key] || 0);
        const y = pad + chartH - (val / maxVal) * chartH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    plotLine("#D97706", "pv");
    plotLine("#DC2626", "load");
    plotLine("#059669", "biogas");
    plotLine("#0284C7", "hydro");

    ctx.restore();
  }

  // 9. USER INTERACTION LISTENERS

  // Algorithm Picker
  algoButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      algoButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.algo = btn.getAttribute("data-algo");
      state.customSizing = false;

      // Apply algorithm sizing
      const d = ALGO_DATA[state.algo];
      state.pvCap = d.pvCapacity;
      state.biogasCap = d.biogasCapacity;
      state.phesCap = d.phesCapacity;
      state.smesCap = d.smesCapacity;
      state.reservoirCap = d.reservoirCap;

      sliderCapPv.value = Math.round(d.pvCapacity);
      lblCapPv.textContent = `${Math.round(d.pvCapacity).toLocaleString()} kWp`;
      sliderCapBiogas.value = Math.round(d.biogasCapacity);
      lblCapBiogas.textContent = `${Math.round(d.biogasCapacity)} kW`;
      sliderCapPhes.value = Math.round(d.phesCapacity);
      lblCapPhes.textContent = `${Math.round(d.phesCapacity)} kW`;
      sliderCapSmes.value = Math.round(d.smesCapacity);
      lblCapSmes.textContent = `${Math.round(d.smesCapacity)} kWh`;

      playTone(600, 0.05);
      addLog("algo", "ALGO", `Pareto front switched to ${state.algo} (₱${d.npcPhp.toFixed(1)}M NPC, ₱${d.lcoePhp.toFixed(2)}/kWh)`);
      lblSimStatus.textContent = `Optimized via ${state.algo} • Pareto Sizing Sized in Philippine Peso`;
    });
  });

  // Capacity Sliders (Custom Sizing)
  sliderCapPv.addEventListener("input", (e) => {
    state.customSizing = true;
    state.pvCap = parseInt(e.target.value);
    lblCapPv.textContent = `${state.pvCap.toLocaleString()} kWp`;
  });

  sliderCapBiogas.addEventListener("input", (e) => {
    state.customSizing = true;
    state.biogasCap = parseInt(e.target.value);
    lblCapBiogas.textContent = `${state.biogasCap} kW`;
  });

  sliderCapPhes.addEventListener("input", (e) => {
    state.customSizing = true;
    state.phesCap = parseInt(e.target.value);
    lblCapPhes.textContent = `${state.phesCap} kW`;
  });

  sliderCapSmes.addEventListener("input", (e) => {
    state.customSizing = true;
    state.smesCap = parseInt(e.target.value);
    lblCapSmes.textContent = `${state.smesCap} kWh`;
  });

  // OPTIMIZE SIZE BUTTON
  btnOptimizeSize.addEventListener("click", () => {
    playTone(660, 0.08);
    state.customSizing = false;
    const d = ALGO_DATA[state.algo];
    state.pvCap = d.pvCapacity;
    state.biogasCap = d.biogasCapacity;
    state.phesCap = d.phesCapacity;
    state.smesCap = d.smesCapacity;
    state.reservoirCap = d.reservoirCap;

    sliderCapPv.value = Math.round(d.pvCapacity);
    lblCapPv.textContent = `${Math.round(d.pvCapacity).toLocaleString()} kWp`;
    sliderCapBiogas.value = Math.round(d.biogasCapacity);
    lblCapBiogas.textContent = `${Math.round(d.biogasCapacity)} kW`;
    sliderCapPhes.value = Math.round(d.phesCapacity);
    lblCapPhes.textContent = `${Math.round(d.phesCapacity)} kW`;
    sliderCapSmes.value = Math.round(d.smesCapacity);
    lblCapSmes.textContent = `${Math.round(d.smesCapacity)} kWh`;

    addLog("opt", "OPTIMIZE", `Capacities optimized to ${state.algo} Pareto Front: ₱${d.npcPhp.toFixed(1)}M NPC, ₱${d.lcoePhp.toFixed(2)}/kWh`);
    lblSimStatus.textContent = `Optimized Sizing: PV ${Math.round(d.pvCapacity)}kWp, Biogas ${Math.round(d.biogasCapacity)}kW, PHES ${Math.round(d.phesCapacity)}kW`;
  });

  // Toggle Sizing Drawer
  let sizingDrawerOpen = true;
  btnToggleSizing.addEventListener("click", () => {
    sizingDrawerOpen = !sizingDrawerOpen;
    sizingSliderGrid.style.display = sizingDrawerOpen ? "grid" : "none";
    btnToggleSizing.textContent = sizingDrawerOpen ? "Adjust ▾" : "Adjust ▸";
    playTone(450, 0.03);
  });

  // Helper to pause auto-run when user interacts with sliders
  function pauseAutoRunIfActive() {
    if (state.autoRun) {
      state.autoRun = false;
      btnSimulate.textContent = "⚡ SIMULATE";
      btnSimulate.classList.remove("sim-running");
      lblSimStatus.textContent = "Manual Override: Simulation Paused";
      addLog("dispatch", "SIM", "Simulation paused by manual user control.");
    }
  }

  // Sliders
  sliderIrradiance.addEventListener("input", (e) => {
    pauseAutoRunIfActive();
    state.solarIrradiance = parseInt(e.target.value);
    document.querySelectorAll("[data-solar]").forEach(p => p.classList.remove("active-pill"));
  });

  sliderLoad.addEventListener("input", (e) => {
    pauseAutoRunIfActive();
    state.loadDemand = parseInt(e.target.value);
    document.querySelectorAll("[data-load]").forEach(p => p.classList.remove("active-pill"));
  });

  // Preset Pills
  document.querySelectorAll("[data-solar]").forEach(pill => {
    pill.addEventListener("click", () => {
      pauseAutoRunIfActive();
      playTone(500, 0.04);
      document.querySelectorAll("[data-solar]").forEach(p => p.classList.remove("active-pill"));
      pill.classList.add("active-pill");
      const val = parseInt(pill.getAttribute("data-solar"));
      sliderIrradiance.value = val;
      state.solarIrradiance = val;
      addLog("dispatch", "SOLAR", `Solar irradiance set to ${val} W/m²`);
    });
  });

  document.querySelectorAll("[data-load]").forEach(pill => {
    pill.addEventListener("click", () => {
      pauseAutoRunIfActive();
      playTone(450, 0.04);
      document.querySelectorAll("[data-load]").forEach(p => p.classList.remove("active-pill"));
      pill.classList.add("active-pill");
      const val = parseInt(pill.getAttribute("data-load"));
      sliderLoad.value = val;
      state.loadDemand = val;
      addLog("dispatch", "LOAD", `Campus load demand set to ${val} kW`);
    });
  });

  // Canvas View Mode Switcher
  btnToggleView.addEventListener("click", () => {
    btnToggleView.classList.add("active");
    btnToggleProfile.classList.remove("active");
    btnToggleTrend.classList.remove("active");
    state.viewMode = "flow";
    canvasSectionTitle.textContent = "⚡ Power Flow & Storage Buffer";
    playTone(550, 0.04);
  });

  btnToggleProfile.addEventListener("click", () => {
    btnToggleProfile.classList.add("active");
    btnToggleView.classList.remove("active");
    btnToggleTrend.classList.remove("active");
    state.viewMode = "profile";
    canvasSectionTitle.textContent = "📊 24-Hour Profile: Production vs Load";
    playTone(550, 0.04);
  });

  btnToggleTrend.addEventListener("click", () => {
    btnToggleTrend.classList.add("active");
    btnToggleView.classList.remove("active");
    btnToggleProfile.classList.remove("active");
    state.viewMode = "trend";
    canvasSectionTitle.textContent = "📈 Real-Time Rolling Telemetry Trend";
    playTone(550, 0.04);
  });

  // SIMULATE BUTTON
  btnSimulate.addEventListener("click", () => {
    state.autoRun = !state.autoRun;
    playTone(state.autoRun ? 680 : 380, 0.08);

    if (state.autoRun) {
      btnSimulate.textContent = "⏸ PAUSE";
      btnSimulate.classList.add("sim-running");
      addLog("dispatch", "SIM", "24-Hour continuous dynamic microgrid simulation started.");
    } else {
      btnSimulate.textContent = "⚡ SIMULATE";
      btnSimulate.classList.remove("sim-running");
      addLog("dispatch", "SIM", "Dynamic simulation paused.");
    }
  });

  // Cloud Shock: Sub-second Solar Drop tests SMES Superconducting buffer
  btnCloudShock.addEventListener("click", () => {
    pauseAutoRunIfActive();
    playTone(320, 0.1, "sawtooth");
    const prevSun = state.solarIrradiance;
    sliderIrradiance.value = 150;
    state.solarIrradiance = 150;
    state.smesImpulse = 120;
    lblSimStatus.textContent = "⚡ Fast SMES Activated (<50ms) to Damp Cloud Step-Change";
    addLog("storage", "SMES", "Rapid irradiance drop: SMES injected +120 kW in <50ms buffer.");

    setTimeout(() => {
      sliderIrradiance.value = prevSun;
      state.solarIrradiance = prevSun;
      addLog("storage", "SMES", "Cloud cleared: Irradiance restored.");
    }, 3500);
  });

  // Night Mode
  btnNightMode.addEventListener("click", () => {
    pauseAutoRunIfActive();
    playTone(400, 0.06);
    sliderIrradiance.value = 0;
    state.solarIrradiance = 0;
    sliderLoad.value = 1450;
    state.loadDemand = 1450;
    document.querySelectorAll("[data-solar]").forEach(p => p.classList.remove("active-pill"));
    document.querySelector('[data-solar="0"]')?.classList.add("active-pill");
    lblSimStatus.textContent = "🌙 Night Transition: Biogas Generator + PHES Dispatched";
    addLog("dispatch", "MODE IV", `Zero PV: Biogas generator fired up to supply base load.`);
  });

  // Islanded Mode
  btnIslandMode.addEventListener("click", () => {
    state.gridConnected = !state.gridConnected;
    playTone(state.gridConnected ? 620 : 340, 0.06);

    if (state.gridConnected) {
      btnIslandMode.textContent = "🔌 Grid: ON";
      btnIslandMode.className = "action-btn btn-island";
      lblSimStatus.textContent = "National Grid Connected: Feeder Import/Export Active";
      addLog("grid", "GRID", "Feeder breaker closed: National grid connection restored.");
    } else {
      btnIslandMode.textContent = "🏝️ Islanded";
      btnIslandMode.className = "action-btn btn-warning";
      lblSimStatus.textContent = "⚠️ Standalone Islanded Microgrid Mode Activated";
      addLog("grid", "GRID", "Breaker opened: Standalone islanded microgrid mode active.");
    }
  });

  // Sound Toggle
  btnSound.addEventListener("click", () => {
    state.soundEnabled = !state.soundEnabled;
    btnSound.textContent = state.soundEnabled ? "🔊" : "🔇";
    playTone(500, 0.04);
  });

  // Reset
  btnReset.addEventListener("click", () => {
    playTone(440, 0.08);
    state.solarIrradiance = 850;
    sliderIrradiance.value = 850;
    state.loadDemand = 1185;
    sliderLoad.value = 1185;
    state.phesReservoirSOC = 76.5;
    state.smesSOC = 85.0;
    state.smesImpulse = 0;
    state.autoRun = false;
    state.gridConnected = true;
    state.customSizing = false;

    const d = ALGO_DATA[state.algo];
    state.pvCap = d.pvCapacity;
    state.biogasCap = d.biogasCapacity;
    state.phesCap = d.phesCapacity;
    state.smesCap = d.smesCapacity;
    state.reservoirCap = d.reservoirCap;

    sliderCapPv.value = Math.round(d.pvCapacity);
    lblCapPv.textContent = `${Math.round(d.pvCapacity).toLocaleString()} kWp`;
    sliderCapBiogas.value = Math.round(d.biogasCapacity);
    lblCapBiogas.textContent = `${Math.round(d.biogasCapacity)} kW`;
    sliderCapPhes.value = Math.round(d.phesCapacity);
    lblCapPhes.textContent = `${Math.round(d.phesCapacity)} kW`;
    sliderCapSmes.value = Math.round(d.smesCapacity);
    lblCapSmes.textContent = `${Math.round(d.smesCapacity)} kWh`;

    btnIslandMode.textContent = "🔌 Grid: ON";
    btnIslandMode.className = "action-btn btn-island";
    btnSimulate.textContent = "⚡ SIMULATE";
    btnSimulate.classList.remove("sim-running");
    document.querySelectorAll(".pill-btn").forEach(p => p.classList.remove("active-pill"));
    document.querySelector('[data-solar="850"]')?.classList.add("active-pill");
    document.querySelector('[data-load="1185"]')?.classList.add("active-pill");
    lblSimStatus.textContent = "Simulation Reset to Nominal Debre Markos Baseline";
    addLog("algo", "RESET", "Parameters restored to nominal Debre Markos baseline.");
  });

  // Modal
  btnInfo.addEventListener("click", () => {
    playTone(550, 0.04);
    modalInfo.classList.remove("hidden");
  });
  btnCloseModal.addEventListener("click", () => {
    playTone(400, 0.04);
    modalInfo.classList.add("hidden");
  });
  modalInfo.addEventListener("click", (e) => {
    if (e.target === modalInfo) modalInfo.classList.add("hidden");
  });

  // 10. MAIN 60 FPS SIMULATION LOOP
  let lastTime = performance.now();

  function loop(now) {
    const dt = Math.min(0.08, (now - lastTime) / 1000);
    lastTime = now;

    if (state.autoRun) {
      state.autoRunTime = (state.autoRunTime + dt * 0.7) % 24;
      const hour = state.autoRunTime;

      // Solar profile
      if (hour >= 6 && hour <= 18) {
        const sunAngle = ((hour - 6) / 12) * Math.PI;
        state.solarIrradiance = Math.round(1196 * Math.sin(sunAngle));
      } else {
        state.solarIrradiance = 0;
      }
      sliderIrradiance.value = state.solarIrradiance;

      // Campus load profile
      const baseLoad = 850;
      const dayAdd = (hour >= 8 && hour <= 17) ? 550 : 0;
      const eveningDorm = (hour >= 18 && hour <= 22) ? 650 : 0;
      state.loadDemand = Math.round(baseLoad + dayAdd + eveningDorm + Math.sin(hour) * 40);
      sliderLoad.value = state.loadDemand;

      const timeFormatted = `${Math.floor(hour).toString().padStart(2, "0")}:${Math.floor((hour % 1) * 60).toString().padStart(2, "0")}`;
      lblSimStatus.textContent = `24h Cycle: ${timeFormatted} • Solar ${state.solarIrradiance} W/m² • Load ${state.loadDemand} kW`;
    }

    calculatePhysics(dt);
    updateUI();
    renderCanvas();

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
});
