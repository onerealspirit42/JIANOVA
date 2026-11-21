/**
 * The turn drawn live: the shoe in 3D, turned to any angle the scroll asks for, so the turn is one
 * continuous movement with no frames to step between, and the colourways change continuously too.
 * The same scene as the rendered frames (scripts/stills/render.html: the model, its part-colouring
 * material, the studio light, the camera and the soft contact shadow), so the still on the first
 * screen (frame 0) and the live shoe are the same picture.
 *
 * TurnHero.tsx loads this module only when the page can draw WebGL, and moves the canvas the way it
 * moved the frames: the canvas is one frame (TURN_FRAMES' size and framing), its shoe placed by the
 * frames' boxes. Where it cannot run, or the browser drops the canvas, the frames take over.
 */
import {
  ACESFilmicToneMapping,
  Color,
  DirectionalLight,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshDepthMaterial,
  OrthographicCamera,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  Box3,
  Vector3,
  WebGLRenderer,
  WebGLRenderTarget,
  DoubleSide,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { HorizontalBlurShader } from "three/examples/jsm/shaders/HorizontalBlurShader.js";
import { VerticalBlurShader } from "three/examples/jsm/shaders/VerticalBlurShader.js";
import { FullScreenQuad } from "three/examples/jsm/postprocessing/Pass.js";
import { applyShoeMaterial, SHOE_PARTS } from "@/features/configurator/shoe-material.js";

// ---------------------------------------------------------------- the colourways
// As in scripts/stills/render-turn.mjs (keep the two the same): three looks, the details changing
// first, then the upper, mixed in OKLab so a change passes through clean colours. Positions are
// in steps of 6 degrees (0 to 60 for the whole turn).
const C = {
  chalk: "#f1efec", royal: "#241039", oasis: "#2f5d50", ember: "#b4532e", midnight: "#17121e",
} as const;
type Look = Record<string, string>;
const look = (...names: (keyof typeof C)[]): Look => Object.fromEntries(SHOE_PARTS.map((p: string, i: number) => [p, C[names[i]]]));
const LOOKS = [
  look("royal", "chalk", "chalk", "midnight", "royal", "chalk", "midnight"),
  look("chalk", "ember", "ember", "midnight", "ember", "chalk", "midnight"),
  look("oasis", "chalk", "chalk", "midnight", "oasis", "chalk", "midnight"),
];
const CHANGES = [6, 30];
const ORDER: Record<string, number> = { laces: 0, tabs: 1, heel: 2, upper: 3, lining: 4, midsole: 4, outsole: 4 };
const SPAN = 5;

const toLin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGam = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
function hexToLab(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => toLin(parseInt(hex.slice(i, i + 2), 16) / 255));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}
function labToRgb([L, A, B]: number[]) {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s].map((c) =>
    Math.min(1, Math.max(0, toGam(c))),
  );
}
const LABS = LOOKS.map((lk) => Object.fromEntries(Object.entries(lk).map(([p, hex]) => [p, hexToLab(hex)])));
const smooth = (t: number) => t * t * (3 - 2 * t);
/** Each part's colour at a position of the turn (in 6-degree steps), as sRGB 0..1. */
function colorsAt(step: number): number[][] {
  return SHOE_PARTS.map((part: string) => {
    let lab = LABS[0][part];
    CHANGES.forEach((start, i) => {
      const t = Math.min(1, Math.max(0, (step - start - ORDER[part] * 1.2) / SPAN));
      if (t > 0) lab = lab.map((v, k) => v + (LABS[i + 1][part][k] - v) * smooth(t));
    });
    return labToRgb(lab);
  });
}

// ---------------------------------------------------------------- the scene
/** The turntable camera of the rendered frames (render-turn.mjs). */
const CAMERA = { position: [0, 1.62, 9.5] as const, target: [0, 0.6, 0] as const, fov: 15 };

export type Turn3D = {
  /** Draws the shoe a share `turn` (0..1) of the way round, at the colours of that point. */
  render(turn: number): void;
  /** Sets the drawing size in device pixels (the canvas's CSS size stays the frame's). */
  setSize(width: number, height: number): void;
  dispose(): void;
};

/**
 * Loads the model and sets up the scene on `canvas`. Rejects where WebGL or the model is not
 * available; `onLost` is called if the browser drops the canvas later.
 */
