import * as THREE from "three";

type PieceKind = "pawn" | "rook" | "knight" | "bishop" | "queen" | "king";
type Side = "light" | "dark";

const lightWood = new THREE.MeshStandardMaterial({
  color: 0xd7a764,
  roughness: 0.42,
  metalness: 0.03,
});

const darkWood = new THREE.MeshStandardMaterial({
  color: 0x4b2115,
  roughness: 0.38,
  metalness: 0.04,
});

const creamSquare = new THREE.MeshStandardMaterial({
  color: 0xd9b978,
  roughness: 0.62,
});

const walnutSquare = new THREE.MeshStandardMaterial({
  color: 0x7a4430,
  roughness: 0.55,
});

const frameWood = new THREE.MeshStandardMaterial({
  color: 0x63321f,
  roughness: 0.48,
});

const hingeMetal = new THREE.MeshStandardMaterial({
  color: 0x392f29,
  roughness: 0.32,
  metalness: 0.72,
});

function markShadow<T extends THREE.Object3D>(object: T): T {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  return object;
}

function lathedBody(points: Array<[number, number]>, material: THREE.Material) {
  const profile = points.map(([radius, height]) => new THREE.Vector2(radius, height));
  return new THREE.Mesh(new THREE.LatheGeometry(profile, 32), material);
}

function addBase(group: THREE.Group, material: THREE.Material) {
  group.add(lathedBody([
    [0.31, 0], [0.39, 0.06], [0.4, 0.13], [0.34, 0.2], [0.28, 0.24],
  ], material));
}

function createPawn(material: THREE.Material) {
  const piece = new THREE.Group();
  addBase(piece, material);
  piece.add(lathedBody([
    [0.27, 0.22], [0.24, 0.32], [0.17, 0.55], [0.21, 0.66], [0.2, 0.72],
  ], material));
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.21, 24, 16), material);
  head.position.y = 0.87;
  piece.add(head);
  return markShadow(piece);
}

function createRook(material: THREE.Material) {
  const piece = new THREE.Group();
  addBase(piece, material);
  piece.add(lathedBody([
    [0.27, 0.22], [0.24, 0.34], [0.21, 0.65], [0.29, 0.73], [0.3, 0.82],
  ], material));
  for (let index = 0; index < 4; index += 1) {
    const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.2, 0.18), material);
    const angle = (Math.PI / 2) * index;
    tooth.position.set(Math.cos(angle) * 0.22, 0.92, Math.sin(angle) * 0.22);
    piece.add(tooth);
  }
  return markShadow(piece);
}

function createBishop(material: THREE.Material) {
  const piece = new THREE.Group();
  addBase(piece, material);
  piece.add(lathedBody([
    [0.27, 0.22], [0.22, 0.34], [0.14, 0.7], [0.22, 0.83], [0.18, 0.89],
  ], material));
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.19, 24, 18), material);
  head.scale.y = 1.28;
  head.position.y = 1.04;
  piece.add(head);
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.045, 10, 28), material);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 0.87;
  piece.add(collar);
  return markShadow(piece);
}

function createKnight(material: THREE.Material) {
  const piece = new THREE.Group();
  addBase(piece, material);
  const shape = new THREE.Shape();
  shape.moveTo(-0.21, 0.25);
  shape.bezierCurveTo(-0.28, 0.46, -0.2, 0.72, -0.05, 0.94);
  shape.bezierCurveTo(0.08, 1.13, 0.18, 1.22, 0.36, 1.28);
  shape.bezierCurveTo(0.31, 1.06, 0.22, 0.92, 0.08, 0.83);
  shape.bezierCurveTo(0.27, 0.76, 0.34, 0.62, 0.28, 0.52);
  shape.bezierCurveTo(0.18, 0.36, 0.04, 0.28, -0.21, 0.25);
  const neck = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, {
    depth: 0.3,
    bevelEnabled: true,
    bevelSize: 0.055,
    bevelThickness: 0.055,
    bevelSegments: 3,
    curveSegments: 16,
  }), material);
  neck.position.z = -0.15;
  piece.add(neck);
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.032, 12, 8), hingeMetal);
  eye.position.set(0.2, 1.1, 0.19);
  piece.add(eye);
  return markShadow(piece);
}

