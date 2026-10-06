import { EVComponentInfo } from '../types/ev';

export const EV_COMPONENTS: Record<string, EVComponentInfo> = {
  battery_pack: {
    id: 'battery_pack',
    name: 'Traction Battery Pack & Skateboard Chassis',
    category: 'energy',
    description: 'High-energy-density structural battery pack providing traction energy to the drivetrain. Integrated directly into the vehicle floor as a stressed member.',
    voltageRating: 'Nominal 720V (Operating 600V - 820V)',
    peakPower: '380 kW Discharge / 250 kW Fast Charge',
    massKg: 460,
    operatingTempRange: '15°C to 45°C (Optimal: 25°C - 35°C)',
    coolingMethod: 'Bottom Extruded Aluminum Liquid Cold Plate (50/50 Water-Glycol)',
    principles: [
      'Electrochemical energy conversion via Lithium-ion intercalation and de-intercalation between cathode and anode.',
      'Cell-to-Pack (CTP) structural architecture maximizing volumetric energy density up to 260 Wh/L.',
      'Aerosol fire suppression and multi-layer thermal runaway barrier materials (aerogel & mica sheets).',
      'High-voltage safety disconnect via Pyrofuse and Manual Service Disconnect (MSD).'
    ],
    specs: {
      'Pack Architecture': '192S2P (384 Prismatic / Cylindrical cells)',
      'Total Stored Energy': '94.2 kWh (usable 89.5 kWh)',
      'Chemistry': 'NMC 811 (80% Nickel, 10% Manganese, 10% Cobalt)',
      'Cell Nominal Voltage': '3.75 V per cell',
      'Max Continuous Current': '350 A',
      'Peak 10s Current': '580 A',
      'Internal Resistance (R_dc)': '28 mΩ at 25°C',
      'Specific Energy': '195 Wh/kg pack level'
    },
    failureModes: [
      'Internal short circuit due to dendrite growth or separator puncture.',
      'Thermal runaway propagation triggered by cell over-temperature (>65°C) or local hot spot.',
      'Loss of high-voltage isolation (R_iso < 500 Ω/V) due to coolant leakage into pack cavity.',
      'Cell capacity divergence and severe voltage imbalance exceeding BMS passive balancing limits.'
    ]
  },
  bms_master: {
    id: 'bms_master',
    name: 'BMS Master Controller & Cell Supervision Circuit',
    category: 'control',
    description: 'High-integrity dual-core automotive MCU responsible for cell voltage/temperature acquisition, state estimation (SOC, SOH, SOP), contactor management, and functional safety.',
    voltageRating: '12V LV supply (Monitors 800V HV rail)',
    massKg: 1.8,
    operatingTempRange: '-40°C to 105°C',
    coolingMethod: 'Passive aluminum enclosure conduction',
    principles: [
      'IsoSPI / Daisy-chain CAN communication with decentralized Slave Cell Monitoring ICs (CSC).',
      'Extended Kalman Filter (EKF) and Coulomb counting for precise State-of-Charge (SOC) tracking (±1.5% accuracy).',
      'State-of-Health (SOH) calculation based on cell internal resistance growth and capacity fade over charge cycles.',
      'Continuous isolation resistance measurement using balanced voltage divider / flying capacitor injection method.'
    ],
    specs: {
      'Microcontroller': 'Infineon AURIX TC397 (Lockstep 32-bit TriCore)',
      'ASIL Rating': 'ISO 26262 ASIL-D certified',
      'Sampling Speed': 'All 192 cells sampled within 2.4 ms',
      'Voltage Measurement Accuracy': '±1.2 mV (16-bit Sigma-Delta ADC)',
      'Balancing Topology': 'Passive bleed (150 mA per channel) & Active capacitive shuttle',
      'Communication Interfaces': 'CAN-FD (2 Mbps), Ethernet (100Base-T1)'
    },
    failureModes: [
      'CSC daisy-chain communication timeout causing safe shutdown.',
      'Analog Front End (AFE) ADC reference drift leading to incorrect cell over-voltage false alarms.',
      'Balancing MOSFET stuck ON causing single-cell over-discharge to 0V.'
    ]
  },
  precharge_circuit: {
    id: 'precharge_circuit',
    name: 'High-Voltage Pre-Charge Relay & Resistor Assembly',
    category: 'safety',
    description: 'Inrush current limiting system that safely pre-charges the inverter DC-link bus capacitors before the main positive contactor is engaged.',
    voltageRating: '800V DC (1000V Isolation rated)',
    peakPower: 'Dissipates ~65 Joules per pre-charge event',
    massKg: 1.2,
    operatingTempRange: '-40°C to 125°C',
    coolingMethod: 'Heat-sinked aluminum housing with thermal thermal paste to chassis',
    principles: [
      'Inrush current damping: Without pre-charge, uncharged DC-link capacitance (C ≈ 900 µF) draws thousands of Amperes, causing severe contactor contact welding.',
      'RC time constant charging dynamic: V_c(t) = V_pack * (1 - e^(-t / RC)).',
      'Voltage parity verification: Main positive contactor closes only when |V_pack - V_dclink| < 20V (typically 95% charged in ~250 ms).'
    ],
    specs: {
      'Pre-charge Resistance (R_pre)': '33 Ω (50 W continuous, 1500 W pulse rating)',
      'Inverter DC-Link Capacitance': '920 µF (Polypropylene metallized film)',
      'RC Time Constant (τ)': '30.36 ms (3τ = 91 ms, 5τ = 152 ms)',
      'Max Inrush Current Allowed': '24.2 A (controlled through 33 Ω resistor)',
      'Relay Coil Voltage': '12V DC (with flyback diode protection)'
    },
    failureModes: [
      'Pre-charge resistor open circuit (burned out by repeated abortive starts into shorted inverter).',
      'Pre-charge contactor stuck open (inverter DC-link fails to rise, startup timeout DTC P0AE6).',
      'Main contactor closed prematurely causing contact welding (DTC P0AA1).'
    ]
  },
  inverter: {
    id: 'inverter',
    name: 'Silicon Carbide (SiC) 3-Phase Traction Inverter',
    category: 'powertrain',
    description: 'Ultra-high-efficiency bidirectional power converter transforming 800V DC from the battery into variable-voltage, variable-frequency 3-phase AC for the motor.',
    voltageRating: '800V DC Nominal / 1200V SiC Module breakdown',
    peakPower: '320 kW (430 HP) Traction / 180 kW Regeneration',
    massKg: 8.5,
    operatingTempRange: '-40°C to 125°C (Junction limit: 175°C)',
    coolingMethod: 'Direct pin-fin liquid cold plate (coolant in direct contact with copper baseplate)',
    principles: [
      'Space Vector Pulse Width Modulation (SVPWM) switching at 16 kHz for low harmonic distortion.',
      'Silicon Carbide (SiC) MOSFET semiconductors offering 75% lower switching losses than legacy Silicon IGBTs.',
      'Bidirectional power conversion: DC-to-AC in traction motoring mode, AC-to-DC active rectification in regenerative braking.',
      'Integrated desaturation protection, active Miller clamping, and over-current shutdown within 1.2 µs.'
    ],
    specs: {
      'Power Semiconductor': '6-pack 1200V / 600A SiC MOSFET Power Modules',
      'Peak Phase Current': '650 A_rms',
      'Continuous Phase Current': '380 A_rms',
      'Peak Inverter Efficiency': '99.1% (WLTP average: 98.4%)',
      'Switching Frequency': '10 kHz to 20 kHz (adaptive based on torque/speed)',
      'DC-Link Bus Capacitance': '920 µF (Low ESR film capacitor)'
    },
    failureModes: [
      'SiC MOSFET gate oxide breakdown due to excessive dV/dt or inductive voltage ringing.',
      'Gate driver desaturation fault (DESAT) triggering emergency active short circuit (ASC).',
      'DC-link film capacitor dry-out / capacitance loss from high ripple current heating.'
    ]
  },
  pmsm_motor: {
    id: 'pmsm_motor',
    name: 'Permanent Magnet Synchronous Motor (PMSM) with Hairpin Winding',
    category: 'powertrain',
    description: 'High-torque-density electric traction motor featuring an internal permanent magnet (IPM) rotor and hairpin copper stator winding.',
    voltageRating: '0V to 580V AC Phase-to-Phase',
    peakPower: '320 kW @ 7,500 - 14,000 RPM',
    massKg: 48,
    operatingTempRange: '-40°C to 160°C (Neodymium demagnetization threshold: 180°C)',
    coolingMethod: 'Internal rotor shaft oil spray & stator spiral water jacket',
    principles: [
      'Field Oriented Control (FOC) decoupled d-q axis flux control with maximum torque per ampere (MTPA).',
      'Reluctance torque enhancement through IPM rotor saliency (L_q > L_d).',
      'Flux weakening operation beyond base speed to extend top vehicle speed up to 18,000 RPM.',
      'Regenerative braking generating counter-electromotive force (Back-EMF) to recharge the battery.'
    ],
    specs: {
      'Peak Torque': '520 Nm (from 0 to 6,200 RPM)',
      'Continuous Torque': '280 Nm',
      'Max Operating Speed': '18,500 RPM',
      'Pole Pairs': '4 (8 magnetic poles)',
      'Magnet Grade': 'NdFeB (Neodymium Iron Boron N42UH with Dysprosium)',
      'Stator Winding': 'Continuous hairpin copper wire (74% copper slot fill factor)',
      'Peak Motor Efficiency': '97.4%'
    },
    failureModes: [
      'Rotor permanent magnet thermal demagnetization from sustained stator over-temperature (>170°C).',
      'Stator inter-turn winding insulation breakdown caused by inverter high dV/dt spikes.',
      'Resolver angular position sensor misalignment leading to phase angle error and torque drop.'
    ]
  },
  gearbox: {
    id: 'gearbox',
    name: 'Single-Speed Reduction Gearbox & Open Differential',
    category: 'powertrain',
    description: 'Compact mechanical reduction unit multiplying motor torque and reducing high motor rotational speeds down to wheel speeds.',
    voltageRating: 'Mechanical Unit',
    peakPower: 'Rated for 600 Nm input torque',
    massKg: 22,
    operatingTempRange: '-40°C to 110°C',
    coolingMethod: 'Splash lubrication with synthetic low-viscosity transmission fluid (ATF)',
    principles: [
      'Helical gear tooth geometry for smooth tooth engagement, low noise, vibration, and harshness (NVH).',
      'Single-stage fixed gear reduction eliminating the weight, shift delay, and complexity of multi-speed transmissions.',
      'Differential planetary bevel gears allowing inner and outer wheels to rotate at different speeds during cornering.'
    ],
    specs: {
      'Overall Gear Ratio': '9.34:1 (Motor RPM / Wheel RPM)',
      'Mechanical Efficiency': '98.2% at nominal load',
      'Input Max Speed': '19,000 RPM',
      'Max Output Axle Torque': '4,856 Nm at wheels',
      'Lubricant Capacity': '1.2 Liters (Low-viscosity synthetic)'
    },
    failureModes: [
      'Bearing surface pitting / spalling from oil contamination or excessive axial thrust load.',
      'Differential spider gear tooth wear from prolonged wheel slip traction events.'
    ]
  },
  vcu: {
    id: 'vcu',
    name: 'Vehicle Control Unit (VCU) Master ECU',
    category: 'control',
    description: 'Central brain of the vehicle powertrain coordinating driver torque demand, traction control, regenerative brake blending, high-voltage interlocks, and energy management.',
    voltageRating: '12V LV Supply',
    massKg: 1.4,
    operatingTempRange: '-40°C to 105°C',
    coolingMethod: 'Convection',
    principles: [
      'Dual accelerator pedal sensor cross-plausibility checking (APP1 vs APP2) per ISO 26262.',
      'Torque arbitration resolving driver request, ABS/ESC intervention, cruise control, and thermal derating limits.',
      'High-voltage safety supervision: Emergency contactor opening upon crash accelerometer signal or HVIL break.',
      'Regenerative brake blending with electro-hydraulic brake-by-wire system.'
    ],
    specs: {
      'Processor': 'Dual-core 32-bit Automotive MCU with hardware watchdog',
      'ASIL Level': 'ASIL-D compliant',
      'Execution Loop Rate': '10 ms main control loop (1 ms fast torque loop)',
      'CAN Busses': '4 independent CAN-FD channels + 2 LIN channels'
    },
    failureModes: [
      'Accelerator sensor plausibility failure triggering safe torque zero mode (Limp Mode).',
      'CAN communication loss with Inverter (DTC U0100) initiating controlled contactor safe shutdown.'
    ]
  },
  dcdc_converter: {
    id: 'dcdc_converter',
    name: 'HV-to-12V Bidirectional DC/DC Converter',
    category: 'energy',
    description: 'Replaces the conventional alternator by stepping down 800V/400V traction battery voltage to 13.8V DC to power all low-voltage ECUs, lights, infotainment, and charge the 12V auxiliary battery.',
    voltageRating: 'Input 600V - 850V DC / Output 12.0V - 14.8V DC',
    peakPower: '3.6 kW (260 A @ 13.8V)',
    massKg: 3.2,
    operatingTempRange: '-40°C to 90°C',
    coolingMethod: 'Liquid cooled via low-temperature coolant loop',
    principles: [
      'Phase-shifted full-bridge resonant LLC topology with planar transformer for galvanic isolation.',
      'Synchronous rectification replacing output diodes to achieve >95% electrical conversion efficiency.',
      'Constant-voltage / constant-current charging algorithm for the 12V Li-ion or AGM auxiliary battery.'
    ],
    specs: {
      'Continuous Output Current': '220 A',
      'Peak 30s Current': '260 A',
      'Galvanic Isolation': '3000 V_rms for 60 seconds',
      'Efficiency': '95.8% at 2 kW load'
    },
    failureModes: [
      'LLC resonant primary bridge FET short circuit causing complete loss of 12V auxiliary charging (12V battery drain within 20 mins).',
      'Output over-voltage clamping trip to protect sensitive cabin ECUs.'
    ]
  },
  obc: {
    id: 'obc',
    name: 'On-Board Charger (OBC) AC/DC Converter',
    category: 'energy',
    description: 'Converts alternating current (AC) from residential or commercial grid wallboxes (Single-phase 120V/240V or 3-Phase 400V) into controlled high-voltage DC to charge the traction battery.',
    voltageRating: 'Grid AC Input: 85V - 480V / DC Output: 600V - 850V',
    peakPower: '11 kW 3-Phase (or 22 kW optional) / 7.4 kW Single-Phase',
    massKg: 6.8,
    operatingTempRange: '-40°C to 85°C',
    coolingMethod: 'Liquid cooled in series with inverter cold plate',
    principles: [
      'Active Power Factor Correction (PFC) stage maintaining PF > 0.99 and Total Harmonic Distortion (THD) < 5%.',
      'Isolated dual-active bridge (DAB) DC/DC stage with bidirectional capability for Vehicle-to-Load (V2L) and Vehicle-to-Grid (V2G).',
      'Control Pilot (CP) and Proximity Pilot (PP) signaling per SAE J1772 / IEC 61851 standards.'
    ],
    specs: {
      'AC Input Phases': '1-phase or 3-phase auto-detecting',
      'Max AC Current': '16 A per phase (3-Phase 11 kW)',
      'Peak Conversion Efficiency': '96.2%',
      'Grid Isolation': 'Double insulation & 4000V dielectric barrier'
    },
    failureModes: [
      'PFC input surge protection MOV degradation from lightning/grid spikes.',
      'Control Pilot CP line short causing charging session handshake abort.'
    ]
  },
  thermal_chiller: {
    id: 'thermal_chiller',
    name: 'Refrigerant-to-Coolant Plate Heat Exchanger (Chiller)',
    category: 'thermal',
    description: 'Couples the vehicle Air Conditioning refrigerant system to the liquid battery coolant loop to provide active sub-ambient cooling during fast charging or high-power track driving.',
    voltageRating: 'Thermal Component (Driven by 800V AC Compressor)',
    peakPower: 'Up to 9 kW thermal extraction capacity',
    massKg: 3.8,
    operatingTempRange: '-30°C to 90°C',
    coolingMethod: 'Counter-flow refrigerant (R1234yf) and water-glycol coolant',
    principles: [
      'Plate heat exchanger with brazed stainless steel channels maximizing heat transfer surface area.',
      'Electronic Expansion Valve (EXV) meters subcooled refrigerant liquid into the chiller plates.',
      'Refrigerant evaporates at low pressure, pulling immense heat out of the flowing battery coolant to keep cells below 35°C during 250 kW DC charging.'
    ],
    specs: {
      'Coolant Flow Rate': '15 to 30 L/min',
      'Heat Exchanger Effectiveness': 'ε = 0.88',
      'Pressure Drop': '< 25 kPa @ 20 L/min'
    },
    failureModes: [
      'EXV valve stepper motor jamming causing battery coolant to remain unchilled during fast charge (leading to charging speed throttling).',
      'Internal plate pinhole leak mixing glycol coolant into refrigerant circuit.'
    ]
  },
  radiator_pump: {
    id: 'radiator_pump',
    name: 'Brushless Electric Coolant Pump & Low-Temp Radiator',
    category: 'thermal',
    description: 'Circulates 50/50 water-ethylene glycol coolant through cold plates, motor jackets, and front heat exchangers to reject waste heat to ambient air.',
    voltageRating: '12V Brushless DC Pump (PWM Speed Controlled)',
    peakPower: '90 W Electrical / 25 L/min flow rate',
    massKg: 5.5,
    operatingTempRange: '-40°C to 110°C',
    coolingMethod: 'Liquid-to-air aluminum crossflow radiator with twin electric fans',
    principles: [
      'Forced convection cooling removing ohmic copper losses from motor and semiconductor switching losses from inverter.',
      '4-way proportional coolant distribution valve dynamically routing coolant in series or parallel loops.',
      'Waste heat scavenging from motor/inverter to heat battery pack in freezing winter conditions.'
    ],
    specs: {
      'Pump Speed': '1,000 to 4,800 RPM (LIN bus controlled)',
      'Radiator Heat Rejection': 'Up to 24 kW @ 80 km/h air velocity',
      'Operating System Pressure': '1.4 bar pressurized closed loop'
    },
    failureModes: [
      'Coolant pump impeller blockage / air lock causing rapid motor and inverter thermal derating.',
      'Thermostat / 4-way valve stuck in bypass mode.'
    ]
  },
  wheels_brakes: {
    id: 'wheels_brakes',
    name: 'Lightweight Aero Wheels, Low-RR Tires & Brake Calipers',
    category: 'powertrain',
    description: 'Translates axle torque into road tractive force. Integrates electro-hydraulic friction disc brakes with high-rate motor regenerative braking.',
    voltageRating: 'Mechanical / Hydraulic',
    massKg: 84, // total 4 corners
    operatingTempRange: '-40°C to 450°C (Brake pads)',
    coolingMethod: 'Vented brake rotors with directional air scoops',
    principles: [
      'Low rolling resistance tire compound (C_rr = 0.0075) reducing energy consumption by up to 8%.',
      'Aero turbine wheel blade design minimizing turbulent aerodynamic drag around wheel arches.',
      'Brake-by-Wire: The brake pedal simulator measures driver deceleration intent. Up to 0.35g deceleration is delivered exclusively via electric motor regeneration before friction pads touch the rotor.'
    ],
    specs: {
      'Tire Dimensions': '255/40 R20 front / 285/35 R20 rear',
      'Rolling Radius': '0.342 m',
      'Friction Rotor Diameter': '375 mm Vented Front / 350 mm Solid Rear',
      'Max Regen Deceleration': '0.38 g (recapturing up to 180 kW instantaneous)'
    },
    failureModes: [
      'Brake pad glazing or corrosion due to infrequent friction brake use in high-regen EV driving.',
      'Tire uneven wear due to instantaneous electric motor low-end torque application.'
    ]
  }
};
