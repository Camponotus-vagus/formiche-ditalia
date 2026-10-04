/**
 * AnatomyViewer3D — visualizzatore 3D dell'anatomia della formica (formicheditalia.it).
 *
 * Solo canvas + selettore di modello + avviso: l'elenco dei termini lo gestisce la pagina,
 * che passa `activeTerm` e ascolta `onTermChange` (click sul modello, cambio modello, ecc.).
 *
 * Dipendenze: react >= 18, three >= 0.169 (e @types/three). Tailwind per le classi di stile.
 * Da montare solo lato client (in Astro: <AnatomyViewer3D client:only="react" ... />).
 *
 * File attesi in `modelBaseUrl`: formica.glb/.json e (opzionale) tetramorium.glb/.json;
 * se presenti, <taxon>_lite.glb vengono usati su dispositivi touch / schermi stretti.
 */
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/* ------------------------------------------------------------------ catalogo */

const TERM_NAMES: Record<string, [string, string]> = {
  antenna: ['Antenna', 'Antenna'],
  'antennal-club': ['Clava antennale', 'Antennal club'],
  'antennal-socket': ['Torulo antennale', 'Antennal socket'],
  clypeus: ['Clipeo', 'Clypeus'],
  'clypeal-socket': ['Fossetta clipeale', 'Clypeal socket'],
  'compound-eye': ['Occhio composto', 'Compound eye'],
  'frontal-carina': ['Carena frontale', 'Frontal carina'],
  'frontal-lobe': ['Lobo frontale', 'Frontal lobe'],
  'frontal-triangle': ['Triangolo frontale', 'Frontal triangle'],
  funiculus: ['Funicolo', 'Funiculus'],
  mandible: ['Mandibola', 'Mandible'],
  'labial-palp': ['Palpo labiale', 'Labial palp'],
  'maxillary-palp': ['Palpo mascellare', 'Maxillary palp'],
  ocelli: ['Ocelli', 'Ocelli'],
  scape: ['Scapo', 'Scape'],
  scrobe: ['Scrobo antennale', 'Scrobe'],
  mesosoma: ['Mesosoma', 'Mesosoma'],
  pronotum: ['Pronoto', 'Pronotum'],
  mesonotum: ['Mesonoto', 'Mesonotum'],
  metanotum: ['Metanoto', 'Metanotum'],
  'metanotal-impression': ['Impressione metanotale', 'Metanotal impression'],
  propodeum: ['Propodeo', 'Propodeum'],
  'propodeal-spine': ['Spina propodeale', 'Propodeal spine'],
  'propodeal-lobe': ['Lobo propodeale', 'Propodeal lobe'],
  'metapleural-gland': ['Orifizio ghiandola metapleurale', 'Orifice of metapleural gland'],
  'apical-spur': ['Sperone apicale della tibia', 'Apical spur of tibia'],
  petiole: ['Peziolo', 'Petiole'],
  postpetiole: ['Postpeziolo', 'Postpetiole'],
  gaster: ['Gastro', 'Gaster'],
  'cloacal-orifice': ['Orifizio cloacale', 'Cloacal orifice'],
  sting: ['Pungiglione', 'Sting'],
};

type ModelKey = 'formica' | 'tetramorium';
interface ModelDef { key: ModelKey; clade: string; genus: string }
const MODEL_DEFS: ModelDef[] = [
  { key: 'formica', clade: 'Formicinae', genus: 'Formica' },
  { key: 'tetramorium', clade: 'Myrmicinae', genus: 'Tetramorium' },
];

interface TermJson { objects: string[]; target: [number, number, number]; direction: [number, number, number]; frame: number }
interface ModelJson { taxon: string; center: [number, number, number]; size: number; terms: Record<string, TermJson>; overlays?: string[] }
interface ModelRec {
  def: ModelDef;
  json: ModelJson;
  root: THREE.Group;
  byName: Map<string, THREE.Mesh>;
  meshes: THREE.Mesh[];
  meshTerm: Map<string, { id: string; score: number }>;
}
type Notice = { kind: 'switched'; from: ModelKey | null; to: ModelKey } | { kind: 'missing' };

