import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ViewMode, EVTelemetry, EVComponentInfo } from '../../types/ev';
import { EV_COMPONENTS } from '../../data/evComponentsData';
import { ComponentDetailModal } from './ComponentDetailModal';
import {
  Eye,
  Layers,
  Zap,
  Activity,
  Maximize2,
  RotateCcw,
  Sliders,
  Sparkles,
  Info,
  Thermometer,
  Radio,
  ArrowRight
} from 'lucide-react';

interface EVVehicle3DProps {
  telemetry: EVTelemetry;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onSelectComponent?: (comp: EVComponentInfo) => void;
}

export const EVVehicle3D: React.FC<EVVehicle3DProps> = ({
  telemetry,
  viewMode,
  onViewModeChange,
  onSelectComponent
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedComp, setSelectedComp] = useState<EVComponentInfo | null>(null);
  const [explosionFactor, setExplosionFactor] = useState<number>(0);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [hoveredComponentId, setHoveredComponentId] = useState<string | null>(null);

  // References for Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const carGroupRef = useRef<THREE.Group | null>(null);
  const wheelsRef = useRef<THREE.Mesh[]>([]);
  const energyParticlesRef = useRef<THREE.Points | null>(null);
  const coolantParticlesRef = useRef<THREE.Points | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Modular component groups for explosion
  const bodyMeshGroupRef = useRef<THREE.Group | null>(null);
  const batteryMeshGroupRef = useRef<THREE.Group | null>(null);
  const powertrainMeshGroupRef = useRef<THREE.Group | null>(null);
  const wheelAssemblyGroupRef = useRef<THREE.Group | null>(null);
  const interiorGroupRef = useRef<THREE.Group | null>(null);
  const hvCablesGroupRef = useRef<THREE.Group | null>(null);
  const thermalPipesGroupRef = useRef<THREE.Group | null>(null);
  const canLinesGroupRef = useRef<THREE.Group | null>(null);

  // Materials map for dynamic switching (x-ray, wireframe, glossy)
  const materialsMapRef = useRef<Map<string, THREE.Material>>(new Map());

  // Mouse interaction state
  const isDraggingRef = useRef<boolean>(false);
  const prevMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cameraTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0.5, 0));
  const sphericalRef = useRef<{ radius: number; theta: number; phi: number }>({
    radius: 7.2,
    theta: Math.PI / 4,
    phi: Math.PI / 3,
  });

  // Handle component selection
  const handleSelectComp = (id: string) => {
    const comp = EV_COMPONENTS[id];
    if (comp) {
      setSelectedComp(comp);
      if (onSelectComponent) {
        onSelectComponent(comp);
      }
    }
  };

  // Camera presets
  const applyCameraPreset = (preset: 'iso' | 'top' | 'side' | 'front' | 'rear' | 'underbody' | 'cabin') => {
    switch (preset) {
      case 'iso':
        sphericalRef.current = { radius: 7.2, theta: Math.PI / 4, phi: Math.PI / 3 };
        cameraTargetRef.current.set(0, 0.5, 0);
        break;
      case 'top':
        sphericalRef.current = { radius: 8.5, theta: 0, phi: 0.05 };
        cameraTargetRef.current.set(0, 0, 0);
        break;
      case 'side':
        sphericalRef.current = { radius: 7.0, theta: Math.PI / 2, phi: Math.PI / 2.1 };
        cameraTargetRef.current.set(0, 0.5, 0);
        break;
      case 'front':
        sphericalRef.current = { radius: 6.0, theta: 0, phi: Math.PI / 2.3 };
        cameraTargetRef.current.set(0, 0.4, 1.2);
        break;
      case 'rear':
        sphericalRef.current = { radius: 6.0, theta: Math.PI, phi: Math.PI / 2.3 };
        cameraTargetRef.current.set(0, 0.4, -1.2);
        break;
      case 'underbody':
        sphericalRef.current = { radius: 6.5, theta: Math.PI / 3, phi: Math.PI - 0.4 };
        cameraTargetRef.current.set(0, 0.2, 0);
        break;
      case 'cabin':
        sphericalRef.current = { radius: 3.2, theta: Math.PI / 5, phi: Math.PI / 2.6 };
        cameraTargetRef.current.set(0, 0.8, 0);
        break;
    }
  };

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. SCENE
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060913); // Deep technical obsidian slate
    scene.fog = new THREE.FogExp2(0x060913, 0.04);
    sceneRef.current = scene;

    // 2. CAMERA
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    cameraRef.current = camera;

    // 3. RENDERER
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. LIGHTING (Studio 3-Point Setup)
    const ambientLight = new THREE.AmbientLight(0xd4e2ff, 1.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(6, 12, 8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x00d2ff, 2.0); // Cyan technical rim light
    rimLight.position.set(-8, 6, -8);
    scene.add(rimLight);

    const warmFill = new THREE.DirectionalLight(0xff8c00, 0.8); // Warm amber fill for contrast
    warmFill.position.set(8, -2, -5);
    scene.add(warmFill);

    // 5. STAGE GRID & PEDESTAL
    const gridHelper = new THREE.GridHelper(16, 32, 0x00d2ff, 0x1e293b);
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);

    // Subtle reflective circular podium
    const podiumGeo = new THREE.CylinderGeometry(5.2, 5.5, 0.1, 48);
    const podiumMat = new THREE.MeshStandardMaterial({
      color: 0x0b1120,
      roughness: 0.4,
      metalness: 0.8,
    });
    const podium = new THREE.Mesh(podiumGeo, podiumMat);
    podium.position.y = -0.05;
    podium.receiveShadow = true;
    scene.add(podium);

    // 6. BUILD THE FULL 3D EV DIGITAL TWIN
    const carRoot = new THREE.Group();
    carGroupRef.current = carRoot;
    scene.add(carRoot);

    // Sub-groups for exploded views
    const bodyGroup = new THREE.Group();
    const batteryGroup = new THREE.Group();
    const powertrainGroup = new THREE.Group();
    const wheelGroup = new THREE.Group();
    const interiorGroup = new THREE.Group();
    const hvCablesGroup = new THREE.Group();
    const thermalGroup = new THREE.Group();
    const canGroup = new THREE.Group();

    bodyMeshGroupRef.current = bodyGroup;
    batteryMeshGroupRef.current = batteryGroup;
    powertrainMeshGroupRef.current = powertrainGroup;
    wheelAssemblyGroupRef.current = wheelGroup;
    interiorGroupRef.current = interiorGroup;
    hvCablesGroupRef.current = hvCablesGroup;
    thermalPipesGroupRef.current = thermalGroup;
    canLinesGroupRef.current = canGroup;

    carRoot.add(bodyGroup);
    carRoot.add(batteryGroup);
    carRoot.add(powertrainGroup);
    carRoot.add(wheelGroup);
    carRoot.add(interiorGroup);
    carRoot.add(hvCablesGroup);
    carRoot.add(thermalGroup);
    carRoot.add(canGroup);

    // --- A. EXTERIOR CAR BODY (Aerodynamic sports sedan silhouette) ---
    // Lower body tub / side sills
    const bodyPaintMat = new THREE.MeshPhysicalMaterial({
      color: 0x0f172a, // Slate obsidian metallic
      metalness: 0.85,
      roughness: 0.2,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      reflectivity: 0.9,
    });
    materialsMapRef.current.set('bodyPaint', bodyPaintMat);

    // Lower chassis perimeter
    const lowerBodyGeo = new THREE.BoxGeometry(1.9, 0.42, 4.3);
    const lowerBody = new THREE.Mesh(lowerBodyGeo, bodyPaintMat);
    lowerBody.position.y = 0.52;
    lowerBody.castShadow = true;
    lowerBody.receiveShadow = true;
    (lowerBody as any).componentId = 'chassis';
    bodyGroup.add(lowerBody);

    // Aerodynamic cabin canopy / greenhouse
    const cabinRoofGeo = new THREE.BoxGeometry(1.5, 0.55, 2.4);
    const cabinRoof = new THREE.Mesh(cabinRoofGeo, bodyPaintMat);
    cabinRoof.position.set(0, 0.98, -0.1);
    cabinRoof.castShadow = true;
    bodyGroup.add(cabinRoof);

    // Hood / Frunk slope
    const hoodGeo = new THREE.BoxGeometry(1.65, 0.2, 1.2);
    const hood = new THREE.Mesh(hoodGeo, bodyPaintMat);
    hood.position.set(0, 0.68, 1.35);
    hood.rotation.x = 0.08;
    hood.castShadow = true;
    bodyGroup.add(hood);

    // Glass windshield & panoramic roof
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x1e293b,
      metalness: 0.1,
      roughness: 0.05,
      transmission: 0.75, // Transparent glass
      thickness: 0.5,
      transparent: true,
      opacity: 0.6,
    });
    materialsMapRef.current.set('glass', glassMat);

    // Front windshield
    const windshieldGeo = new THREE.PlaneGeometry(1.4, 0.85);
    const windshield = new THREE.Mesh(windshieldGeo, glassMat);
    windshield.position.set(0, 0.95, 0.95);
    windshield.rotation.x = -Math.PI / 3.8;
    bodyGroup.add(windshield);

    // Panoramic glass roof
    const panoRoofGeo = new THREE.PlaneGeometry(1.3, 1.4);
    const panoRoof = new THREE.Mesh(panoRoofGeo, glassMat);
    panoRoof.position.set(0, 1.26, -0.1);
    panoRoof.rotation.x = -Math.PI / 2;
    bodyGroup.add(panoRoof);

    // Rear window
    const rearWindowGeo = new THREE.PlaneGeometry(1.35, 0.85);
    const rearWindow = new THREE.Mesh(rearWindowGeo, glassMat);
    rearWindow.position.set(0, 0.95, -1.2);
    rearWindow.rotation.x = Math.PI / 4.2;
    bodyGroup.add(rearWindow);

    // Headlights (Cyan LED Matrix)
    const ledMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const headlightLeft = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.08, 0.15), ledMat);
    headlightLeft.position.set(0.68, 0.62, 2.05);
    bodyGroup.add(headlightLeft);
    const headlightRight = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.08, 0.15), ledMat);
    headlightRight.position.set(-0.68, 0.62, 2.05);
    bodyGroup.add(headlightRight);

    // Taillights (Red LED Light Bar)
    const redLedMat = new THREE.MeshBasicMaterial({ color: 0xff1e38 });
    const tailLightBar = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.06, 0.08), redLedMat);
    tailLightBar.position.set(0, 0.68, -2.12);
    bodyGroup.add(tailLightBar);

    // --- B. BATTERY PACK & SKATEBOARD CHASSIS ---
    const batteryTrayMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.9,
      roughness: 0.25,
    });
    materialsMapRef.current.set('batteryTray', batteryTrayMat);

    // Skateboard battery tray enclosure
    const batteryTrayGeo = new THREE.BoxGeometry(1.45, 0.18, 2.6);
    const batteryTray = new THREE.Mesh(batteryTrayGeo, batteryTrayMat);
    batteryTray.position.set(0, 0.26, 0.05);
    batteryTray.castShadow = true;
    (batteryTray as any).componentId = 'battery_pack';
    batteryGroup.add(batteryTray);

    // Titanium ballistic bottom shield (underbody)
    const armorPlateGeo = new THREE.BoxGeometry(1.48, 0.04, 2.64);
    const armorPlateMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.95,
      roughness: 0.3,
    });
    const armorPlate = new THREE.Mesh(armorPlateGeo, armorPlateMat);
    armorPlate.position.set(0, 0.15, 0.05);
    batteryGroup.add(armorPlate);

    // 16 Individual Cell Modules inside the pack
    const moduleMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Electric blue modules
      metalness: 0.6,
      roughness: 0.3,
    });
    const busbarMat = new THREE.MeshBasicMaterial({ color: 0xf97316 }); // Orange high-voltage copper busbars

    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const modGeo = new THREE.BoxGeometry(0.3, 0.12, 0.55);
        const modMesh = new THREE.Mesh(modGeo, moduleMat);
        modMesh.position.set(-0.52 + col * 0.35, 0.3, -0.9 + row * 0.6);
        (modMesh as any).componentId = 'battery_pack';
        batteryGroup.add(modMesh);

        // Inter-module busbar connectors
        if (col < 3) {
          const busGeo = new THREE.BoxGeometry(0.08, 0.02, 0.1);
          const busMesh = new THREE.Mesh(busGeo, busbarMat);
          busMesh.position.set(-0.35 + col * 0.35, 0.36, -0.9 + row * 0.6);
          batteryGroup.add(busMesh);
        }
      }
    }

    // BMS Master Controller Enclosure mounted on front top of pack
    const bmsGeo = new THREE.BoxGeometry(0.4, 0.09, 0.3);
    const bmsMat = new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.7, roughness: 0.3 });
    const bmsMesh = new THREE.Mesh(bmsGeo, bmsMat);
    bmsMesh.position.set(0, 0.38, 1.15);
    (bmsMesh as any).componentId = 'bms_master';
    batteryGroup.add(bmsMesh);

    // Pre-charge Resistor & Contactors Junction Unit
    const prechargeGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.22, 16);
    const prechargeMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.2 });
    const prechargeMesh = new THREE.Mesh(prechargeGeo, prechargeMat);
    prechargeMesh.rotation.z = Math.PI / 2;
    prechargeMesh.position.set(0.32, 0.38, 1.15);
    (prechargeMesh as any).componentId = 'precharge_circuit';
    batteryGroup.add(prechargeMesh);

    // --- C. ELECTRIC POWERTRAIN (Motor, Inverter, Gearbox, Axles) ---
    // 1. REAR PMSM ELECTRIC TRACTION MOTOR
    const motorCylinderGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.55, 32);
    const motorMat = new THREE.MeshStandardMaterial({
      color: 0x475569, // Cast aluminum stator
      metalness: 0.9,
      roughness: 0.2,
    });
    const motorMesh = new THREE.Mesh(motorCylinderGeo, motorMat);
    motorMesh.rotation.z = Math.PI / 2;
    motorMesh.position.set(-0.25, 0.38, -1.45);
    motorMesh.castShadow = true;
    (motorMesh as any).componentId = 'pmsm_motor';
    powertrainGroup.add(motorMesh);

    // Water cooling ribs around motor
    for (let r = 0; r < 4; r++) {
      const ribGeo = new THREE.TorusGeometry(0.25, 0.015, 8, 32);
      const ribMesh = new THREE.Mesh(ribGeo, new THREE.MeshBasicMaterial({ color: 0x06b6d4 }));
      ribMesh.rotation.y = Math.PI / 2;
      ribMesh.position.set(-0.45 + r * 0.14, 0.38, -1.45);
      powertrainGroup.add(ribMesh);
    }

    // 2. REDUCTION GEARBOX & DIFFERENTIAL
    const gearboxGeo = new THREE.BoxGeometry(0.35, 0.42, 0.38);
    const gearboxMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
    const gearboxMesh = new THREE.Mesh(gearboxGeo, gearboxMat);
    gearboxMesh.position.set(0.12, 0.38, -1.45);
    (gearboxMesh as any).componentId = 'gearbox';
    powertrainGroup.add(gearboxMesh);

    // Rear Drive Axles / Half-shafts
    const axleMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.95, roughness: 0.1 });
    const leftAxle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.7, 16), axleMat);
    leftAxle.rotation.z = Math.PI / 2;
    leftAxle.position.set(0.65, 0.38, -1.45);
    powertrainGroup.add(leftAxle);
    const rightAxle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.7, 16), axleMat);
    rightAxle.rotation.z = Math.PI / 2;
    rightAxle.position.set(-0.65, 0.38, -1.45);
    powertrainGroup.add(rightAxle);

    // 3. SILICON CARBIDE (SiC) TRACTION INVERTER
    const inverterGeo = new THREE.BoxGeometry(0.48, 0.22, 0.45);
    const inverterMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.15,
    });
    const inverterMesh = new THREE.Mesh(inverterGeo, inverterMat);
    inverterMesh.position.set(0, 0.68, -1.45); // Mounted directly on top of rear motor
    inverterMesh.castShadow = true;
    (inverterMesh as any).componentId = 'inverter';
    powertrainGroup.add(inverterMesh);

    // Inverter cooling baseplate highlight (cyan)
    const invPlateGeo = new THREE.BoxGeometry(0.5, 0.03, 0.47);
    const invPlateMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const invPlate = new THREE.Mesh(invPlateGeo, invPlateMat);
    invPlate.position.set(0, 0.56, -1.45);
    powertrainGroup.add(invPlate);

    // 4. FRONT DRIVE UNIT (All-Wheel Drive Secondary Motor & Inverter)
    const frontMotorMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.42, 24), motorMat);
    frontMotorMesh.rotation.z = Math.PI / 2;
    frontMotorMesh.position.set(0, 0.38, 1.45);
    (frontMotorMesh as any).componentId = 'pmsm_motor';
    powertrainGroup.add(frontMotorMesh);

    // --- D. WHEELS, TIRES & BRAKES ---
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9, metalness: 0.1 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
    const caliperMat = new THREE.MeshBasicMaterial({ color: 0xff3b30 }); // Performance red brake calipers
    const discMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.95, roughness: 0.1 });

    const wheelPositions = [
      { x: 0.95, y: 0.38, z: 1.45 }, // Front Right
      { x: -0.95, y: 0.38, z: 1.45 }, // Front Left
      { x: 0.95, y: 0.38, z: -1.45 }, // Rear Right
      { x: -0.95, y: 0.38, z: -1.45 }, // Rear Left
    ];

    wheelsRef.current = [];
    wheelPositions.forEach((pos, idx) => {
      const wheelHolder = new THREE.Group();
      wheelHolder.position.set(pos.x, pos.y, pos.z);

      // Rubber Tire
      const tireGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.24, 32);
      const tire = new THREE.Mesh(tireGeo, tireMat);
      tire.rotation.z = Math.PI / 2;
      tire.castShadow = true;
      wheelHolder.add(tire);
      wheelsRef.current.push(tire);

      // Alloy Rim
      const rimGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.25, 24);
      const rim = new THREE.Mesh(rimGeo, rimMat);
      rim.rotation.z = Math.PI / 2;
      wheelHolder.add(rim);

      // Brake Disc
      const discGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.04, 24);
      const disc = new THREE.Mesh(discGeo, discMat);
      disc.rotation.z = Math.PI / 2;
      disc.position.x = pos.x > 0 ? -0.06 : 0.06;
      wheelHolder.add(disc);

      // Brake Caliper
      const caliperGeo = new THREE.BoxGeometry(0.08, 0.12, 0.14);
      const caliper = new THREE.Mesh(caliperGeo, caliperMat);
      caliper.position.set(pos.x > 0 ? -0.06 : 0.06, 0.12, 0.08);
      (caliper as any).componentId = 'wheels_brakes';
      wheelHolder.add(caliper);

      wheelGroup.add(wheelHolder);
    });

    // --- E. HIGH-VOLTAGE ORANGE CABLES ---
    const cableMat = new THREE.MeshStandardMaterial({
      color: 0xf97316, // Automotive HV Orange (RAL 2003)
      roughness: 0.35,
      metalness: 0.2,
    });
    materialsMapRef.current.set('hvCable', cableMat);

    // Cable 1: Battery Front $\to$ Rear Inverter
    const curveRearInv = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.15, 0.38, 1.1),
      new THREE.Vector3(0.25, 0.42, 0.4),
      new THREE.Vector3(0.22, 0.55, -0.6),
      new THREE.Vector3(0.08, 0.68, -1.2),
    ]);
    const cable1Mesh = new THREE.Mesh(new THREE.TubeGeometry(curveRearInv, 32, 0.03, 12, false), cableMat);
    (cable1Mesh as any).componentId = 'hv_architecture';
    hvCablesGroup.add(cable1Mesh);

    // Cable 2: Inverter 3-Phase AC $\to$ Rear Motor Stator
    const curveMotorAC = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.08, 0.65, -1.45),
      new THREE.Vector3(-0.16, 0.52, -1.45),
      new THREE.Vector3(-0.25, 0.42, -1.45),
    ]);
    const cable2Mesh = new THREE.Mesh(new THREE.TubeGeometry(curveMotorAC, 16, 0.04, 12, false), cableMat);
    hvCablesGroup.add(cable2Mesh);

    // Cable 3: Battery Front $\to$ Front Motor Inverter
    const curveFront = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.15, 0.38, 1.1),
      new THREE.Vector3(-0.12, 0.42, 1.3),
      new THREE.Vector3(0, 0.45, 1.45),
    ]);
    const cable3Mesh = new THREE.Mesh(new THREE.TubeGeometry(curveFront, 16, 0.03, 12, false), cableMat);
    hvCablesGroup.add(cable3Mesh);

    // --- F. THERMAL COOLANT PIPES & RADIATOR ---
    const coolantPipeMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Cyan/Blue coolant hose
      roughness: 0.4,
      metalness: 0.1,
    });

    // Front Low-Temp Radiator & Electric Pump Assembly
    const radGeo = new THREE.BoxGeometry(1.2, 0.32, 0.12);
    const radMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
    const radMesh = new THREE.Mesh(radGeo, radMat);
    radMesh.position.set(0, 0.48, 1.95);
    (radMesh as any).componentId = 'radiator_pump';
    thermalGroup.add(radMesh);

    // Coolant hoses connecting Radiator $\to$ Battery $\to$ Motor
    const coolantCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.4, 0.45, 1.9),
      new THREE.Vector3(-0.45, 0.24, 1.1),
      new THREE.Vector3(-0.55, 0.22, -0.2),
      new THREE.Vector3(-0.4, 0.36, -1.35),
    ]);
    const coolTube = new THREE.Mesh(new THREE.TubeGeometry(coolantCurve, 32, 0.024, 12, false), coolantPipeMat);
    (coolTube as any).componentId = 'thermal_chiller';
    thermalGroup.add(coolTube);

    // --- G. CAN BUS SIGNALS & VCU ---
    // Vehicle Control Unit (VCU) placed under dashboard
    const vcuGeo = new THREE.BoxGeometry(0.3, 0.08, 0.24);
    const vcuMat = new THREE.MeshStandardMaterial({ color: 0x6366f1, metalness: 0.7, roughness: 0.3 });
    const vcuMesh = new THREE.Mesh(vcuGeo, vcuMat);
    vcuMesh.position.set(0, 0.78, 0.65);
    (vcuMesh as any).componentId = 'vcu';
    canGroup.add(vcuMesh);

    // CAN green communication lines
    const canLineMat = new THREE.LineBasicMaterial({ color: 0x22c55e, linewidth: 2 });
    const canPoints = [
      new THREE.Vector3(0, 0.78, 0.65), // VCU
      new THREE.Vector3(0, 0.38, 1.15), // BMS
      new THREE.Vector3(0, 0.68, -1.45), // Inverter
      new THREE.Vector3(0, 0.92, 0.4), // Instrument Cluster
    ];
    const canGeo = new THREE.BufferGeometry().setFromPoints(canPoints);
    const canLine = new THREE.Line(canGeo, canLineMat);
    canGroup.add(canLine);

    // --- H. CABIN INTERIOR (Touchscreen, Steering Wheel, Seats) ---
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    // Front Seats
    const leftSeat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.5), seatMat);
    leftSeat.position.set(0.4, 0.7, 0.1);
    interiorGroup.add(leftSeat);
    const rightSeat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.5), seatMat);
    rightSeat.position.set(-0.4, 0.7, 0.1);
    interiorGroup.add(rightSeat);

    // Center 15-inch Touchscreen Display
    const screenGeo = new THREE.BoxGeometry(0.32, 0.2, 0.02);
    const screenMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const screenMesh = new THREE.Mesh(screenGeo, screenMat);
    screenMesh.position.set(0, 0.88, 0.45);
    screenMesh.rotation.x = -0.2;
    interiorGroup.add(screenMesh);

    // 7. ANIMATED PARTICLES (Energy pulses along HV bus)
    const particleCount = 60;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const t = i / particleCount;
      const pt = curveRearInv.getPoint(t);
      particlePositions[i * 3] = pt.x;
      particlePositions[i * 3 + 1] = pt.y;
      particlePositions[i * 3 + 2] = pt.z;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xffa500,
      size: 0.08,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    const energyParticles = new THREE.Points(particleGeo, particleMat);
    energyParticlesRef.current = energyParticles;
    hvCablesGroup.add(energyParticles);

    // 8. ANIMATION LOOP & ORBIT CONTROLS
    let particleOffset = 0;

    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      // Rotate wheels when driving
      if (wheelsRef.current.length > 0 && telemetry.speedKmh > 0) {
        const wheelRotSpeed = (telemetry.speedKmh * 0.05) / 3.6;
        wheelsRef.current.forEach((wheel) => {
          wheel.rotation.x += wheelRotSpeed;
        });
      }

      // Animate energy particles
      if (energyParticlesRef.current && curveRearInv) {
        particleOffset = (particleOffset + (telemetry.speedKmh > 0 ? 0.008 : 0.002)) % 1;
        const positions = energyParticlesRef.current.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < particleCount; i++) {
          let t = (i / particleCount + particleOffset) % 1;
          // In reverse if regen
          if (telemetry.regenPowerKw > 0) {
            t = 1 - t;
          }
          const pt = curveRearInv.getPoint(t);
          positions[i * 3] = pt.x;
          positions[i * 3 + 1] = pt.y;
          positions[i * 3 + 2] = pt.z;
        }
        energyParticlesRef.current.geometry.attributes.position.needsUpdate = true;
      }

      // Update camera position based on spherical coordinates
      const s = sphericalRef.current;
      const target = cameraTargetRef.current;
      camera.position.x = target.x + s.radius * Math.sin(s.phi) * Math.sin(s.theta);
      camera.position.y = target.y + s.radius * Math.cos(s.phi);
      camera.position.z = target.z + s.radius * Math.sin(s.phi) * Math.cos(s.theta);
      camera.lookAt(target);

      renderer.render(scene, camera);
    };

    animate();

    // 9. RESIZE HANDLER
    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update view mode shaders & opacities dynamically
  useEffect(() => {
    if (!bodyMeshGroupRef.current || !materialsMapRef.current) return;

    const bodyMat = materialsMapRef.current.get('bodyPaint') as THREE.MeshPhysicalMaterial;
    const glassMat = materialsMapRef.current.get('glass') as THREE.MeshPhysicalMaterial;

    if (!bodyMat || !glassMat) return;

    switch (viewMode) {
      case 'xray':
        bodyMat.transparent = true;
        bodyMat.opacity = 0.15;
        bodyMat.wireframe = true;
        glassMat.opacity = 0.1;
        if (batteryMeshGroupRef.current) batteryMeshGroupRef.current.visible = true;
        if (powertrainMeshGroupRef.current) powertrainMeshGroupRef.current.visible = true;
        if (hvCablesGroupRef.current) hvCablesGroupRef.current.visible = true;
        break;

      case 'electrical':
        bodyMat.transparent = true;
        bodyMat.opacity = 0.2;
        bodyMat.wireframe = false;
        glassMat.opacity = 0.15;
        if (hvCablesGroupRef.current) hvCablesGroupRef.current.visible = true;
        if (batteryMeshGroupRef.current) batteryMeshGroupRef.current.visible = true;
        if (powertrainMeshGroupRef.current) powertrainMeshGroupRef.current.visible = true;
        break;

      case 'thermal':
        bodyMat.transparent = true;
        bodyMat.opacity = 0.2;
        bodyMat.wireframe = false;
        if (thermalPipesGroupRef.current) thermalPipesGroupRef.current.visible = true;
        break;

      case 'can':
        bodyMat.transparent = true;
        bodyMat.opacity = 0.18;
        bodyMat.wireframe = false;
        if (canLinesGroupRef.current) canLinesGroupRef.current.visible = true;
        break;

      case 'underbody':
        bodyMat.transparent = false;
        bodyMat.opacity = 1.0;
        bodyMat.wireframe = false;
        applyCameraPreset('underbody');
        break;

      case 'interior':
        bodyMat.transparent = true;
        bodyMat.opacity = 0.35;
        bodyMat.wireframe = false;
        glassMat.opacity = 0.2;
        applyCameraPreset('cabin');
        break;

      case 'battery_exploded':
        bodyMat.transparent = true;
        bodyMat.opacity = 0.1;
        bodyMat.wireframe = true;
        setExplosionFactor(0.75);
        break;

      case 'exterior':
      default:
        bodyMat.transparent = false;
        bodyMat.opacity = 1.0;
        bodyMat.wireframe = false;
        glassMat.opacity = 0.6;
        break;
    }
  }, [viewMode]);

  // Handle Explosion Factor changes
  useEffect(() => {
    const f = explosionFactor;
    if (bodyMeshGroupRef.current) {
      bodyMeshGroupRef.current.position.y = f * 1.8;
    }
    if (batteryMeshGroupRef.current) {
      batteryMeshGroupRef.current.position.y = -f * 1.2;
    }
    if (powertrainMeshGroupRef.current) {
      powertrainMeshGroupRef.current.position.z = -f * 0.9;
    }
    if (wheelAssemblyGroupRef.current) {
      wheelAssemblyGroupRef.current.position.x = 0; // maintain axis
    }
  }, [explosionFactor]);

  // Pointer event handlers for drag orbit & raycasting
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    prevMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingRef.current) {
      const deltaX = e.clientX - prevMousePosRef.current.x;
      const deltaY = e.clientY - prevMousePosRef.current.y;
      prevMousePosRef.current = { x: e.clientX, y: e.clientY };

      const s = sphericalRef.current;
      s.theta -= deltaX * 0.008;
      s.phi = Math.max(0.1, Math.min(Math.PI - 0.1, s.phi - deltaY * 0.008));
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const s = sphericalRef.current;
    s.radius = Math.max(2.5, Math.min(18, s.radius + e.deltaY * 0.005));
  };

  return (
    <div className="relative w-full h-full min-h-[580px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col">
      {/* 3D WebGL Canvas Container */}
      <div
        ref={mountRef}
        className="w-full flex-1 cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* Floating View Mode Selector (Segmented Bar) */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-lg">
        {(
          [
            { id: 'exterior', label: 'Exterior', icon: Eye },
            { id: 'xray', label: 'X-Ray Twin', icon: Layers },
            { id: 'electrical', label: 'HV Energy Flow', icon: Zap },
            { id: 'thermal', label: 'Thermal Cooling', icon: Thermometer },
            { id: 'can', label: 'CAN Bus', icon: Radio },
            { id: 'underbody', label: 'Skateboard Underbody', icon: Activity },
            { id: 'interior', label: 'Cabin Cockpit', icon: Sparkles },
            { id: 'battery_exploded', label: 'Battery Exploded', icon: Sliders },
          ] as { id: ViewMode; label: string; icon: any }[]
        ).map((item) => {
          const Icon = item.icon;
          const isActive = viewMode === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewModeChange(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Floating Camera View Presets & Reset */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <div className="flex items-center gap-1 p-1 bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-lg">
          <button
            onClick={() => applyCameraPreset('iso')}
            className="px-2.5 py-1 text-xs font-mono text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="3D Isometric"
          >
            ISO
          </button>
          <button
            onClick={() => applyCameraPreset('top')}
            className="px-2.5 py-1 text-xs font-mono text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Top Plan View"
          >
            TOP
          </button>
          <button
            onClick={() => applyCameraPreset('side')}
            className="px-2.5 py-1 text-xs font-mono text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Side Profile"
          >
            SIDE
          </button>
          <button
            onClick={() => applyCameraPreset('front')}
            className="px-2.5 py-1 text-xs font-mono text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Front Powertrain"
          >
            FRONT
          </button>
          <button
            onClick={() => applyCameraPreset('rear')}
            className="px-2.5 py-1 text-xs font-mono text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Rear Inverter & Motor"
          >
            REAR
          </button>
          <button
            onClick={() => applyCameraPreset('iso')}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Reset Camera"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Bottom Floating Interactive Component Badges */}
      <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-col sm:flex-row items-center justify-between gap-3 pointer-events-none">
        {/* Quick Component Picker Badges */}
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-2 rounded-xl shadow-xl">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2">Inspect:</span>
          {[
            { id: 'battery_pack', label: '800V Battery Pack' },
            { id: 'inverter', label: 'SiC Inverter' },
            { id: 'pmsm_motor', label: 'PMSM Motor' },
            { id: 'precharge_circuit', label: 'Pre-charge' },
            { id: 'bms_master', label: 'BMS Master' },
            { id: 'vcu', label: 'VCU' },
            { id: 'radiator_pump', label: 'Thermal TMS' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handleSelectComp(item.id)}
              className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-cyan-500/20 hover:border-cyan-500/50 border border-slate-700 text-slate-200 hover:text-cyan-300 font-medium transition-all"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Exploded View Slider Control */}
        <div className="flex items-center gap-3 pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-4 py-2 rounded-xl shadow-xl">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-300 whitespace-nowrap">Explode:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={explosionFactor}
            onChange={(e) => setExplosionFactor(parseFloat(e.target.value))}
            className="w-28 sm:w-36 accent-cyan-400 cursor-pointer"
          />
          <span className="text-xs font-mono text-cyan-400 w-10 text-right">
            {(explosionFactor * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Orbit Helper Tip */}
      <div className="absolute top-16 right-4 z-10 pointer-events-none hidden md:block">
        <div className="px-2.5 py-1 rounded-md bg-slate-900/60 backdrop-blur-sm border border-slate-800 text-[11px] text-slate-400 font-mono">
          Drag: Orbit · Scroll: Zoom · Right-drag: Pan
        </div>
      </div>

      {/* Component Detail Inspector Modal */}
      {selectedComp && (
        <ComponentDetailModal
          component={selectedComp}
          telemetry={telemetry}
          onClose={() => setSelectedComp(null)}
        />
      )}
    </div>
  );
};
