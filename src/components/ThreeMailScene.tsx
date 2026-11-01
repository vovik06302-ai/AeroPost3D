// @ts-nocheck
import { useRef, useEffect } from "react";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import {
  Vector3,
  CanvasTexture,
  SRGBColorSpace,
  WebGLRenderer,
  Scene,
  FogExp2,
  PMREMGenerator,
  PerspectiveCamera,
  HemisphereLight,
  DirectionalLight,
  MeshBasicMaterial,
  Mesh,
  PlaneGeometry,
  Group,
  MeshPhysicalMaterial,
  Shape,
  ExtrudeGeometry,
  MeshStandardMaterial,
  BoxGeometry,
  LatheGeometry,
  Vector2,
  TorusGeometry,
  TubeGeometry,
  CatmullRomCurve3,
  Raycaster,
  MathUtils
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

var _vec3A = new Vector3();
var _BezierP0 = new Vector3();
var _BezierP1 = new Vector3();
var _BezierP2 = new Vector3();
function createWindowsDesktopWallpaperTexture() {
	const canvas = document.createElement("canvas");
	canvas.width = 1024;
	canvas.height = 512;
	const ctx = canvas.getContext("2d");
	const bgGrad = ctx.createLinearGradient(0, 0, 1024, 512);
	bgGrad.addColorStop(0, "#051026");
	bgGrad.addColorStop(.45, "#0B2149");
	bgGrad.addColorStop(.78, "#0F3468");
	bgGrad.addColorStop(1, "#06132C");
	ctx.fillStyle = bgGrad;
	ctx.fillRect(0, 0, 1024, 512);
	const bloom1 = ctx.createRadialGradient(540, 240, 20, 540, 240, 340);
	bloom1.addColorStop(0, "rgba(56, 189, 248, 0.28)");
	bloom1.addColorStop(.45, "rgba(37, 99, 235, 0.16)");
	bloom1.addColorStop(1, "rgba(5, 16, 38, 0)");
	ctx.fillStyle = bloom1;
	ctx.fillRect(0, 0, 1024, 512);
	const bloom2 = ctx.createRadialGradient(380, 310, 10, 380, 310, 260);
	bloom2.addColorStop(0, "rgba(99, 102, 241, 0.22)");
	bloom2.addColorStop(.6, "rgba(14, 165, 233, 0.08)");
	bloom2.addColorStop(1, "rgba(5, 16, 38, 0)");
	ctx.fillStyle = bloom2;
	ctx.fillRect(0, 0, 1024, 512);
	const tex = new CanvasTexture(canvas);
	tex.colorSpace = SRGBColorSpace;
	tex.needsUpdate = true;
	return tex;
}
function createLinenPaperTexture(maxAnisotropy, finish) {
	const canvas = document.createElement("canvas");
	canvas.width = 512;
	canvas.height = 512;
	const ctx = canvas.getContext("2d");
	ctx.fillStyle = {
		royal_linen: "#FBF8F1",
		obsidian_gold: "#1C2433",
		airmail_classic: "#F4F6F9"
	}[finish];
	ctx.fillRect(0, 0, 512, 512);
	ctx.strokeStyle = finish === "obsidian_gold" ? "rgba(255, 255, 255, 0.035)" : "rgba(120, 100, 75, 0.05)";
	ctx.lineWidth = 1;
	for (let i = 0; i < 512; i += 4) {
		ctx.beginPath();
		ctx.moveTo(0, i);
		ctx.lineTo(512, i);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(i, 0);
		ctx.lineTo(i, 512);
		ctx.stroke();
	}
	const borderMargin = 18;
	if (finish === "airmail_classic") {
		const stripeW = 24;
		for (let i = 0; i < 512; i += 48) {
			ctx.fillStyle = "#DC2626";
			ctx.fillRect(i, 0, stripeW, borderMargin);
			ctx.fillRect(i, 494, stripeW, borderMargin);
			ctx.fillStyle = "#2563EB";
			ctx.fillRect(i + stripeW, 0, stripeW, borderMargin);
			ctx.fillRect(i + stripeW, 494, stripeW, borderMargin);
		}
	} else {
		ctx.strokeStyle = finish === "obsidian_gold" ? "#F59E0B" : "rgba(180, 130, 50, 0.45)";
		ctx.lineWidth = 4;
		ctx.strokeRect(16, 16, 480, 480);
	}
	const texture = new CanvasTexture(canvas);
	texture.colorSpace = SRGBColorSpace;
	texture.anisotropy = maxAnisotropy;
	texture.needsUpdate = true;
	return texture;
}
function drawPerforatedStamp(ctx, x, y, w, h, bgColor, accentColor, topLabel, priceLabel, bottomLabel) {
	ctx.save();
	ctx.fillStyle = "rgba(15, 23, 42, 0.22)";
	ctx.fillRect(x + 3, y + 4, w, h);
	ctx.fillStyle = "#FFFFFF";
	ctx.fillRect(x, y, w, h);
	ctx.fillStyle = bgColor;
	const step = 14;
	const r = 4.2;
	for (let px = x + step / 2; px < x + w; px += step) {
		ctx.beginPath();
		ctx.arc(px, y, r, 0, Math.PI * 2);
		ctx.fill();
		ctx.beginPath();
		ctx.arc(px, y + h, r, 0, Math.PI * 2);
		ctx.fill();
	}
	for (let py = y + step / 2; py < y + h; py += step) {
		ctx.beginPath();
		ctx.arc(x, py, r, 0, Math.PI * 2);
		ctx.fill();
		ctx.beginPath();
		ctx.arc(x + w, py, r, 0, Math.PI * 2);
		ctx.fill();
	}
	const pad = 10;
	const grad = ctx.createLinearGradient(x, y, x + w, y + h);
	grad.addColorStop(0, accentColor);
	grad.addColorStop(1, "#0F172A");
	ctx.fillStyle = grad;
	ctx.fillRect(x + pad, y + pad, w - 20, h - 20);
	ctx.strokeStyle = "rgba(255,255,255,0.65)";
	ctx.lineWidth = 1.5;
	ctx.strokeRect(x + pad + 4, y + pad + 4, w - 20 - 8, h - 20 - 8);
	ctx.fillStyle = "#FFFFFF";
	ctx.font = "700 13px 'JetBrains Mono', monospace";
	ctx.fillText(topLabel, x + pad + 8, y + pad + 20);
	ctx.strokeStyle = "rgba(255,255,255,0.35)";
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.arc(x + w / 2, y + h / 2 + 2, 24, 0, Math.PI * 2);
	ctx.stroke();
	ctx.fillStyle = "#FDE047";
	ctx.font = "800 22px 'Outfit', sans-serif";
	ctx.fillText(priceLabel, x + pad + 10, y + h - pad - 24);
	ctx.fillStyle = "#E2E8F0";
	ctx.font = "600 11px 'JetBrains Mono', monospace";
	ctx.fillText(bottomLabel, x + pad + 10, y + h - pad - 8);
	ctx.restore();
}
function createEnvelopeFrontPostalTexture(maxAnisotropy, info, finish) {
	const canvas = document.createElement("canvas");
	canvas.width = 1024;
	canvas.height = 640;
	const ctx = canvas.getContext("2d");
	const isDark = finish === "obsidian_gold";
	const paperBg = isDark ? "#172033" : finish === "airmail_classic" ? "#F8FAFC" : "#FCF9F2";
	ctx.fillStyle = paperBg;
	ctx.fillRect(0, 0, 1024, 640);
	ctx.strokeStyle = isDark ? "rgba(255,255,255,0.03)" : "rgba(120, 95, 60, 0.045)";
	ctx.lineWidth = 1;
	for (let y = 0; y < 640; y += 5) {
		ctx.beginPath();
		ctx.moveTo(0, y);
		ctx.lineTo(1024, y);
		ctx.stroke();
	}
	const borderT = 18;
	const seg = 38;
	for (let i = -640; i < 1664; i += 76) {
		ctx.fillStyle = isDark ? "#F59E0B" : "#DC2626";
		ctx.beginPath();
		ctx.moveTo(i, 0);
		ctx.lineTo(i + seg, 0);
		ctx.lineTo(i + seg - 14, borderT);
		ctx.lineTo(i - 14, borderT);
		ctx.closePath();
		ctx.fill();
		ctx.beginPath();
		ctx.moveTo(i, 622);
		ctx.lineTo(i + seg, 622);
		ctx.lineTo(i + seg - 14, 640);
		ctx.lineTo(i - 14, 640);
		ctx.closePath();
		ctx.fill();
		ctx.fillStyle = isDark ? "#38BDF8" : "#1D4ED8";
		ctx.beginPath();
		ctx.moveTo(i + seg, 0);
		ctx.lineTo(i + 76, 0);
		ctx.lineTo(i + 76 - 14, borderT);
		ctx.lineTo(i + seg - 14, borderT);
		ctx.closePath();
		ctx.fill();
		ctx.beginPath();
		ctx.moveTo(i + seg, 622);
		ctx.lineTo(i + 76, 622);
		ctx.lineTo(i + 76 - 14, 640);
		ctx.lineTo(i + seg - 14, 640);
		ctx.closePath();
		ctx.fill();
	}
	for (let y = 0; y < 640; y += 76) {
		ctx.fillStyle = isDark ? "#F59E0B" : "#DC2626";
		ctx.fillRect(0, y, borderT, seg * .85);
		ctx.fillRect(1006, y, borderT, seg * .85);
		ctx.fillStyle = isDark ? "#38BDF8" : "#1D4ED8";
		ctx.fillRect(0, y + seg, borderT, seg * .85);
		ctx.fillRect(1006, y + seg, borderT, seg * .85);
	}
	ctx.strokeStyle = isDark ? "rgba(245, 158, 11, 0.35)" : "rgba(100, 116, 139, 0.28)";
	ctx.lineWidth = 2;
	ctx.strokeRect(30, 30, 964, 580);
	const srvColor = info.accentColor || "#EA4335";
	ctx.fillStyle = srvColor;
	ctx.beginPath();
	ctx.roundRect(52, 48, 535, 50, 10);
	ctx.fill();
	ctx.fillStyle = "#FFFFFF";
	ctx.font = "800 22px 'JetBrains Mono', monospace";
	ctx.fillText(`СЕРВИС: ${info.serverName.toUpperCase().slice(0, 32)}`, 70, 81);
	ctx.fillStyle = isDark ? "#38BDF8" : "#1D4ED8";
	ctx.font = "700 15px 'JetBrains Mono', monospace";
	ctx.fillText("PAR AVION · АВИАПОЧТА · МГНОВЕННАЯ ДОСТАВКА", 54, 124);
	ctx.fillStyle = isDark ? "#94A3B8" : "#475569";
	ctx.font = "700 20px 'Plus Jakarta Sans', sans-serif";
	ctx.fillText("ОТ КОГО ПИСЬМО:", 54, 166);
	ctx.fillStyle = isDark ? "#FFFFFF" : "#0F172A";
	ctx.font = "800 38px 'Outfit', sans-serif";
	ctx.fillText(info.senderName.slice(0, 28), 54, 212);
	ctx.fillStyle = srvColor;
	ctx.font = "700 24px 'JetBrains Mono', monospace";
	ctx.fillText(`<${info.senderEmail.slice(0, 38)}>`, 54, 248);
	ctx.strokeStyle = isDark ? "rgba(148, 163, 184, 0.3)" : "rgba(15, 23, 42, 0.18)";
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.moveTo(54, 268);
	ctx.lineTo(590, 268);
	ctx.stroke();
	drawPerforatedStamp(ctx, 650, 46, 142, 172, paperBg, "#B91C1C", "АВИАПОЧТА", "100 ₽", "AEROPOST");
	drawPerforatedStamp(ctx, 812, 46, 142, 172, paperBg, srvColor, "ЭКСПРЕСС", "50 ₽", info.serverName.split(" ")[0].toUpperCase().slice(0, 10));
	ctx.save();
	const pmX = 685;
	const pmY = 185;
	ctx.strokeStyle = isDark ? "rgba(248, 250, 252, 0.72)" : "rgba(30, 41, 59, 0.72)";
	ctx.lineWidth = 3;
	ctx.beginPath();
	ctx.arc(pmX, pmY, 52, 0, Math.PI * 2);
	ctx.stroke();
	ctx.lineWidth = 1.5;
	ctx.beginPath();
	ctx.arc(pmX, pmY, 44, 0, Math.PI * 2);
	ctx.stroke();
	ctx.fillStyle = isDark ? "rgba(248, 250, 252, 0.82)" : "rgba(30, 41, 59, 0.82)";
	ctx.font = "700 13px 'JetBrains Mono', monospace";
	ctx.fillText("ПОЧТА WINDOWS", 641, 175);
	ctx.fillText("ДОСТАВЛЕНО", 647, 193);
	ctx.fillText("2026 · TLS 1.3", 645, 209);
	ctx.lineWidth = 2.5;
	for (let wy = 157; wy <= 213; wy += 14) {
		ctx.beginPath();
		ctx.moveTo(741, wy);
		for (let wx = 741; wx < 955; wx += 28) {
			ctx.quadraticCurveTo(wx + 7, wy - 7, wx + 14, wy);
			ctx.quadraticCurveTo(wx + 21, wy + 7, wx + 28, wy);
		}
		ctx.stroke();
	}
	ctx.restore();
	ctx.fillStyle = isDark ? "rgba(15, 23, 42, 0.55)" : "rgba(241, 245, 249, 0.85)";
	ctx.beginPath();
	ctx.roundRect(54, 300, 916, 225, 14);
	ctx.fill();
	ctx.strokeStyle = isDark ? "rgba(56, 189, 248, 0.35)" : "rgba(148, 163, 184, 0.45)";
	ctx.lineWidth = 2;
	ctx.stroke();
	ctx.fillStyle = isDark ? "#94A3B8" : "#475569";
	ctx.font = "700 20px 'JetBrains Mono', monospace";
	ctx.fillText("ТЕМА ВХОДЯЩЕГО ПИСЬМА:", 80, 344);
	ctx.fillStyle = isDark ? "#F8FAFC" : "#0F172A";
	ctx.font = "800 33px 'Plus Jakarta Sans', sans-serif";
	const subj = info.subject || "Новое входящее сообщение";
	ctx.fillText(subj.slice(0, 44), 80, 392);
	if (subj.length > 44) ctx.fillText(subj.slice(44, 88), 80, 434);
	ctx.fillStyle = isDark ? "#F59E0B" : "#0284C7";
	ctx.font = "700 22px 'Plus Jakarta Sans', sans-serif";
	ctx.fillText("Нажмите на конверт, чтобы открыть и прочитать письмо →", 80, 495);
	ctx.fillStyle = isDark ? "#F59E0B" : "#334155";
	for (let bx = 740; bx < 950; bx += 8) {
		const bh = bx % 16 === 0 ? 28 : 16;
		ctx.fillRect(bx, 565 - bh, 4, bh);
	}
	const texture = new CanvasTexture(canvas);
	texture.colorSpace = SRGBColorSpace;
	texture.anisotropy = maxAnisotropy;
	texture.needsUpdate = true;
	return texture;
}
function createLetterCardTexture(maxAnisotropy, info) {
	const canvas = document.createElement("canvas");
	canvas.width = 1024;
	canvas.height = 640;
	const ctx = canvas.getContext("2d");
	ctx.fillStyle = "#FFFDF9";
	ctx.fillRect(0, 0, 1024, 640);
	ctx.fillStyle = info.accentColor || "#F59E0B";
	ctx.fillRect(0, 0, 1024, 24);
	ctx.strokeStyle = "rgba(180, 135, 70, 0.4)";
	ctx.lineWidth = 3;
	ctx.strokeRect(32, 42, 960, 566);
	ctx.fillStyle = "#64748B";
	ctx.font = "600 22px 'JetBrains Mono', monospace";
	ctx.fillText(`СЕРВИС: ${info.serverName.toUpperCase()}`, 64, 105);
	ctx.fillStyle = "#0F172A";
	ctx.font = "700 44px 'Outfit', sans-serif";
	ctx.fillText(`От: ${info.senderName.slice(0, 32)}`, 64, 175);
	ctx.fillStyle = "#475569";
	ctx.font = "500 26px 'Plus Jakarta Sans', sans-serif";
	ctx.fillText(info.senderEmail.slice(0, 46), 64, 220);
	ctx.strokeStyle = "#E2E8F0";
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.moveTo(64, 252);
	ctx.lineTo(960, 252);
	ctx.stroke();
	ctx.fillStyle = "#1E293B";
	ctx.font = "700 34px 'Plus Jakarta Sans', sans-serif";
	const subjectText = info.subject || "Новое сообщение";
	ctx.fillText(subjectText.slice(0, 42), 64, 310);
	if (subjectText.length > 42) ctx.fillText(subjectText.slice(42, 84), 64, 352);
	if (info.bodyPreview) {
		ctx.fillStyle = "#334155";
		ctx.font = "500 24px 'Plus Jakarta Sans', sans-serif";
		ctx.fillText(info.bodyPreview.slice(0, 52), 64, 402);
	}
	if (info.jumboEmojis && info.jumboEmojis.length > 0) {
		ctx.font = "82px 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif";
		ctx.fillText(info.jumboEmojis.slice(0, 8).join(" "), 64, 525);
	} else {
		ctx.fillStyle = "#0284C7";
		ctx.font = "600 24px 'Plus Jakarta Sans', sans-serif";
		ctx.fillText("Корреспонденция AeroPost 3D", 64, 495);
	}
	const texture = new CanvasTexture(canvas);
	texture.colorSpace = SRGBColorSpace;
	texture.anisotropy = maxAnisotropy;
	texture.needsUpdate = true;
	return texture;
}
function createContactShadowTexture() {
	const canvas = document.createElement("canvas");
	canvas.width = 256;
	canvas.height = 256;
	const ctx = canvas.getContext("2d");
	const grad = ctx.createRadialGradient(128, 128, 12, 128, 128, 120);
	grad.addColorStop(0, "rgba(0, 0, 0, 0.55)");
	grad.addColorStop(.55, "rgba(0, 0, 0, 0.22)");
	grad.addColorStop(1, "rgba(0, 0, 0, 0.0)");
	ctx.fillStyle = grad;
	ctx.fillRect(0, 0, 256, 256);
	const tex = new CanvasTexture(canvas);
	tex.needsUpdate = true;
	return tex;
}
var ThreeMailScene = ({ cameraPreset, envelopeFinish, flapOpenAmount, flightTrigger, outgoingTrigger = 0, envelopeVisible, activeEnvelope, onEnvelopeClick, onOutgoingComplete }) => {
	const canvasMountRef = useRef(null);
	const stateRef = useRef({
		cameraPreset,
		envelopeFinish,
		flapOpenAmount,
		flightTrigger,
		outgoingTrigger,
		envelopeVisible,
		lastFlightTrigger: flightTrigger,
		lastOutgoingTrigger: outgoingTrigger,
		flightProgress: 0,
		outgoingActive: false,
		outgoingProgress: 0,
		currentFlapOpen: flapOpenAmount,
		currentLetterRise: 0,
		isHovered: false,
		onEnvelopeClick,
		onOutgoingComplete
	});
	const sceneObjectsRef = useRef({
		paperMaterials: [],
		frontPostalMesh: null,
		letterCardMesh: null,
		sealRingMat: null,
		maxAnisotropy: 1
	});
	useEffect(() => {
		stateRef.current.cameraPreset = cameraPreset;
		stateRef.current.flapOpenAmount = flapOpenAmount;
		stateRef.current.envelopeVisible = envelopeVisible;
		stateRef.current.onEnvelopeClick = onEnvelopeClick;
		stateRef.current.onOutgoingComplete = onOutgoingComplete;
	}, [
		cameraPreset,
		flapOpenAmount,
		envelopeVisible,
		onEnvelopeClick,
		onOutgoingComplete
	]);
	useEffect(() => {
		stateRef.current.envelopeFinish = envelopeFinish;
		const { paperMaterials, frontPostalMesh, maxAnisotropy } = sceneObjectsRef.current;
		if (paperMaterials.length > 0) {
			const newTex = createLinenPaperTexture(maxAnisotropy, envelopeFinish);
			paperMaterials.forEach((mat) => {
				if (mat.map) mat.map.dispose();
				mat.map = newTex;
				mat.roughness = envelopeFinish === "obsidian_gold" ? .32 : .58;
				mat.metalness = envelopeFinish === "obsidian_gold" ? .25 : .04;
				mat.needsUpdate = true;
			});
		}
		if (frontPostalMesh) {
			const mat = frontPostalMesh.material;
			const newFrontTex = createEnvelopeFrontPostalTexture(maxAnisotropy, activeEnvelope, envelopeFinish);
			if (mat.map) mat.map.dispose();
			mat.map = newFrontTex;
			mat.needsUpdate = true;
		}
	}, [envelopeFinish, activeEnvelope]);
	useEffect(() => {
		if (flightTrigger !== stateRef.current.lastFlightTrigger) {
			stateRef.current.lastFlightTrigger = flightTrigger;
			stateRef.current.outgoingActive = false;
			stateRef.current.flightProgress = 0;
			stateRef.current.currentFlapOpen = .02;
			stateRef.current.currentLetterRise = 0;
		}
		if (outgoingTrigger !== stateRef.current.lastOutgoingTrigger && outgoingTrigger > 0) {
			stateRef.current.lastOutgoingTrigger = outgoingTrigger;
			stateRef.current.outgoingActive = true;
			stateRef.current.outgoingProgress = 0;
			stateRef.current.flightProgress = 1;
			stateRef.current.currentFlapOpen = 1;
		}
		const { frontPostalMesh, letterCardMesh, sealRingMat, maxAnisotropy } = sceneObjectsRef.current;
		if (frontPostalMesh) {
			const mat = frontPostalMesh.material;
			const newFrontTex = createEnvelopeFrontPostalTexture(maxAnisotropy, activeEnvelope, stateRef.current.envelopeFinish);
			if (mat.map) mat.map.dispose();
			mat.map = newFrontTex;
			mat.needsUpdate = true;
		}
		if (letterCardMesh) {
			const mat = letterCardMesh.material;
			const newCardTex = createLetterCardTexture(maxAnisotropy, activeEnvelope);
			if (mat.map) mat.map.dispose();
			mat.map = newCardTex;
			mat.needsUpdate = true;
		}
		if (sealRingMat && activeEnvelope.accentColor) sealRingMat.emissive.set(activeEnvelope.accentColor);
	}, [
		flightTrigger,
		outgoingTrigger,
		activeEnvelope
	]);
	useEffect(() => {
		const container = canvasMountRef.current;
		if (!container) return;
		const isSoftwareGl = (() => {
			const gl = document.createElement("canvas").getContext("webgl2");
			if (!gl) return true;
			const ext = gl.getExtension("WEBGL_debug_renderer_info");
			const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
			const gpu = String(gl.getParameter(param));
			gl.getExtension("WEBGL_lose_context")?.loseContext();
			return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
		})();
		const renderer = new WebGLRenderer({
			antialias: !isSoftwareGl,
			powerPreference: "high-performance"
		});
		renderer.outputColorSpace = SRGBColorSpace;
		renderer.toneMapping = 4;
		renderer.toneMappingExposure = 1.15;
		renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
		renderer.setSize(container.clientWidth, container.clientHeight);
		renderer.shadowMap.enabled = !isSoftwareGl;
		renderer.shadowMap.type = 1;
		container.innerHTML = "";
		container.appendChild(renderer.domElement);
		const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
		sceneObjectsRef.current.maxAnisotropy = maxAnisotropy;
		const scene = new Scene();
		const wallpaperTex = createWindowsDesktopWallpaperTexture();
		scene.background = wallpaperTex;
		scene.fog = new FogExp2(531259, .025);
		const pmremGenerator = new PMREMGenerator(renderer);
		const envTexture = pmremGenerator.fromScene(new RoomEnvironment(), .04).texture;
		scene.environment = envTexture;
		pmremGenerator.dispose();
		const camera = new PerspectiveCamera(38, container.clientWidth / container.clientHeight, .1, 100);
		camera.position.set(0, 1.35, 5.2);
		const controls = new OrbitControls(camera, renderer.domElement);
		controls.enableDamping = !isSoftwareGl;
		controls.dampingFactor = .06;
		controls.maxPolarAngle = Math.PI * .58;
		controls.minDistance = 2.6;
		controls.maxDistance = 10;
		controls.target.set(0, 1.05, 0);
		let userInteractingWithCamera = false;
		controls.addEventListener("start", () => {
			userInteractingWithCamera = true;
		});
		const hemiLight = new HemisphereLight(12248829, 988970, .95);
		hemiLight.position.set(0, 15, 0);
		scene.add(hemiLight);
		const keyLight = new DirectionalLight(16774368, 2.5);
		keyLight.position.set(4.5, 8.5, 6.5);
		keyLight.castShadow = !isSoftwareGl;
		keyLight.shadow.mapSize.width = 1024;
		keyLight.shadow.mapSize.height = 1024;
		const d = 4.5;
		keyLight.shadow.camera.left = -4.5;
		keyLight.shadow.camera.right = d;
		keyLight.shadow.camera.top = d;
		keyLight.shadow.camera.bottom = -4.5;
		keyLight.shadow.bias = -5e-4;
		keyLight.shadow.normalBias = .02;
		scene.add(keyLight);
		const rimLight = new DirectionalLight(3718648, 1.4);
		rimLight.position.set(-5.5, 4, -4.5);
		scene.add(rimLight);
		const contactShadowMat = new MeshBasicMaterial({
			map: createContactShadowTexture(),
			transparent: true,
			depthWrite: false,
			opacity: .48
		});
		const contactShadowPlane = new Mesh(new PlaneGeometry(4.2, 2.6), contactShadowMat);
		contactShadowPlane.rotation.x = -Math.PI / 2;
		contactShadowPlane.position.set(0, .01, 0);
		scene.add(contactShadowPlane);
		const envelopeGroup = new Group();
		envelopeGroup.position.set(0, 1.05, 0);
		scene.add(envelopeGroup);
		const initialPaperTex = createLinenPaperTexture(maxAnisotropy, stateRef.current.envelopeFinish);
		const paperPrimaryMat = new MeshPhysicalMaterial({
			map: initialPaperTex,
			roughness: .58,
			metalness: .04,
			clearcoat: .14
		});
		const paperSecondaryMat = new MeshPhysicalMaterial({
			map: initialPaperTex,
			roughness: .32,
			metalness: .08,
			clearcoat: .24
		});
		const brassMat = new MeshPhysicalMaterial({
			color: 14261030,
			roughness: .18,
			metalness: .92,
			clearcoat: .45
		});
		sceneObjectsRef.current.paperMaterials = [paperPrimaryMat, paperSecondaryMat];
		const envW = 2.7;
		const envH = 1.72;
		const backShape = new Shape();
		backShape.moveTo(-2.7 / 2, -1.72 / 2);
		backShape.lineTo(envW / 2, -1.72 / 2);
		backShape.lineTo(envW / 2, envH / 2);
		backShape.lineTo(-2.7 / 2, envH / 2);
		backShape.closePath();
		const backGeo = new ExtrudeGeometry(backShape, {
			depth: .06,
			bevelEnabled: true,
			bevelThickness: .02,
			bevelSize: .02,
			bevelSegments: 3
		});
		backGeo.center();
		const backPocketMesh = new Mesh(backGeo, paperPrimaryMat);
		backPocketMesh.castShadow = true;
		backPocketMesh.receiveShadow = true;
		envelopeGroup.add(backPocketMesh);
		const letterCardMat = new MeshStandardMaterial({
			map: createLetterCardTexture(maxAnisotropy, activeEnvelope),
			roughness: .4,
			metalness: .02
		});
		const letterCardMesh = new Mesh(new BoxGeometry(envW * .88, envH * .84, .022), letterCardMat);
		letterCardMesh.position.set(0, 0, .015);
		letterCardMesh.castShadow = true;
		envelopeGroup.add(letterCardMesh);
		sceneObjectsRef.current.letterCardMesh = letterCardMesh;
		const frontPostalMat = new MeshPhysicalMaterial({
			map: createEnvelopeFrontPostalTexture(maxAnisotropy, activeEnvelope, stateRef.current.envelopeFinish),
			roughness: .46,
			metalness: .03,
			clearcoat: .16
		});
		const frontPostalMesh = new Mesh(new PlaneGeometry(envW * .985, envH * .985), frontPostalMat);
		frontPostalMesh.position.set(0, 0, .044);
		frontPostalMesh.receiveShadow = true;
		envelopeGroup.add(frontPostalMesh);
		sceneObjectsRef.current.frontPostalMesh = frontPostalMesh;
		const sideFlapExtrude = {
			depth: .014,
			bevelEnabled: true,
			bevelThickness: .006,
			bevelSize: .006,
			bevelSegments: 2
		};
		const bottomFlapShape = new Shape();
		bottomFlapShape.moveTo(-2.7 / 2, -1.72 / 2);
		bottomFlapShape.lineTo(envW / 2, -1.72 / 2);
		bottomFlapShape.lineTo(0, .08);
		bottomFlapShape.closePath();
		const bottomFlapMesh = new Mesh(new ExtrudeGeometry(bottomFlapShape, sideFlapExtrude), paperPrimaryMat);
		bottomFlapMesh.position.z = -.045;
		envelopeGroup.add(bottomFlapMesh);
		const topFlapPivot = new Group();
		topFlapPivot.position.set(0, envH / 2, .032);
		envelopeGroup.add(topFlapPivot);
		const topFlapShape = new Shape();
		topFlapShape.moveTo(-2.7 / 2, 0);
		topFlapShape.lineTo(envW / 2, 0);
		topFlapShape.lineTo(0, -1.72 * .42);
		topFlapShape.closePath();
		const topFlapMesh = new Mesh(new ExtrudeGeometry(topFlapShape, sideFlapExtrude), paperSecondaryMat);
		topFlapMesh.position.z = -.04;
		topFlapMesh.castShadow = true;
		topFlapPivot.add(topFlapMesh);
		const waxSealMesh = new Mesh(new LatheGeometry([
			new Vector2(0, 0),
			new Vector2(.16, 0),
			new Vector2(.17, .02),
			new Vector2(.13, .038),
			new Vector2(.1, .025),
			new Vector2(0, .032)
		], 32), new MeshPhysicalMaterial({
			color: 12131356,
			roughness: .26,
			metalness: .15,
			clearcoat: .7
		}));
		waxSealMesh.rotation.x = Math.PI / 2;
		waxSealMesh.position.set(.95, -.58, .048);
		envelopeGroup.add(waxSealMesh);
		const sealRingMat = new MeshStandardMaterial({
			color: 16096779,
			emissive: new Color(activeEnvelope.accentColor || "#F59E0B"),
			emissiveIntensity: .4,
			roughness: .18,
			metalness: .92
		});
		sceneObjectsRef.current.sealRingMat = sealRingMat;
		const sealSignetRing = new Mesh(new TorusGeometry(.12, .015, 16, 36), sealRingMat);
		sealSignetRing.position.set(.95, -.58, .072);
		envelopeGroup.add(sealSignetRing);
		const frameTube = new Mesh(new TubeGeometry(new CatmullRomCurve3([
			new Vector3(-2.7 / 2 - .015, -1.72 / 2 - .015, 0),
			new Vector3(1.365, -1.72 / 2 - .015, 0),
			new Vector3(1.365, .875, 0),
			new Vector3(-2.7 / 2 - .015, .875, 0)
		], true), 64, .012, 10, true), brassMat);
		envelopeGroup.add(frameTube);
		const wingShape = new Shape();
		wingShape.moveTo(0, -.2);
		wingShape.lineTo(.55, -.04);
		wingShape.lineTo(.75, .2);
		wingShape.lineTo(.24, .24);
		wingShape.lineTo(0, .1);
		wingShape.closePath();
		const wingGeo = new ExtrudeGeometry(wingShape, {
			depth: .016,
			bevelEnabled: true,
			bevelThickness: .008,
			bevelSize: .008,
			bevelSegments: 2
		});
		const rightWingPivot = new Group();
		rightWingPivot.position.set(envW / 2, .1, -.02);
		const rightWingMesh = new Mesh(wingGeo, brassMat);
		rightWingPivot.add(rightWingMesh);
		envelopeGroup.add(rightWingPivot);
		const leftWingPivot = new Group();
		leftWingPivot.position.set(-2.7 / 2, .1, -.02);
		const leftWingMesh = new Mesh(wingGeo, brassMat);
		leftWingMesh.scale.x = -1;
		leftWingPivot.add(leftWingMesh);
		envelopeGroup.add(leftWingPivot);
		const raycaster = new Raycaster();
		raycaster.layers.set(1);
		const pointer = new Vector2();
		const hitProxy = new Mesh(new BoxGeometry(envW * 1.4, envH * 1.5, .8), new MeshBasicMaterial({ visible: false }));
		hitProxy.layers.set(1);
		envelopeGroup.add(hitProxy);
		let pointerDownPos = {
			x: 0,
			y: 0
		};
		const handlePointerDown = (e) => {
			pointerDownPos = {
				x: e.clientX,
				y: e.clientY
			};
		};
		const handlePointerUp = (e) => {
			if (!stateRef.current.envelopeVisible) return;
			if (Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y) > 8) return;
			const rect = renderer.domElement.getBoundingClientRect();
			pointer.x = (e.clientX - rect.left) / rect.width * 2 - 1;
			pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
			raycaster.setFromCamera(pointer, camera);
			if (raycaster.intersectObject(hitProxy, false).length > 0 && stateRef.current.onEnvelopeClick) stateRef.current.onEnvelopeClick();
		};
		const handlePointerMove = (e) => {
			if (!stateRef.current.envelopeVisible) {
				stateRef.current.isHovered = false;
				renderer.domElement.style.cursor = "default";
				return;
			}
			const rect = renderer.domElement.getBoundingClientRect();
			pointer.x = (e.clientX - rect.left) / rect.width * 2 - 1;
			pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
			raycaster.setFromCamera(pointer, camera);
			const hovered = raycaster.intersectObject(hitProxy, false).length > 0;
			stateRef.current.isHovered = hovered;
			renderer.domElement.style.cursor = hovered ? "pointer" : "default";
		};
		renderer.domElement.addEventListener("pointerdown", handlePointerDown);
		renderer.domElement.addEventListener("pointerup", handlePointerUp);
		renderer.domElement.addEventListener("pointermove", handlePointerMove);
		if (!isSoftwareGl) renderer.compile(scene, camera);
		const presetCameraPos = {
			overview: [
				0,
				1.35,
				5.1
			],
			envelope_closeup: [
				0,
				1.25,
				3.6
			],
			relays: [
				1.6,
				1.65,
				4.9
			],
			top_down: [
				0,
				4.8,
				2.2
			]
		};
		const presetTargetPos = {
			overview: [
				0,
				1.08,
				0
			],
			envelope_closeup: [
				0,
				1.15,
				0
			],
			relays: [
				0,
				1.08,
				0
			],
			top_down: [
				0,
				.9,
				0
			]
		};
		let lastPreset = stateRef.current.cameraPreset;
		let lastFrameTimeMs = performance.now();
		const startTimeMs = lastFrameTimeMs;
		let frameId = 0;
		let isDisposed = false;
		function afterDraw(cb) {
			const gl = renderer.getContext();
			const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
			gl.flush();
			const poll = () => {
				if (isDisposed) return;
				if ((sync && gl.getSyncParameter(sync, gl.SYNC_STATUS)) === gl.UNSIGNALED) frameId = window.setTimeout(poll, 5);
				else {
					if (sync) gl.deleteSync(sync);
					frameId = window.setTimeout(cb, 80);
				}
			};
			frameId = window.setTimeout(poll, 5);
		}
		function tick() {
			if (isDisposed) return;
			const nowMs = performance.now();
			const delta = Math.min(Math.max((nowMs - lastFrameTimeMs) * .001, .001), .1);
			lastFrameTimeMs = nowMs;
			const elapsed = (nowMs - startTimeMs) * .001;
			if (stateRef.current.cameraPreset !== lastPreset) {
				lastPreset = stateRef.current.cameraPreset;
				userInteractingWithCamera = false;
			}
			if (!userInteractingWithCamera) {
				const [cx, cy, cz] = presetCameraPos[stateRef.current.cameraPreset];
				const [tx, ty, tz] = presetTargetPos[stateRef.current.cameraPreset];
				camera.position.x = MathUtils.damp(camera.position.x, cx, 3.5, delta);
				camera.position.y = MathUtils.damp(camera.position.y, cy, 3.5, delta);
				camera.position.z = MathUtils.damp(camera.position.z, cz, 3.5, delta);
				controls.target.x = MathUtils.damp(controls.target.x, tx, 4, delta);
				controls.target.y = MathUtils.damp(controls.target.y, ty, 4, delta);
				controls.target.z = MathUtils.damp(controls.target.z, tz, 4, delta);
			}
			controls.update();
			if (stateRef.current.outgoingActive) {
				envelopeGroup.visible = true;
				stateRef.current.outgoingProgress = Math.min(1, stateRef.current.outgoingProgress + delta * .27);
				const p = stateRef.current.outgoingProgress;
				contactShadowPlane.visible = p < .78;
				if (p < .42) {
					const angle = p / .42 * Math.PI * 2;
					envelopeGroup.position.set(0, .92, 0);
					envelopeGroup.rotation.set(-.05, Math.sin(angle) * .08, 0);
					envelopeGroup.scale.setScalar(1);
					stateRef.current.currentFlapOpen = 1;
					letterCardMesh.position.set(Math.sin(angle) * 2.15, .68 + Math.cos(angle) * 1.05, 1.25 + Math.sin(angle * 2) * .35);
					letterCardMesh.rotation.set(Math.cos(angle) * .18, Math.sin(angle) * .32, -Math.sin(angle) * .26);
					letterCardMesh.scale.setScalar(1.05);
					waxSealMesh.scale.setScalar(1);
					sealSignetRing.scale.setScalar(1);
				} else if (p < .65) {
					const insertT = MathUtils.smootherstep((p - .42) / .23, 0, 1);
					envelopeGroup.position.set(0, .92, 0);
					envelopeGroup.rotation.set(-.04, 0, 0);
					envelopeGroup.scale.setScalar(1);
					stateRef.current.currentFlapOpen = 1;
					letterCardMesh.position.x = 0;
					letterCardMesh.position.z = MathUtils.lerp(1.25, .015, Math.min(1, insertT * 2.2));
					letterCardMesh.position.y = insertT < .38 ? MathUtils.lerp(1.73, 1.18, insertT / .38) : MathUtils.lerp(1.18, 0, (insertT - .38) / .62);
					letterCardMesh.rotation.set(0, 0, 0);
					letterCardMesh.scale.setScalar(MathUtils.lerp(1.05, 1, insertT));
				} else if (p < .78) {
					const sealT = MathUtils.smootherstep((p - .65) / .13, 0, 1);
					envelopeGroup.position.set(0, .98, 0);
					envelopeGroup.rotation.set(-.03, 0, 0);
					letterCardMesh.position.set(0, 0, .015);
					letterCardMesh.rotation.set(0, 0, 0);
					letterCardMesh.scale.setScalar(1);
					stateRef.current.currentFlapOpen = 1 - sealT;
					const sealPulse = 1 + Math.sin(sealT * Math.PI) * .55;
					waxSealMesh.scale.setScalar(sealPulse);
					sealSignetRing.scale.setScalar(sealPulse);
				} else {
					const flyT = MathUtils.smootherstep((p - .78) / .22, 0, 1);
					stateRef.current.currentFlapOpen = 0;
					letterCardMesh.position.set(0, 0, .015);
					waxSealMesh.scale.setScalar(1);
					sealSignetRing.scale.setScalar(1);
					envelopeGroup.position.set(-flyT * 6.8, .98 + flyT * 4.5, -flyT * 20);
					envelopeGroup.rotation.set(-.36 * flyT, .46 * flyT, -.25 * flyT);
					envelopeGroup.scale.setScalar(Math.max(.01, 1 - flyT * .94));
					rightWingPivot.rotation.y = Math.sin(elapsed * 22) * .42;
					leftWingPivot.rotation.y = -rightWingPivot.rotation.y;
				}
				topFlapPivot.rotation.x = -stateRef.current.currentFlapOpen * Math.PI * .92;
				if (p >= 1) {
					stateRef.current.outgoingActive = false;
					envelopeGroup.scale.setScalar(1);
					letterCardMesh.scale.setScalar(1);
					letterCardMesh.rotation.set(0, 0, 0);
					waxSealMesh.scale.setScalar(1);
					sealSignetRing.scale.setScalar(1);
					stateRef.current.onOutgoingComplete?.();
				}
			} else {
				envelopeGroup.visible = stateRef.current.envelopeVisible;
				contactShadowPlane.visible = stateRef.current.envelopeVisible;
				letterCardMesh.position.x = 0;
				letterCardMesh.position.z = .015;
				letterCardMesh.rotation.set(0, 0, 0);
				letterCardMesh.scale.setScalar(1);
				if (stateRef.current.envelopeVisible && stateRef.current.flightProgress < 1) {
					stateRef.current.flightProgress = Math.min(1, stateRef.current.flightProgress + delta * .85);
					const t = MathUtils.smootherstep(stateRef.current.flightProgress, 0, 1);
					_BezierP0.set(5.6, 3.6, -4.5);
					_BezierP1.set(-1.2, 2.7, 1.4);
					_BezierP2.set(0, 1.08, 0);
					const oneMinusT = 1 - t;
					_vec3A.copy(_BezierP0).multiplyScalar(oneMinusT * oneMinusT).addScaledVector(_BezierP1, 2 * oneMinusT * t).addScaledVector(_BezierP2, t * t);
					envelopeGroup.position.copy(_vec3A);
					const bankAngle = Math.sin(t * Math.PI) * .38;
					const pitchAngle = Math.sin(t * Math.PI) * .24;
					envelopeGroup.rotation.set(pitchAngle, Math.sin(t * Math.PI) * -.42, bankAngle);
					rightWingPivot.rotation.y = MathUtils.damp(rightWingPivot.rotation.y, Math.sin(elapsed * 16) * .25, 8, delta);
					leftWingPivot.rotation.y = -rightWingPivot.rotation.y;
				} else {
					const hoverY = 1.08 + Math.sin(elapsed * 2.2) * .04;
					const targetScale = stateRef.current.isHovered ? 1.045 : 1;
					envelopeGroup.position.x = MathUtils.damp(envelopeGroup.position.x, 0, 5, delta);
					envelopeGroup.position.y = MathUtils.damp(envelopeGroup.position.y, hoverY, 5, delta);
					envelopeGroup.position.z = MathUtils.damp(envelopeGroup.position.z, 0, 5, delta);
					envelopeGroup.scale.setScalar(MathUtils.damp(envelopeGroup.scale.x, targetScale, 6, delta));
					envelopeGroup.rotation.x = MathUtils.damp(envelopeGroup.rotation.x, -.06, 4, delta);
					envelopeGroup.rotation.y = MathUtils.damp(envelopeGroup.rotation.y, Math.sin(elapsed * .9) * .07, 4, delta);
					envelopeGroup.rotation.z = MathUtils.damp(envelopeGroup.rotation.z, 0, 4, delta);
					rightWingPivot.rotation.y = MathUtils.damp(rightWingPivot.rotation.y, .55, 4, delta);
					leftWingPivot.rotation.y = MathUtils.damp(leftWingPivot.rotation.y, -.55, 4, delta);
				}
				const targetFlap = stateRef.current.flightProgress > .85 ? stateRef.current.flapOpenAmount : .02;
				stateRef.current.currentFlapOpen = MathUtils.damp(stateRef.current.currentFlapOpen, targetFlap, 5.5, delta);
				topFlapPivot.rotation.x = -stateRef.current.currentFlapOpen * Math.PI * .92;
				const targetLetterY = stateRef.current.currentFlapOpen > .35 ? .56 * stateRef.current.currentFlapOpen : 0;
				stateRef.current.currentLetterRise = MathUtils.damp(stateRef.current.currentLetterRise, targetLetterY, 4.8, delta);
				letterCardMesh.position.y = stateRef.current.currentLetterRise;
			}
			renderer.render(scene, camera);
			if (isSoftwareGl) afterDraw(tick);
			else frameId = requestAnimationFrame(tick);
		}
		frameId = requestAnimationFrame(tick);
		const handleResize = () => {
			if (!container) return;
			camera.aspect = container.clientWidth / container.clientHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(container.clientWidth, container.clientHeight);
		};
		window.addEventListener("resize", handleResize);
		return () => {
			isDisposed = true;
			cancelAnimationFrame(frameId);
			clearTimeout(frameId);
			window.removeEventListener("resize", handleResize);
			renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
			renderer.domElement.removeEventListener("pointerup", handlePointerUp);
			renderer.domElement.removeEventListener("pointermove", handlePointerMove);
			controls.dispose();
			envTexture.dispose();
			wallpaperTex.dispose();
			renderer.dispose();
		};
	}, []);
	return /* @__PURE__ */ _jsx("div", {
		ref: canvasMountRef,
		className: "fixed inset-0 w-screen h-screen overflow-hidden select-none z-0",
		"aria-label": "Рабочий стол Windows с прилетающим 3D-конвертом"
	});
};
export { ThreeMailScene };