export type ViewerLang = 'it' | 'en';

const UI: Record<ViewerLang, {
  model: string; reset: string; loading: string; noWebgl: string; close: string;
  switched: (from: string, to: string) => string; missing: string; thisModel: string;
}> = {
  it: {
    model: 'Modello', reset: 'Ripristina vista', loading: 'Caricamento del modello…',
    noWebgl: 'Modello 3D non disponibile su questo dispositivo.', close: 'Chiudi',
    switched: (from, to) => `Struttura assente in ${from}: mostrata su ${to}`,
    missing: 'Struttura non ancora disponibile nel modello 3D', thisModel: 'questo modello',
  },
  en: {
    model: 'Model', reset: 'Reset view', loading: 'Loading model…',
    noWebgl: '3D model not available on this device.', close: 'Close',
    switched: (from, to) => `Structure absent in ${from}: shown on ${to}`,
    missing: 'Structure not yet available in the 3D model', thisModel: 'this model',
  },
};

interface EngineOpts {
  baseUrl: string;
  onTermChange: (id: string | null) => void;
  onModelChange: (key: ModelKey) => void;
  onNotice: (notice: Notice | null) => void;
  onHover: (hover: { id: string; x: number; y: number } | null) => void;
  onModelsLoaded: (loaded: ModelKey[]) => void;
}

/* ------------------------------------------------------------------ motore */