function createRoyal(material: THREE.Material, kind: "queen" | "king") {
  const piece = new THREE.Group();
  addBase(piece, material);
  piece.add(lathedBody([
    [0.28, 0.22], [0.24, 0.34], [0.16, 0.74], [0.24, 0.88], [0.2, 0.98],
  ], material));
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.05, 10, 32), material);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 0.94;
  piece.add(collar);

  if (kind === "queen") {
    const crown = new THREE.Mesh(new THREE.SphereGeometry(0.17, 24, 16), material);
    crown.position.y = 1.12;
    piece.add(crown);
    for (let index = 0; index < 6; index += 1) {
      const jewel = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 8), material);
      const angle = (Math.PI * 2 * index) / 6;
      jewel.position.set(Math.cos(angle) * 0.19, 1.24, Math.sin(angle) * 0.19);
      piece.add(jewel);
    }
  } else {
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 0.27, 18), material);
    stem.position.y = 1.13;
    piece.add(stem);
    const crossVertical = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.28, 0.09), material);
    crossVertical.position.y = 1.35;
    piece.add(crossVertical);
    const crossHorizontal = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.08, 0.09), material);
    crossHorizontal.position.y = 1.38;
    piece.add(crossHorizontal);
  }
  return markShadow(piece);
}

function createPiece(kind: PieceKind, side: Side) {
  const material = side === "light" ? lightWood : darkWood;
  switch (kind) {
    case "pawn": return createPawn(material);
    case "rook": return createRook(material);
    case "knight": return createKnight(material);
    case "bishop": return createBishop(material);
    case "queen": return createRoyal(material, "queen");
    case "king": return createRoyal(material, "king");
  }
}

function squarePosition(square: string) {
  const file = square.charCodeAt(0) - 97;
  const rank = Number(square[1]) - 1;
  return {
    x: file - 3.5,
    z: 3.5 - rank,
  };
}

const photoPosition: Array<[PieceKind, Side, string]> = [
  ["rook", "dark", "a8"], ["king", "dark", "b8"], ["pawn", "dark", "c8"],
  ["bishop", "dark", "a7"], ["knight", "dark", "b7"], ["pawn", "dark", "c7"],
  ["queen", "dark", "b6"], ["pawn", "dark", "d6"], ["bishop", "dark", "a5"],
  ["pawn", "dark", "c5"], ["knight", "dark", "a3"], ["pawn", "dark", "c3"],
  ["rook", "dark", "a2"], ["pawn", "dark", "b1"],
  ["pawn", "light", "e8"], ["rook", "light", "f8"], ["pawn", "light", "g7"],
  ["bishop", "light", "h7"], ["pawn", "light", "e6"], ["queen", "light", "f6"],
  ["bishop", "light", "g6"], ["pawn", "light", "h6"], ["pawn", "light", "e5"],
  ["king", "light", "g5"], ["pawn", "light", "h4"], ["pawn", "light", "f3"],
  ["knight", "light", "g3"], ["pawn", "light", "f2"], ["rook", "light", "h2"],
];

export function createChessBoardModel() {
  const model = new THREE.Group();
  model.name = "Verci folding chess board";

  const backing = new THREE.Mesh(new THREE.BoxGeometry(8.72, 0.18, 8.72), frameWood);
  backing.position.y = 0.01;
  backing.receiveShadow = true;
  model.add(backing);

  for (let rank = 0; rank < 8; rank += 1) {
    for (let file = 0; file < 8; file += 1) {
      const square = new THREE.Mesh(
        new THREE.BoxGeometry(0.995, 0.12, 0.995),
        (rank + file) % 2 === 0 ? creamSquare : walnutSquare,
      );
      square.position.set(file - 3.5, 0.16, rank - 3.5);
      square.receiveShadow = true;
      model.add(square);
    }
  }

  const railGeometry = new THREE.BoxGeometry(9.12, 0.34, 0.36);
  const sideRailGeometry = new THREE.BoxGeometry(0.36, 0.34, 8.4);
  for (const z of [-4.38, 4.38]) {
    const rail = new THREE.Mesh(railGeometry, frameWood);
    rail.position.set(0, 0.22, z);
    rail.castShadow = rail.receiveShadow = true;
    model.add(rail);
  }
  for (const x of [-4.38, 4.38]) {
    const rail = new THREE.Mesh(sideRailGeometry, frameWood);
    rail.position.set(x, 0.22, 0);
    rail.castShadow = rail.receiveShadow = true;
    model.add(rail);
  }

  const seam = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.04, 8.02), hingeMetal);
  seam.position.y = 0.235;
  model.add(seam);

  for (const z of [-3.25, 3.25]) {
    const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.62, 18), hingeMetal);
    hinge.rotation.z = Math.PI / 2;
    hinge.position.set(0, 0.04, z);
    model.add(hinge);
  }

  for (const [kind, side, square] of photoPosition) {
    const piece = createPiece(kind, side);
    const position = squarePosition(square);
    piece.position.set(position.x, 0.24, position.z);
    piece.rotation.y = side === "dark" ? Math.PI : 0;
    piece.name = `${side} ${kind} ${square}`;
    model.add(piece);
  }

  return markShadow(model);
}
