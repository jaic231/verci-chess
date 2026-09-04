"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createChessBoardModel } from "./chess-board-model";

export default function ChessBoardScene() {
  const mountRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  function resetView() {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;
    camera.position.set(8.8, 8.4, 10.4);
    controls.target.set(0, 0.35, 0);
    controls.update();
  }

  async function downloadModel() {
    const model = modelRef.current;
    if (!model) return;
    const { GLTFExporter } = await import("three/examples/jsm/exporters/GLTFExporter.js");
    const exporter = new GLTFExporter();
    exporter.parse(
      model,
      (result) => {
        const blob = new Blob([result as ArrayBuffer], { type: "model/gltf-binary" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "verci-folding-chess-board.glb";
        link.click();
        URL.revokeObjectURL(url);
      },
      (exportError) => setError(exportError instanceof Error ? exportError.message : "Unable to export the model."),
      { binary: true, onlyVisible: true },
    );
  }

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let frame = 0;
    try {
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x1f1c19);
      scene.fog = new THREE.Fog(0x1f1c19, 16, 30);

      const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 60);
      cameraRef.current = camera;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.08;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      renderer.domElement.setAttribute("aria-label", "Interactive three-dimensional wooden chess board");
      renderer.domElement.setAttribute("role", "img");
      mount.appendChild(renderer.domElement);

      const model = createChessBoardModel();
      model.rotation.y = -0.12;
      modelRef.current = model;
      scene.add(model);

      const table = new THREE.Mesh(
        new THREE.PlaneGeometry(36, 36),
        new THREE.MeshStandardMaterial({ color: 0x191715, roughness: 0.76 }),
      );
      table.rotation.x = -Math.PI / 2;
      table.position.y = -0.2;
      table.receiveShadow = true;
      scene.add(table);

      scene.add(new THREE.HemisphereLight(0xf6dec0, 0x27211d, 1.6));
      const sunlight = new THREE.DirectionalLight(0xffddb0, 4.8);
      sunlight.position.set(7, 12, -5);
      sunlight.castShadow = true;
      sunlight.shadow.mapSize.set(2048, 2048);
      sunlight.shadow.camera.near = 1;
      sunlight.shadow.camera.far = 30;
      sunlight.shadow.camera.left = -8;
      sunlight.shadow.camera.right = 8;
      sunlight.shadow.camera.top = 8;
      sunlight.shadow.camera.bottom = -8;
      scene.add(sunlight);

      const rim = new THREE.DirectionalLight(0x81b64c, 1.1);
      rim.position.set(-7, 5, 6);
      scene.add(rim);

      const controls = new OrbitControls(camera, renderer.domElement);
      controlsRef.current = controls;
      controls.enableDamping = true;
      controls.dampingFactor = 0.07;
      controls.minDistance = 8;
      controls.maxDistance = 24;
      controls.maxPolarAngle = Math.PI * 0.48;
      controls.minPolarAngle = Math.PI * 0.12;
      controls.target.set(0, 0.35, 0);
      resetView();

      const resize = () => {
        const width = Math.max(mount.clientWidth, 1);
        const height = Math.max(mount.clientHeight, 1);
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };
      const observer = new ResizeObserver(resize);
      observer.observe(mount);
      resize();

      let firstFrame = true;
      const render = () => {
        controls.update();
        renderer.render(scene, camera);
        if (firstFrame) {
          firstFrame = false;
          setReady(true);
        }
        frame = requestAnimationFrame(render);
      };
      frame = requestAnimationFrame(render);

      return () => {
        cancelAnimationFrame(frame);
        observer.disconnect();
        controls.dispose();
        renderer.dispose();
        renderer.domElement.remove();
        scene.traverse((object) => {
          if (!(object instanceof THREE.Mesh)) return;
          object.geometry.dispose();
        });
        modelRef.current = null;
        cameraRef.current = null;
        controlsRef.current = null;
      };
    } catch (sceneError) {
      const message = sceneError instanceof Error ? sceneError.message : "This browser could not render the model.";
      queueMicrotask(() => setError(message));
    }
  }, []);

  return (
    <div className="model-stage-shell">
      <div className="model-stage" ref={mountRef}>
        {!ready && !error && <div className="model-loading">Building the board…</div>}
        {error && <div className="model-error">{error}</div>}
      </div>
      <div className="model-controls" aria-label="Model controls">
        <span>Drag to rotate · scroll to zoom</span>
        <div>
          <button type="button" onClick={resetView}>Reset view</button>
          <button className="model-download" type="button" onClick={() => void downloadModel()} disabled={!ready}>Download model</button>
        </div>
      </div>
    </div>
  );
}