export async function createTurn3D(canvas: HTMLCanvasElement, modelUrl: string, aspect: number, onLost: () => void): Promise<Turn3D> {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(1);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  const lost = (e: Event) => {
    e.preventDefault();
    onLost();
  };
  canvas.addEventListener("webglcontextlost", lost);

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  scene.environment = pmrem.fromScene(room, 0.04).texture;
  scene.environmentIntensity = 0.8;
  const key = new DirectionalLight(0xffffff, 1.6);
  key.position.set(-3, 6, 4);
  const rim = new DirectionalLight(0xffffff, 0.7);
  rim.position.set(4, 3, -5);
  scene.add(key, rim);

  const gltf = await new GLTFLoader().loadAsync(modelUrl);
  const shoe = gltf.scene;
  let mesh: Mesh | undefined;
  shoe.traverse((o) => {
    if ((o as Mesh).isMesh) mesh = o as Mesh;
  });
  if (!mesh) throw new Error("turn-3d: no mesh in the model");
  const paint = applyShoeMaterial(mesh);
  paint.glow(-1, 0);
  const box = new Box3().setFromObject(shoe);
  const size = box.getSize(new Vector3());
  const centre = box.getCenter(new Vector3());

  // The shoe turns about the vertical axis through its centre, as on the turntable.
  const pivot = new Group();
  pivot.position.set(centre.x, 0, centre.z);
  scene.add(pivot);
  pivot.add(shoe);
  shoe.position.set(-centre.x, 0, -centre.z);

  // The soft contact shadow of the frames (drei's ContactShadows, as render.html draws it): the shoe
  // seen from the ground up, darker where it is closer, blurred. Seen from below, the shoe's shadow
  // is the same at every angle, only turned, so it is drawn once and turns with the shoe.
  const res = 1024, width = size.x * 1.25;
  const rt = new WebGLRenderTarget(res, res);
  const rtBlur = new WebGLRenderTarget(res, res);
  rt.texture.generateMipmaps = rtBlur.texture.generateMipmaps = false;
  {
    const camera = new OrthographicCamera(-width / 2, width / 2, width / 2, -width / 2, 0, 0.55);
    camera.up.set(0, 0, 1);
    camera.lookAt(0, 1, 0);
    const depth = new MeshDepthMaterial();
    depth.depthTest = depth.depthWrite = false;
    depth.onBeforeCompile = (shader) => {
      shader.uniforms.ucolor = { value: new Color("#0b0910") };
      shader.fragmentShader = shader.fragmentShader
        .replace("void main() {", "uniform vec3 ucolor;\nvoid main() {")
        .replace("vec4( vec3( 1.0 - fragCoordZ ), opacity );", "vec4( ucolor, ( 1.0 - fragCoordZ ) );");
    };
    const h = new ShaderMaterial(HorizontalBlurShader);
    const v = new ShaderMaterial(VerticalBlurShader);
    const quad = new FullScreenQuad();
    const pass = (amount: number) => {
      quad.material = h;
      h.uniforms.tDiffuse.value = rt.texture;
      h.uniforms.h.value = amount / res;
      renderer.setRenderTarget(rtBlur);
      quad.render(renderer);
      quad.material = v;
      v.uniforms.tDiffuse.value = rtBlur.texture;
      v.uniforms.v.value = amount / res;
      renderer.setRenderTarget(rt);
      quad.render(renderer);
    };
    scene.overrideMaterial = depth;
    renderer.setRenderTarget(rt);
    renderer.clear();
    renderer.render(scene, camera);
    scene.overrideMaterial = null;
    // (the frames' 2048-pixel shadow blurred by 6 and 2.4 pixels: the same blur at half the size)
    pass(3);
    pass(1.2);
    renderer.setRenderTarget(null);
    quad.dispose();
    h.dispose();
    v.dispose();
    depth.dispose();
  }
  const shadowMaterial = new MeshBasicMaterial({ map: rt.texture, transparent: true, opacity: 0.7, depthWrite: false, side: DoubleSide, toneMapped: false });
  // (its faintest tails, as the frames clear them, so no ghost of the ground's square shows on a light page)
  shadowMaterial.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace("#include <dithering_fragment>", "#include <dithering_fragment>\nif (gl_FragColor.a < 0.014) discard;");
  };
  const plane = new Mesh(new PlaneGeometry(width, width).rotateX(Math.PI / 2), shadowMaterial);
  plane.position.set(-centre.x, 0.001, -centre.z);
  pivot.add(plane);

  const camera = new PerspectiveCamera(CAMERA.fov, aspect, 0.1, 100);
  camera.position.set(...CAMERA.position);
  camera.lookAt(new Vector3(...CAMERA.target));
  // The shaders compile before the first picture, without holding the page up where the browser can
  // compile in the background (KHR_parallel_shader_compile), so the first scroll never waits for them.
  if (renderer.extensions.has("KHR_parallel_shader_compile")) await renderer.compileAsync(scene, camera);
  else renderer.compile(scene, camera);
  // One picture now, before the canvas is shown: the textures go to the graphics card here, while the
  // page is idle, not in the first frame of the first scroll.
  renderer.render(scene, camera);

  let last = NaN;
  return {
    render(turn: number) {
      if (turn === last) return;
      last = turn;
      pivot.rotation.y = -turn * Math.PI * 2;
      colorsAt(turn * 60).forEach(([r, g, b], i) => paint.setColor(i, new Color().setRGB(r, g, b, SRGBColorSpace)));
      renderer.render(scene, camera);
    },
    setSize(w: number, h: number) {
      renderer.setSize(w, h, false);
      last = NaN;
    },
    dispose() {
      canvas.removeEventListener("webglcontextlost", lost);
      rt.dispose();
      rtBlur.dispose();
      shadowMaterial.dispose();
      pmrem.dispose();
      room.dispose?.();
      renderer.dispose();
    },
  };
}