const GENERIC_TERMS = new Set(['antenna', 'mesosoma', 'gaster']);
const FLY_MS = 1200;
// Draco decoder served from the site itself (public/draco/), so the page's CSP doesn't need third-party hosts.
const DRACO_PATH = '/draco/';
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function slerpDir(a: THREE.Vector3, b: THREE.Vector3, t: number, out: THREE.Vector3): THREE.Vector3 {
  const dot = THREE.MathUtils.clamp(a.dot(b), -1, 1);
  if (dot > 0.9995) return out.copy(a).lerp(b, t).normalize();
  if (dot < -0.9995) {
    const helper = Math.abs(a.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
    const mid = new THREE.Vector3().crossVectors(a, helper).normalize();
    return t < 0.5 ? slerpDir(a, mid, t * 2, out) : slerpDir(mid, b, t * 2 - 1, out);
  }
  const omega = Math.acos(dot);
  const s = Math.sin(omega);
  return out.copy(a).multiplyScalar(Math.sin((1 - t) * omega) / s)
    .addScaledVector(b, Math.sin(t * omega) / s).normalize();
}

interface FlyAnim { t0: number; tgt0: THREE.Vector3; tgt1: THREE.Vector3; dir0: THREE.Vector3; dir1: THREE.Vector3; d0: number; d1: number }

class AnatomyEngine {
  term: string | null = null;
  currentKey: ModelKey | null = null;

  private models: Partial<Record<ModelKey, ModelRec>> = {};
  private loading: Partial<Record<ModelKey, Promise<ModelRec | null>>> = {};
  private anim: FlyAnim | null = null;
  private disposed = false;
  private frameQueued = false;
  private token = 0;
  private shadowTex: THREE.CanvasTexture | null = null;
  private hoverTimer: ReturnType<typeof setTimeout> | undefined;
  private readonly baseUrl: string;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(30, 1, 0.02, 400);
  private readonly controls: OrbitControls;
  private readonly pmrem: THREE.PMREMGenerator;
  private readonly envTex: THREE.Texture;
  private readonly highlightMat: THREE.MeshStandardMaterial;
  private readonly draco: DRACOLoader;
  private readonly gltfLoader: GLTFLoader;
  private readonly raycaster = new THREE.Raycaster();
  private readonly ro: ResizeObserver;
  private ptrDown: { x: number; y: number; t: number } | null = null;

  constructor(private container: HTMLElement, private opts: EngineOpts) {
    this.baseUrl = opts.baseUrl.replace(/\/?$/, '/');
    const renderer = (this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' }));
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:none;outline:none';
    container.appendChild(renderer.domElement);

    this.pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    this.envTex = this.pmrem.fromScene(room, 0.04).texture;
    room.dispose();
    this.scene.environment = this.envTex;
    this.scene.environmentIntensity = 0.9;

    this.scene.add(this.camera);
    const key = new THREE.DirectionalLight(0xffffff, 1.6); // luce solidale alla camera
    key.position.set(-2, 3, 4);
    key.target.position.set(0, 0, -5);
    this.camera.add(key, key.target);

    this.controls = new OrbitControls(this.camera, renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.09;
    this.controls.minDistance = 0.25;
    this.controls.maxDistance = 80;
    this.controls.addEventListener('change', this.invalidate);
    this.controls.addEventListener('start', this.cancelAnim);

    this.highlightMat = new THREE.MeshStandardMaterial({
      color: 0xff1414, emissive: 0xb00000, emissiveIntensity: 0.6, roughness: 0.35,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    });

    this.draco = new DRACOLoader().setDecoderPath(DRACO_PATH);
    this.gltfLoader = new GLTFLoader().setDRACOLoader(this.draco);

    this.ro = new ResizeObserver(this.resize);
    this.ro.observe(container);
    const el = renderer.domElement;
    el.addEventListener('pointerdown', this.onDown);
    el.addEventListener('pointerup', this.onUp);
    el.addEventListener('pointermove', this.onMove);
    el.addEventListener('pointerleave', this.onLeave);
    this.resize();
  }

  /* --- rendering on demand --- */
  private invalidate = (): void => {
    if (this.disposed || this.frameQueued) return;
    this.frameQueued = true;
    requestAnimationFrame(this.frame);
  };

  private frame = (): void => {
    this.frameQueued = false;
    if (this.disposed) return;
    if (this.anim) this.stepAnim();
    this.controls.update(); // emette 'change' finché c'è inerzia
    this.renderer.render(this.scene, this.camera);
    if (this.anim) this.invalidate();
  };

  private resize = (): void => {
    const w = Math.max(1, this.container.clientWidth);
    const h = Math.max(1, this.container.clientHeight);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.invalidate();
  };

  /* --- caricamento --- */
  async init(initialKey: ModelKey = 'formica'): Promise<void> {
    const order = [initialKey, ...MODEL_DEFS.map((d) => d.key).filter((k) => k !== initialKey)];
    const first = await this.ensureModel(order[0]);
    if (this.disposed) return;
    if (first) this.showModel(order[0], true);
    for (const k of order.slice(1)) void this.ensureModel(k).then(() => this.emitLoaded());
    await Promise.all(Object.values(this.loading));
    if (this.disposed) return;
    if (!this.currentKey) {
      const k = MODEL_DEFS.find((d) => this.models[d.key])?.key;
      if (k) this.showModel(k, true);
    }
    this.emitLoaded();
  }

  private emitLoaded(): void {
    if (!this.disposed) this.opts.onModelsLoaded(MODEL_DEFS.map((d) => d.key).filter((k) => this.models[k]));
  }

  private ensureModel(key: ModelKey): Promise<ModelRec | null> {
    if (!this.loading[key]) {
      this.loading[key] = this.loadModel(key).catch((e: unknown) => {
        console.warn(`Modello 3D "${key}" non disponibile`, e);
        return null;
      });
    }
    return this.loading[key]!;
  }

  private async loadModel(key: ModelKey): Promise<ModelRec | null> {
    const def = MODEL_DEFS.find((d) => d.key === key)!;
    const base = `${this.baseUrl}${key}`;
    const jr = await fetch(`${base}.json`);
    if (!jr.ok) throw new Error(`${key}.json: HTTP ${jr.status}`);
    const json = (await jr.json()) as ModelJson;
    // versione alleggerita (~1/4 dei triangoli) su dispositivi touch o schermi stretti
    const preferLite = typeof window !== 'undefined' &&
      (window.matchMedia?.('(pointer: coarse)').matches || window.innerWidth < 820);
    let gltf;
    if (preferLite) {
      try { gltf = await this.gltfLoader.loadAsync(`${base}_lite.glb`); } catch { gltf = undefined; }
    }
    if (!gltf) gltf = await this.gltfLoader.loadAsync(`${base}.glb`);
    const root = gltf.scene;
    if (this.disposed) { this.disposeObject(root); return null; }
    root.visible = false;
    const byName = new Map<string, THREE.Mesh>();
    const meshes: THREE.Mesh[] = [];
    root.traverse((o) => {
      if (!(o as THREE.Mesh).isMesh) return;
      const m = o as THREE.Mesh;
      m.userData.orig = m.material;
      byName.set(m.name, m);
      meshes.push(m);
      if (m.name.startsWith('hl-')) m.visible = false;
    });
    this.scene.add(root);
    root.updateMatrixWorld(true);

    // ombra di contatto
    const box = new THREE.Box3();
    for (const m of meshes) if (!m.name.startsWith('hl-')) box.expandByObject(m);
    const sz = box.getSize(new THREE.Vector3());
    const c = box.getCenter(new THREE.Vector3());
    const R = Math.max(sz.x, sz.z) * 0.85;
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(R * 2, R * 2),
      new THREE.MeshBasicMaterial({ map: this.getShadowTexture(), transparent: true, depthWrite: false, toneMapped: false }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(c.x, box.min.y - sz.y * 0.04, c.z);
    shadow.renderOrder = -1;
    root.add(shadow);

    // mesh -> termine più specifico (i termini compositi hanno priorità minima)
    const meshTerm = new Map<string, { id: string; score: number }>();
    for (const [id, t] of Object.entries(json.terms)) {
      for (const n of t.objects) {
        const cur = meshTerm.get(n);
        const score = (GENERIC_TERMS.has(id) ? 1000 : 0) + t.objects.length;
        if (!cur || score < cur.score) meshTerm.set(n, { id, score });
      }
    }
    const rec: ModelRec = { def, json, root, byName, meshes, meshTerm };
    this.models[key] = rec;
    return rec;
  }

  private getShadowTexture(): THREE.CanvasTexture {
    if (this.shadowTex) return this.shadowTex;
    const cv = document.createElement('canvas');
    cv.width = cv.height = 128;
    const g = cv.getContext('2d')!;
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, 'rgba(30,40,30,0.38)');
    grd.addColorStop(0.45, 'rgba(30,40,30,0.16)');
    grd.addColorStop(1, 'rgba(30,40,30,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.shadowTex = tex;
    return tex;
  }

  hasModel(key: ModelKey): boolean { return !!this.models[key]; }
  private get model(): ModelRec | undefined { return this.currentKey ? this.models[this.currentKey] : undefined; }

  /* --- selezione --- */
  private showModel(key: ModelKey, instant = false): void {
    for (const [k, m] of Object.entries(this.models)) m!.root.visible = k === key;
    const changed = this.currentKey !== key;
    this.currentKey = key;
    if (changed) this.opts.onModelChange(key);
    if (instant) this.flyOverview(true); else this.invalidate();
  }

  /** Cambia modello. Mantiene il termine attivo solo se esiste nel nuovo modello. */
  async setModel(key: ModelKey): Promise<void> {
    if (key === this.currentKey) return;
    const m = await this.ensureModel(key);
    if (!m || this.disposed) return;
    this.token++;
    this.clearHighlight();
    this.showModel(key);
    this.opts.onNotice(null);
    const keep = this.term && m.json.terms[this.term] ? this.term : null;
    if (keep) {
      this.applyHighlight(keep);
      this.flyToTerm(keep);
    } else {
      const had = this.term;
      this.term = null;
      this.flyOverview();
      if (had) this.opts.onTermChange(null);
    }
  }

  /** Seleziona un termine (o null). Se la struttura manca nel modello corrente prova l'altro. */
  async selectTerm(requested: string | null): Promise<void> {
    const tok = ++this.token;
    const prev = this.term;
    let id = requested;
    let notice: Notice | null = null;
    if (id && !this.model?.json.terms[id]) {
      let found: ModelRec | null = null;
      for (const d of MODEL_DEFS) {
        if (d.key === this.currentKey) continue;
        const o = await this.ensureModel(d.key);
        if (tok !== this.token || this.disposed) return;
        if (o?.json.terms[id]) { found = o; break; }
      }
      if (found) {
        notice = { kind: 'switched', from: this.currentKey, to: found.def.key };
        this.clearHighlight();
        this.showModel(found.def.key);
      } else {
        id = null;
        notice = { kind: 'missing' };
      }
    }
    this.opts.onNotice(notice);
    this.clearHighlight();
    this.term = id;
    if (id) { this.applyHighlight(id); this.flyToTerm(id); } else this.flyOverview();
    this.invalidate();
    if (this.term !== prev || requested !== this.term) this.opts.onTermChange(this.term);
  }

  private clearHighlight(): void {
    for (const m of Object.values(this.models)) {
      for (const o of m!.meshes) {
        o.material = o.userData.orig as THREE.Material | THREE.Material[];
        if (o.name.startsWith('hl-')) o.visible = false;
      }
    }
    this.invalidate();
  }

  private applyHighlight(id: string): void {
    const m = this.model;
    const t = m?.json.terms[id];
    if (!m || !t) return;
    for (const n of t.objects) {
      const o = m.byName.get(n);
      if (!o) continue;
      o.material = this.highlightMat;
      o.visible = true;
    }
    this.invalidate();
  }

  /* --- camera --- */
  private fitDistance(frame: number): number {
    const tv = Math.tan(THREE.MathUtils.degToRad(this.camera.fov) / 2);
    return (frame / (2 * tv * Math.min(1, this.camera.aspect))) * 1.25;
  }

  private flyToTerm(id: string): void {
    const t = this.model!.json.terms[id];
    this.flyTo(new THREE.Vector3(...t.target), new THREE.Vector3(...t.direction).normalize(), t.frame);
  }

  private flyOverview(instant = false): void {
    const m = this.model;
    if (!m) return;
    this.flyTo(new THREE.Vector3(...m.json.center), new THREE.Vector3(0.35, 0.45, 1).normalize(), m.json.size * 0.75, instant);
  }

  private flyTo(target: THREE.Vector3, dir: THREE.Vector3, frame: number, instant = false): void {
    const dist = this.fitDistance(frame);
    if (instant) {
      this.anim = null;
      this.controls.target.copy(target);
      this.camera.position.copy(target).addScaledVector(dir, dist);
      this.camera.lookAt(target);
      this.controls.update();
      this.invalidate();
      return;
    }
    const off = this.camera.position.clone().sub(this.controls.target);
    const d0 = Math.max(off.length(), 1e-3);
    this.anim = {
      t0: performance.now(), tgt0: this.controls.target.clone(), tgt1: target,
      dir0: off.divideScalar(d0), dir1: dir, d0, d1: dist,
    };
    this.invalidate();
  }

  private stepAnim(): void {
    const a = this.anim!;
    const k = Math.min(1, (performance.now() - a.t0) / FLY_MS);
    const e = easeInOutCubic(k);
    const dir = slerpDir(a.dir0, a.dir1, e, new THREE.Vector3());
    const tgt = a.tgt0.clone().lerp(a.tgt1, e);
    this.controls.target.copy(tgt);
    this.camera.position.copy(tgt).addScaledVector(dir, a.d0 + (a.d1 - a.d0) * e);
    this.camera.lookAt(tgt);
    if (k >= 1) this.anim = null;
  }

  private cancelAnim = (): void => { this.anim = null; };

  resetView(): void {
    if (this.term && this.model?.json.terms[this.term]) this.flyToTerm(this.term);
    else this.flyOverview();
  }

  /* --- puntatore --- */
  private onDown = (e: PointerEvent): void => {
    this.ptrDown = { x: e.clientX, y: e.clientY, t: performance.now() };
    this.opts.onHover(null);
  };

  private onUp = (e: PointerEvent): void => {
    const d = this.ptrDown;
    this.ptrDown = null;
    if (!d) return;
    if (Math.hypot(e.clientX - d.x, e.clientY - d.y) < 5 && performance.now() - d.t < 600) {
      const id = this.pick(e.clientX, e.clientY);
      if (id) void this.selectTerm(id === this.term ? null : id);
    }
  };

  private onMove = (e: PointerEvent): void => {
    if (e.buttons || e.pointerType === 'touch') return;
    clearTimeout(this.hoverTimer);
    const { clientX: x, clientY: y } = e;
    this.hoverTimer = setTimeout(() => {
      if (this.disposed) return;
      const id = this.pick(x, y);
      this.renderer.domElement.style.cursor = id ? 'pointer' : '';
      const r = this.container.getBoundingClientRect();
      this.opts.onHover(id ? { id, x: x - r.left, y: y - r.top } : null);
    }, 70);
  };

  private onLeave = (): void => {
    clearTimeout(this.hoverTimer);
    this.opts.onHover(null);
  };

  private pick(cx: number, cy: number): string | null {
    const m = this.model;
    if (!m || this.anim) return null;
    const r = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera);
    const hit = this.raycaster.intersectObjects(m.meshes.filter((o) => o.visible), false)[0];
    return hit ? m.meshTerm.get(hit.object.name)?.id ?? null : null;
  }

  /* --- pulizia --- */
  private disposeObject(root: THREE.Object3D): void {
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
      const mats: THREE.Material[] = [];
      const orig = m.userData?.orig as THREE.Material | THREE.Material[] | undefined;
      for (const x of [orig, m.material]) if (x) mats.push(...(Array.isArray(x) ? x : [x]));
      for (const mt of new Set(mats)) {
        for (const v of Object.values(mt)) if (v instanceof THREE.Texture) v.dispose();
        mt.dispose();
      }
    });
  }

  dispose(): void {
    this.disposed = true;
    clearTimeout(this.hoverTimer);
    this.ro.disconnect();
    this.controls.dispose();
    const el = this.renderer.domElement;
    el.removeEventListener('pointerdown', this.onDown);
    el.removeEventListener('pointerup', this.onUp);
    el.removeEventListener('pointermove', this.onMove);
    el.removeEventListener('pointerleave', this.onLeave);
    this.disposeObject(this.scene);
    this.highlightMat.dispose();
    this.shadowTex?.dispose();
    this.envTex.dispose();
    this.pmrem.dispose();
    this.draco.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    el.remove();
  }
}

/* ------------------------------------------------------------------ componente */

export interface AnatomyViewer3DProps {
  /** id del termine evidenziato (null = nessuno) */
  activeTerm: string | null;
  /** chiamato quando la selezione cambia dal viewer (click sul modello, cambio modello, struttura assente) */
  onTermChange?: (id: string | null) => void;
  /** cartella (o URL) che contiene formica.glb/.json e tetramorium.glb/.json */
  modelBaseUrl: string;
  /** lingua dell'interfaccia (default 'it') */
  lang?: ViewerLang;
  className?: string;
}

export default function AnatomyViewer3D({ activeTerm, onTermChange, modelBaseUrl, lang = 'it', className }: AnatomyViewer3DProps) {
  const ui = UI[lang] ?? UI.it;
  const li = lang === 'en' ? 1 : 0; // index into TERM_NAMES: [italiano, english]
  const stageRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<AnatomyEngine | null>(null);
  const readyRef = useRef(false);
  const activeRef = useRef(activeTerm);
  const cbRef = useRef(onTermChange);
  activeRef.current = activeTerm;
  cbRef.current = onTermChange;

  const [modelKey, setModelKey] = useState<ModelKey | null>(null);
  const [loaded, setLoaded] = useState<ModelKey[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [notice, setNotice] = useState<Notice | null>(null);
  const [hover, setHover] = useState<{ id: string; x: number; y: number } | null>(null);
  const [shownTerm, setShownTerm] = useState<string | null>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let engine: AnatomyEngine;
    try {
      engine = new AnatomyEngine(stage, {
        baseUrl: modelBaseUrl,
        onModelChange: setModelKey,
        onModelsLoaded: setLoaded,
        onNotice: setNotice,
        onHover: setHover,
        onTermChange: (id) => { setShownTerm(id); cbRef.current?.(id); },
      });
    } catch (e) {
      console.error('WebGL non disponibile', e);
      setStatus('error');
      return;
    }
    engineRef.current = engine;
    readyRef.current = false;
    let cancelled = false;
    void engine.init().then(() => {
      if (cancelled) return;
      if (!engine.currentKey) { setStatus('error'); return; }
      readyRef.current = true;
      setStatus('ready');
      if (activeRef.current) void engine.selectTerm(activeRef.current);
    });
    return () => {
      cancelled = true;
      readyRef.current = false;
      engineRef.current = null;
      engine.dispose();
    };
  }, [modelBaseUrl]);

  // activeTerm (controllato dal genitore) -> viewer
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || !readyRef.current) return;
    if (engine.term !== activeTerm) void engine.selectTerm(activeTerm);
  }, [activeTerm]);

  useEffect(() => {
    setShownTerm(activeTerm);
  }, [activeTerm]);

  // l'avviso scompare da solo
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 8000);
    return () => clearTimeout(t);
  }, [notice]);

  const names = shownTerm ? TERM_NAMES[shownTerm] : undefined;
  const clade = (k: ModelKey | null) => MODEL_DEFS.find((d) => d.key === k)?.clade ?? ui.thisModel;
  const noticeText = !notice ? null
    : notice.kind === 'switched' ? ui.switched(clade(notice.from), clade(notice.to)) : ui.missing;

  return (
    <div className={className}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div role="group" aria-label={ui.model} className="inline-flex overflow-hidden rounded-full border border-[#2f6b3a] bg-white">
          {MODEL_DEFS.map((d) => (
            <button
              key={d.key}
              type="button"
              disabled={!loaded.includes(d.key)}
              aria-pressed={modelKey === d.key}
              onClick={() => void engineRef.current?.setModel(d.key)}
              className={`px-3.5 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40 ${
                modelKey === d.key ? 'bg-[#2f6b3a] text-white' : 'text-[#2f6b3a]'
              }`}
            >
              {d.clade}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => engineRef.current?.resetView()}
          className="rounded-full border border-stone-300 bg-white px-3.5 py-2 text-sm hover:border-[#2f6b3a] hover:text-[#2f6b3a]"
        >
          {ui.reset}
        </button>
      </div>

      <div
        className="relative h-[60vh] min-h-[320px] overflow-hidden rounded-2xl border border-stone-300 lg:h-[72vh] lg:max-h-[720px]"
        style={{ background: 'radial-gradient(ellipse at 50% 40%, #fff 0%, #f1efe6 70%, #e7e4d6 100%)' }}
      >
        <div ref={stageRef} className="absolute inset-0" />
        {status === 'loading' && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center text-stone-500">{ui.loading}</div>
        )}
        {status === 'error' && (
          <div className="absolute inset-0 grid place-items-center p-6 text-center text-stone-500">{ui.noWebgl}</div>
        )}
        {names && (
          <div className="pointer-events-none absolute left-3 top-3 flex flex-col rounded-lg border border-stone-300 border-l-4 border-l-[#2f6b3a] bg-white/90 px-3 py-1.5 leading-tight backdrop-blur">
            <strong className="text-base text-[#1f4a28]">{names[li]}</strong>
            <span className="text-xs italic text-stone-500">{names[1 - li]}</span>
          </div>
        )}
        {hover && (
          <div
            className="pointer-events-none absolute whitespace-nowrap rounded-md bg-stone-900/90 px-2 py-1 text-xs text-white"
            style={{ left: hover.x + 12, top: hover.y + 12 }}
          >
            {TERM_NAMES[hover.id]?.[li] ?? hover.id}
          </div>
        )}
        {noticeText && (
          <div role="status" className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            <span>{noticeText}</span>
            <button type="button" aria-label={ui.close} className="text-xl leading-none" onClick={() => setNotice(null)}>×</button>
          </div>
        )}
      </div>
    </div>
  );
}
