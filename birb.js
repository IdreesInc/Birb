// ==UserScript==
// @name         birb
// @namespace    https://idreesinc.com
// @version      2024-12-12
// @description  birb
// @author       Idrees
// @match        *://*/*
// @grant        none
// ==/UserScript==

// @ts-check

const sharedSettings = {
	cssScale: 1,
	canvasPixelSize: 1,
	hopSpeed: 0.07,
	hopDistance: 45,
};


let desktopSettings = {
	flySpeed: 0.2,
};

let mobileSettings = {
	flySpeed: 0.125,
};

const settings = { ...sharedSettings, ...isMobile() ? mobileSettings : desktopSettings };

const CSS_SCALE = settings.cssScale;
const CANVAS_PIXEL_SIZE = settings.canvasPixelSize;
const WINDOW_PIXEL_SIZE = CANVAS_PIXEL_SIZE * CSS_SCALE;
const HOP_SPEED = settings.hopSpeed;
const FLY_SPEED = settings.flySpeed;
const HOP_DISTANCE = settings.hopDistance;
// Time in milliseconds until the user is considered AFK
const AFK_TIME = 1000 * 30;
const SPRITE_HEIGHT = 32;
const MENU_ID = "birb-menu";
const MENU_EXIT_ID = "birb-menu-exit";
const FIELD_GUIDE_ID = "birb-field-guide";
const FEATHER_ID = "birb-feather";

const styles = `
	@font-face {
		font-family: Monocraft;
		src: url("https://cdn.jsdelivr.net/gh/idreesinc/Monocraft/dist/Monocraft.otf");
	}

	:root {
		--border-size: 2px;
		--neg-border-size: calc(var(--border-size) * -1);
		--double-border-size: calc(var(--border-size) * 2);
		--neg-double-border-size: calc(var(--neg-border-size) * 2);
		--border-color: #000000;
		--highlight: #ffa3cb;
	}

	#birb {
		image-rendering: pixelated;
		position: fixed;
		bottom: 0;
		transform: scale(${CSS_SCALE});
		transform-origin: bottom;
		z-index: 999999998;
		cursor: pointer;
	}

	.birb-decoration {
		image-rendering: pixelated;
		position: fixed;
		bottom: 0;
		transform: scale(${CSS_SCALE});
		transform-origin: bottom;
		z-index: 999999990;
	}

	.birb-window {
		font-family: "Monocraft", monospace;
		z-index: 999999999;
		position: fixed;
		background-color: #ffecda;
		box-shadow: 
			var(--border-size) 0 var(--border-color), 
			var(--neg-border-size) 0 var(--border-color), 
			0 var(--neg-border-size) var(--border-color), 
			0 var(--border-size) var(--border-color), 
			var(--double-border-size) 0 var(--border-color), 
			var(--neg-double-border-size) 0 var(--border-color), 
			0 var(--neg-double-border-size) var(--border-color), 
			0 var(--double-border-size) var(--border-color), 
			0 0 0 var(--border-size) var(--border-color),
			0 0 0 var(--double-border-size) white,
			var(--double-border-size) 0 0 var(--border-size) white,
			var(--neg-double-border-size) 0 0 var(--border-size) white,
			0 var(--neg-double-border-size) 0 var(--border-size) white,
			0 var(--double-border-size) 0 var(--border-size) white;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		animation: pop-in 0.08s;
		transition-timing-function: ease-in;
	}

	#${MENU_ID} {
		transition-duration: 0.2s;
		transition-timing-function: ease-out;
		min-width: 140px;
	}

	#${MENU_EXIT_ID} {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 999999997;
	}

	@keyframes pop-in {
		0% { opacity: 1; transform: scale(0.1); }
		100% { opacity: 1; transform: scale(1); }
	}

	.birb-window-header {
		box-sizing: border-box;
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 7px;
		padding-top: 3px;
		padding-bottom: 3px;
		padding-left: 30px;
		padding-right: 30px;
		background-color: var(--highlight);
		box-shadow:
			var(--border-size) 0 var(--highlight), 
			var(--neg-border-size) 0 var(--highlight), 
			0 var(--neg-border-size) var(--highlight), 
			var(--neg-border-size) var(--border-size) var(--border-color), 
			var(--border-size) var(--border-size) var(--border-color);
		color: var(--border-color);
		font-size: 16px;
	}

	.birb-window-title {
		text-align: center;
		flex-grow: 1;
		user-select: none;
		color: #ffecda;
	}
	
	.birb-window-close {
		position: absolute;
		top: 2px;
		right: 5px;
		opacity: 0.35;
		user-select: none;
		cursor: pointer;
	}

	.birb-window-close:hover {
		opacity: 1;
	}

	.birb-window-content {
		box-sizing: border-box;
		background-color: #ffecda;
		margin-top: var(--border-size);
		width: 100%;
		flex-grow: 1;    
		box-shadow:
			var(--border-size) 0 #ffecda, 
			var(--neg-border-size) 0 #ffecda,
			0 var(--border-size) #ffecda,
			0 var(--neg-border-size) var(--border-color),
			0 var(--border-size) var(--border-color);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding-left: 15px;
		padding-right: 15px;
		padding-top: 8px;
		padding-bottom: 8px;
	}

	.birb-pico-8-content {
		background: #111111;
		box-shadow: none;
		display: flex;
		justify-content: center;
		overflow: hidden;
		border: none;
	}

	.birb-pico-8-content iframe {
		width: 300px;
		margin-left: -15px;
		margin-right: -30px;
		margin-top: -10px;
		margin-bottom: -23px;
		border:none;
		aspect-ratio: 1;
	}

	.birb-music-player-content {
		background: #ffecda;
		box-shadow:
			var(--border-size) 0 #ffecda, 
			var(--neg-border-size) 0 #ffecda,
			0 var(--border-size) #ffecda,
			0 var(--neg-border-size) var(--border-color),
			0 var(--border-size) var(--border-color);
		display: flex;
		justify-content: center;
		overflow: hidden;
		padding: 10px;
	}

	.birb-window-list-item {
		width: 100%;
		font-size: 14px;
		padding-top: 4px;
		padding-bottom: 4px;
		opacity: 0.6;
		user-select: none;
		display: flex;
		justify-content: space-between;
	}

	.birb-window-list-item:hover {
		opacity: 1;
		cursor: pointer;
	}

	.birb-window-list-item-arrow {
		display: inline-block;
	}

	.birb-window-separator {
		width: 100%;
		height: 1.5px;
		background-color: #000000;
		box-sizing: border-box;
		margin-top: 4px;
		margin-bottom: 4px;
		opacity: 0.4;
	}

	#${FIELD_GUIDE_ID} {
		width: 260px;
	}

	.birb-grid-content {
		width: 100%;
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		flex-direction: row;
		padding-top: 4px;
		padding-bottom: 4px;
	}

	.birb-grid-item {
		width: 64px;
		height: 64px;
		overflow: hidden;
		margin-top: 6px;
		margin-bottom: 6px;
		display: flex;
		justify-content: center;
		align-items: center;
		cursor: pointer;
	}

	.birb-grid-item canvas {
		image-rendering: pixelated;
		transform: scale(2);
		padding-bottom: var(--border-size);
	}

	.birb-grid-item, .birb-field-guide-description, .birb-message-content {
		border: var(--border-size) solid rgb(255, 207, 144);
		box-shadow: 0 0 0 var(--border-size) white;
		background: rgba(255, 221, 177, 0.5);
	}

	.birb-grid-item-locked {
		cursor: auto;
		filter: grayscale(100%) sepia(30%);
	}

	.birb-grid-item-locked canvas {
		filter: contrast(90%);
	}

	.birb-grid-item-selected {
		border: var(--border-size) solid var(--highlight);
	}

	.birb-field-guide-description {
		box-sizing: border-box;
		width: 100%;
		margin-top: 10px;
		padding: 8px;
		padding-top: 4px;
		padding-bottom: 4px;
		font-size: 14px;
		color: rgb(124, 108, 75);
	}

	#${FEATHER_ID} {
		cursor: pointer;
	}

	.birb-message-content {
		box-sizing: border-box;
		width: 100%;
		margin-top: 10px;
		padding: 8px;
		padding-top: 4px;
		padding-bottom: 4px;
		font-size: 14px;
		color: rgb(124, 108, 75);
	}
`;

class Layer {
	/**
	 * @param {string[][]} pixels
	 * @param {string} [tag]
	 */
	constructor(pixels, tag="default") {
		this.pixels = pixels;
		this.tag = tag;
	}
}

class Frame {

	#pixelsByTag = {};

	/**
	 * @param {Layer[]} layers
	 */
	constructor(layers) {
		/** @type {Set<string>} */
		let tags = new Set();
		for (let layer of layers) {
			tags.add(layer.tag);
		}
		tags.add("default");
		for (let tag of tags) {
			let maxHeight = layers.reduce((max, layer) => Math.max(max, layer.pixels.length), 0);
			if (layers[0].tag !== "default") {
				throw new Error("First layer must have the 'default' tag");
			}
			this.pixels = layers[0].pixels.map(row => row.slice());
			// Pad from top with transparent pixels
			while (this.pixels.length < maxHeight) {
				this.pixels.unshift(new Array(this.pixels[0].length).fill(TRANSPARENT));
			}
			// Combine layers
			for (let i = 1; i < layers.length; i++) {
				if (layers[i].tag === "default" || layers[i].tag === tag) {
					let layerPixels = layers[i].pixels;
					let topMargin = maxHeight - layerPixels.length;
					for (let y = 0; y < layerPixels.length; y++) {
						for (let x = 0; x < layerPixels[y].length; x++) {
							this.pixels[y + topMargin][x] = layerPixels[y][x] !== TRANSPARENT ? layerPixels[y][x] : this.pixels[y + topMargin][x];
						}
					}
				}
			}
			this.#pixelsByTag[tag] = this.pixels.map(row => row.slice());
		}
	}

	/**
	 * @param {string} [tag]
	 * @returns {string[][]}
	 */
	getPixels(tag="default") {
		return this.#pixelsByTag[tag] ?? this.#pixelsByTag["default"];
	}

	/**
	 * @param {CanvasRenderingContext2D} ctx
	 * @param {number} direction
	 * @param {BirdType} [theme]
	 */
	draw(ctx, direction, theme) {
		const pixels = this.getPixels(theme?.tags[0]);
		for (let y = 0; y < pixels.length; y++) {
			const row = pixels[y];
			for (let x = 0; x < pixels[y].length; x++) {
				const cell = direction === Directions.LEFT ? row[x] : row[pixels[y].length - x - 1];
				ctx.fillStyle = theme?.colors[cell] ?? cell;
				ctx.fillRect(x * CANVAS_PIXEL_SIZE, y * CANVAS_PIXEL_SIZE, CANVAS_PIXEL_SIZE, CANVAS_PIXEL_SIZE);
			};
		};
	}
}

class Anim {
	/**
	 * @param {Frame[]} frames
	 * @param {number[]} durations
	 * @param {boolean} loop
	 */
	constructor(frames, durations, loop = true) {
		this.frames = frames;
		this.durations = durations;
		this.loop = loop;
	}

	getAnimationDuration() {
		return this.durations.reduce((a, b) => a + b, 0);
	}

	/**
	 * @param {CanvasRenderingContext2D} ctx
	 * @param {number} direction
	 * @param {number} timeStart The start time of the animation in milliseconds
	 * @param {BirdType} [theme] The theme to use for the animation
	 * @returns {boolean} Whether the animation is complete
	 */
	draw(ctx, direction, timeStart, theme) {
		let time = Date.now() - timeStart;
		const duration = this.getAnimationDuration();
		if (this.loop) {
			time %= duration;
		}
		let totalDuration = 0;
		for (let i = 0; i < this.durations.length; i++) {
			totalDuration += this.durations[i];
			if (time < totalDuration) {
				this.frames[i].draw(ctx, direction, theme);
				return false;
			}
		}
		// Draw the last frame if the animation is complete
		this.frames[this.frames.length - 1].draw(ctx, direction, theme);
		return true;
	}
}

const TRANSPARENT = "transparent";
const OUTLINE = "outline";
const BORDER = "border";
const FOOT = "foot";
const BEAK = "beak";
const EYE = "eye";
const FACE = "face";
const BELLY = "belly";
const UNDERBELLY = "underbelly";
const WING = "wing";
const WING_EDGE = "wing-edge";
const HEART = "heart";
const HEART_BORDER = "heart-border";
const HEART_SHINE = "heart-shine";
const FEATHER_SPINE = "feather-spine";

const SPRITESHEET_COLOR_MAP = {
	"transparent": TRANSPARENT,
	"#ffffff": BORDER,
	"#000000": OUTLINE,
	"#010a19": BEAK,
	"#190301": EYE,
	"#af8e75": FOOT,
	"#639bff": FACE,
	"#f8b143": BELLY,
	"#ec8637": UNDERBELLY,
	"#578ae6": WING,
	"#326ed9": WING_EDGE,
	"#c82e2e": HEART,
	"#501a1a": HEART_BORDER,
	"#ff6b6b": HEART_SHINE,
	"#373737": FEATHER_SPINE,
};

class BirdType {
	/**
	 * @param {string} name
	 * @param {string} description
	 * @param {Record<string, string>} colors
	 * @param {string[]} [tags]
	 */
	constructor(name, description, colors, tags=[]) {
		this.name = name;
		this.description = description;
		const defaultColors = {
			[TRANSPARENT]: "transparent",
			[OUTLINE]: "#000000",
			[BORDER]: "#ffffff",
			[HEART]: "#c82e2e",
			[HEART_BORDER]: "#501a1a",
			[HEART_SHINE]: "#ff6b6b",
			[FEATHER_SPINE]: "#373737",
		};
		this.colors = { ...defaultColors, ...colors };
		this.tags = tags;
	}
}

const species = {
	bluebird: new BirdType("Eastern Bluebird",
		"Native to North American and very social, though can be timid around people.", {
		[BEAK]: "#000000",
		[FOOT]: "#af8e75",
		[EYE]: "#000000",
		[FACE]: "#639bff",
		[BELLY]: "#f8b143",
		[UNDERBELLY]: "#ec8637",
		[WING]: "#578ae6",
		[WING_EDGE]: "#326ed9",
	}),
	shimaEnaga: new BirdType("Shima Enaga",
		"Small, fluffy birds found in the snowy regions of Japan", {
		[BEAK]: "#000000",
		[FOOT]: "#af8e75",
		[EYE]: "#000000",
		[FACE]: "#ffffff",
		[BELLY]: "#ebe9e8",
		[UNDERBELLY]: "#ebd9d0",
		[WING]: "#e3cabd",
		[WING_EDGE]: "#9b8b82",
	}),
	tuftedTitmouse: new BirdType("Tufted Titmouse",
		"Native to the eastern United States, full of personality, and my wife's favorite bird.", {
		[BEAK]: "#000000",
		[FOOT]: "#af8e75",
		[EYE]: "#000000",
		[FACE]: "#c7cad7",
		[BELLY]: "#e4e5eb",
		[UNDERBELLY]: "#d7cfcb",
		[WING]: "#b1b5c5",
		[WING_EDGE]: "#9d9fa9",
	}, ["tuft"]),
};


const Directions = {
	LEFT: -1,
	RIGHT: 1,
};

const SPRITE_WIDTH = 32;
const DECORATIONS_SPRITE_WIDTH = 48;
const FEATHER_SPRITE_WIDTH = 32;
const SPRITE_SHEET_URI = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAWAAAAAgCAYAAAAsTqKUAAAAAXNSR0IArs4c6QAABKFJREFUeJztnL9rHEccxd+cXRwx7o6AVmmNOhncXOVKqdycXKkKgQiBQSBXOYz/AGFUBGIIGIQCIdVVQo2rqHJjNQYXKYTb6AzhwIUVUGN9U9zN3uze7OzpvDuze/s+cOzsj7vv7O7M+76d3VuAEEIIIYQQQgghpHRU6AoQkoeISNY6pRTbMKktbLwkl5ACqGM/Xl0FABxfXCTKPupACCFBkAmbUSSbUTRTdolzUfE3o0jerq+L7O7OlMuOT0iZ3A5dATIfNqHx5fwer67iWaeD7sOHM2XtQn1w9uYNnnU6cZmQutMKXQGST/oyXE99u79QAnh8cYEXo1Fi2YvRyKv4E0IainkZbk59CLA5BPF2fT3++BqCsNXBZ2xCyoQOeE7EQoh6aAfqCz3MYbpQ0336GAZJ14E33whpGCIyvvljTH3GDu0AzTqESkChkx8hRUMHMSciImf378fz3ffvvTowcxw4lAM0ha+J7jMt/E08BoQEQTsv7X7pAJuFcdxFz4aqA9tAw7CNfzaxATR53wkAQLYPYxH2G7gCCYAUT+5NOH2ilVKJj7mubKqSAJSB79gkPNuH0xEY37F1s9N1qHIbrEp/rQPOP2KY4ms0PuhlImJuU0qDMOuQWg4RkSo3RLJcHO2EbWshE0AeaYG19VcyS+aJdImv5mgndsKYbFtow3DV4WhHJU4qhZiQcEzMUDy/dTCMy4N+BBFZmj66ckvJxy9SyL44HXDrTgT1zQp+fxoBAH76dYjXT1p49OoawPQgl+GG8xLA9qGYQyF0w4SEQ5RSCdFdVlZuKXn06hqvn7QKEeGvcsCXnz7G5UE/0t/LDnYDgRQRad2JEsvSCUDH1xl2kTiELMLWwVAG/YjtDBCX8Jq6wH45S6YDVkop18C5Kb5A0g3bWMSlXv83nEkAWnzTsdNu2PZ7bABkEa5ONqTdO1W6DADtXljxrUgCcIqvAbteBnO9De23b7/H7r9/xWUA+PHTn9Zt0yfkwz+fAUyHKealCgmAEABo907VVHhPvbefqiaAvG20+/UZ34hZi37urKQeWL862ZhZ1+6d4sHeOe59d9f6XS28716u6d8aB7zhMISOP5MAzu0JwFUPXgaRuhIyAdjIE+BBP8LWwRAluvRM9z0R4UocpzwWfh/w1ckG2r01YO/cuj4tvMDXXYdo4dUM+tFCCYCQOlIV4dX8sfZDpgnyIL4Axn08q//XhVwHDIwv69Mu+PLvSwBA5/lZ1nenQRYUXpcDB6Yu3EbRCYAQkmS035Xd28cAksMNPsQXgLgMWF1ccG4FbSKoxddG5/lZYc8Fh04AhBA3o/1u3NEMMfbV3zJF2Hwyqsr9fy4BBsYiONrvOrctUnzN+KESACGk8oi+Ck4LcR3+AJI7BqyfRpjsSKYIlyl8OjYAZxKg+BLSONS7l2vjTp8hxEuB8UINOf7l5/itTOZ8WS/cSL3QwxmfL/0gpLEIxo5YHuydL89b42ziZ5svW4BDxSeE1AOtC/qzFJqQFrusaZkCHDI+IaQeiIXQdXIx93PAehzWNS2T0PEJIdWnbvd+bvSvtNwfK3HnQ8cnhJCi+R9t4o1zEu5PTgAAAABJRU5ErkJggg==";
const DECORATIONS_SPRITE_SHEET_URI = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAAXNSR0IArs4c6QAAAPNJREFUaIHtmTESgzAMBHWZDC+gp0vP/x9Bn44+L6BRmrhJA4csM05uGzfY1s1JxggzIYQQQgghxEnATnB3zwikAICKiXq4BE/uwaxvn/UPb3BnNwFg27Ky0w6vzRp8S4mkIbQD3wzzFJofdTMkYJgn89czFADGKSSiSgphfFBjTaoIKC4cHWvSxIFMmjiQSYoDLUlxoCVywOwHHWjpROop1IL/vsxty2oYO77M1QggSvcpJAFXE66BPfa+2C4v4j2yi7z7FJKAq6FrwN3TO3MMlAAAKO3F2sVZTiu2N9p9CnUv4FR7PbMG2BQ69SJL/kVA8QauAnHUj36BVwAAAABJRU5ErkJggg==";
const FEATHER_SPRITE_SHEET_URI = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAARhJREFUWIXtlbENwjAQRf8hSiZIRQ+9WQNRUFIAKzACBSsAA1Ag1mAABqCCBomG3hQQ9OMEx4ZDNH5SikSJ3/fZ5wCJRCKRSPwZ0RzMWmtLAhGvQyUAi9mXP/aFaGjJRQQiguHihMvcFMJUVUYlAMuHixPGy4en1WmVQqgHYHkuZjiEj6a2/LjtYzTY0eiZbgC37Mxh1UN3sn/dr6cCz/LHB/DJj9s+2oMdbtdz6TtfFwQHcMvOInfmQNjsgchNWLXmdfK6gyioAu/6uKrsm1kWLAciKuCuey5nYuXAh234bdmZ6INIUw4E/Ix49xtjCmXfzLL8nY/ktdgnAKwxxgIoXIyqmAOwvIqfiN0ALNd21HYBO9XXGMAdnZTYyHWzWjQAAAAASUVORK5CYII=";

/**
 * Load the spritesheet and return the pixelmap template
 * @param {string} dataUri
 * @param {boolean} [templateColors]
 * @returns {Promise<string[][]>}
 */
function loadSpritesheetPixels(dataUri, templateColors = true) {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.src = dataUri;
		img.onload = () => {
			const canvas = document.createElement('canvas');
			canvas.width = img.width;
			canvas.height = img.height;
			const ctx = canvas.getContext('2d');
			if (!ctx) {
				reject(new Error('Failed to get canvas context'));
				return;
			}
			ctx.drawImage(img, 0, 0);
			const imageData = ctx.getImageData(0, 0, img.width, img.height);
			const pixels = imageData.data;
			const hexArray = [];
			for (let y = 0; y < img.height; y++) {
				const row = [];
				for (let x = 0; x < img.width; x++) {
					const index = (y * img.width + x) * 4;
					const r = pixels[index];
					const g = pixels[index + 1];
					const b = pixels[index + 2];
					const a = pixels[index + 3];
					if (a === 0) {
						row.push(TRANSPARENT);
						continue;
					}
					const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
					if (!templateColors) {
						row.push(hex);
						continue;
					}
					if (SPRITESHEET_COLOR_MAP[hex] === undefined) {
						console.error(`Unknown color: ${hex}`);
						row.push(TRANSPARENT);
					}
					row.push(SPRITESHEET_COLOR_MAP[hex]);
				}
				hexArray.push(row);
			}
			resolve(hexArray);
		};
		img.onerror = (err) => {
			reject(err);
		};
	});
}

Promise.all([loadSpritesheetPixels(SPRITE_SHEET_URI), loadSpritesheetPixels(DECORATIONS_SPRITE_SHEET_URI, false), loadSpritesheetPixels(FEATHER_SPRITE_SHEET_URI)]).then(([birbPixels, decorationPixels, featherPixels	]) => {
	const SPRITE_SHEET = birbPixels;
	const DECORATIONS_SPRITE_SHEET = decorationPixels;
	const FEATHER_SPRITE_SHEET = featherPixels;

	const layers = {
		base: new Layer(getLayer(SPRITE_SHEET, 0)),
		down: new Layer(getLayer(SPRITE_SHEET, 1)),
		heartOne: new Layer(getLayer(SPRITE_SHEET, 2)),
		heartTwo: new Layer(getLayer(SPRITE_SHEET, 3)),
		heartThree: new Layer(getLayer(SPRITE_SHEET, 4)),
		heartFour: new Layer(getLayer(SPRITE_SHEET, 5)),
		tuftBase: new Layer(getLayer(SPRITE_SHEET, 6), "tuft"),
		tuftDown: new Layer(getLayer(SPRITE_SHEET, 7), "tuft"),
		wingsUp: new Layer(getLayer(SPRITE_SHEET, 8)),
		wingsDown: new Layer(getLayer(SPRITE_SHEET, 9)),
		happyEye: new Layer(getLayer(SPRITE_SHEET, 10)),
	};

	const decorationLayers = {
		mac: new Layer(getLayer(DECORATIONS_SPRITE_SHEET, 0, DECORATIONS_SPRITE_WIDTH)),
	};

	const featherLayers = {
		feather: new Layer(getLayer(FEATHER_SPRITE_SHEET, 0, FEATHER_SPRITE_WIDTH)),
	};

	const birbFrames = {
		base: new Frame([layers.base, layers.tuftBase]),
		headDown: new Frame([layers.down, layers.tuftDown]),
		wingsDown: new Frame([layers.base, layers.tuftBase, layers.wingsDown]),
		wingsUp: new Frame([layers.down, layers.tuftDown, layers.wingsUp]),
		heartOne: new Frame([layers.base, layers.tuftBase, layers.happyEye, layers.heartOne]),
		heartTwo: new Frame([layers.base, layers.tuftBase, layers.happyEye, layers.heartTwo]),
		heartThree: new Frame([layers.base, layers.tuftBase, layers.happyEye, layers.heartThree]),
		heartFour: new Frame([layers.base, layers.tuftBase, layers.happyEye, layers.heartFour]),
	};

	const decorationFrames = {
		mac: new Frame([decorationLayers.mac]),
	};

	const featherFrames = {
		feather: new Frame([featherLayers.feather]),
	};

	const Animations = {
		STILL: new Anim([birbFrames.base], [1000]),
		BOB: new Anim([
			birbFrames.base,
			birbFrames.headDown
		], [
			420,
			420
		]),
		FLYING: new Anim([
			birbFrames.base,
			birbFrames.wingsUp,
			birbFrames.headDown,
			birbFrames.wingsDown,
		], [
			40,
			80,
			40,
			80,
		]),
		HEART: new Anim([
			birbFrames.heartOne,
			birbFrames.heartTwo,
			birbFrames.heartThree,
			birbFrames.heartFour,
			birbFrames.heartThree,
			birbFrames.heartFour,
			birbFrames.heartThree,
			birbFrames.heartFour,
		], [
			60,
			80,
			250,
			250,
			250,
			250,
			250,
			250,
		], false),
	};

	const DECORATION_ANIMATIONS = {
		mac: new Anim([
			decorationFrames.mac,
		], [
			1000,
		]),
	};

	const FEATHER_ANIMATIONS = {
		feather: new Anim([
			featherFrames.feather,	
		], [
			1000,
		]),
	};

	class MenuItem {
		/**
		 * @param {string} text
		 * @param {() => void} action
		 * @param {boolean} [removeMenu]
		 */
		constructor(text, action, removeMenu = true) {
			this.text = text;
			this.action = action;
			this.removeMenu = removeMenu;
		}
	}

	class Separator extends MenuItem {
		constructor() {
			super("", () => {});
		}
	}
	
	const menuItems = [
		new MenuItem("Pet Birb", pet),
		new MenuItem("Field Guide", insertFieldGuide),
		// new MenuItem("Decorations", insertDecoration),
		// new MenuItem("Utilities", () => {}),
		new MenuItem("Applications", () => switchMenuItems(otherItems), false),
		new MenuItem("Hide Birb", hideBirb),
		new Separator(),
		new MenuItem("Settings", () => {}),
	];

	const otherItems = [
		new MenuItem("Go Back", () => switchMenuItems(menuItems), false),
		new Separator(),
		// new MenuItem("Utilities", () => {}),
		new MenuItem("Video Games", () => switchMenuItems(gameItems), false),
		new MenuItem("Music Player", () => insertMusicPlayer(), false),
	];
	
	const gameItems = [
		new MenuItem("Go Back", () => switchMenuItems(otherItems), false),
		new Separator(),
		new MenuItem("Pinball", () => insertPico8("Terra Nova Pinball", "terra_nova_pinball")),
		new MenuItem("Pico Dino", () => insertPico8("Pico Dino", "picodino")),
		new MenuItem("Woodworm", () => insertPico8("Woodworm", "woodworm")),
		// new MenuItem("Wobblepaint	", () => insertPico8("Wobblepaint", "wobblepaint")),
		new MenuItem("Pico and Chill", () => insertPico8("Pico and Chill", "picochill")),
		new MenuItem("Lani's Trek", () => insertPico8("Celeste 2 Lani's Trek", "celeste_classic_2")),
		new MenuItem("Tetraminis", () => insertPico8("Tetraminis", "tetraminisdeffect")),
		// new MenuItem("Pool", () => insertPico8("Pool", "mot_pool")),
	];

	const styleElement = document.createElement("style");
	const canvas = document.createElement("canvas");

	/** @type {CanvasRenderingContext2D} */
	// @ts-ignore
	const ctx = canvas.getContext("2d");

	const States = {
		IDLE: "idle",
		HOP: "hop",
		FLYING: "flying",
	};

	let stateStart = Date.now();
	let currentState = States.IDLE;
	let animStart = Date.now();
	let currentAnimation = Animations.BOB;
	let direction = Directions.RIGHT;
	let ticks = 0;
	// Bird's current position
	let birdY = 0;
	let birdX = 40;
	// Bird's starting position (when flying)
	let startX = 0;
	let startY = 0;
	// Bird's target position (when flying)
	let targetX = 0;
	let targetY = 0;
	/** @type {HTMLElement|null} */
	let focusedElement = null;
	let timeOfLastAction = Date.now();
	let petStack = [];
	let currentTheme = "bluebird";
	let unlockedThemes = ["bluebird"];
	let visible = true;

	function init() {
		if (window !== window.top) {
			// Skip installation if within an iframe
			return;
		}

		styleElement.innerHTML = styles;
		document.head.appendChild(styleElement);

		canvas.id = "birb";
		canvas.width = birbFrames.base.getPixels()[0].length * CANVAS_PIXEL_SIZE;
		canvas.height = SPRITE_HEIGHT * CANVAS_PIXEL_SIZE;
		document.body.appendChild(canvas);

		window.addEventListener("scroll", () => {
			timeOfLastAction = Date.now();
			// Can't keep up with scrolling on mobile devices so fly down instead
			if (isMobile()) {
				focusOnGround();
			}

		});

		onClick(document, (e) => {
			timeOfLastAction = Date.now();
			if (e.target instanceof Node && document.querySelector("#" + MENU_EXIT_ID)?.contains(e.target)) {
				removeMenu();
			}
		});

		onClick(canvas, () => {
			insertMenu();
		});

		canvas.addEventListener("mouseover", () => {
			timeOfLastAction = Date.now();
			if (currentState === States.IDLE) {
				petStack.push(Date.now());
				if (petStack.length > 10) {
					petStack.shift();
				}
				const pets = petStack.filter((time) => Date.now() - time < 1000).length;
				if (pets >= 4) {
					setAnimation(Animations.HEART);
					// Clear the stack
					petStack = [];
				}
			}
		});

		setInterval(update, 1000 / 60);
	}

	function update() {
		ticks++;
		if (currentState === States.IDLE) {
			if (Math.random() < 1 / (60 * 3) && currentAnimation !== Animations.HEART && !isMenuOpen()) {
				hop();
			}
		} else if (currentState === States.HOP) {
			if (updateParabolicPath(HOP_SPEED)) {
				setState(States.IDLE);
			}
		}
		if (visible && Math.random() < 1 / (60 * 3)) {
			// activateFeather();
		}
		updateFeather();
	}

	function draw() {
		requestAnimationFrame(draw);

		if (!visible) {
			return;
		}

		// Update the bird's position
		if (currentState === States.IDLE) {
			if (focusedElement !== null) {
				birdY = getFocusedElementY();
			}
		} else if (currentState === States.FLYING) {
			// Fly to target location (even if in the air)
			if (updateParabolicPath(FLY_SPEED)) {
				setState(States.IDLE);
			}
		}

		if (focusedElement === null) {
			if (Date.now() - timeOfLastAction > AFK_TIME && !isMenuOpen()) {
				// Fly to an element if the user is AFK
				focusOnElement();
				timeOfLastAction = Date.now();
			}
		} else if (focusedElement !== null) {
			targetY = getFocusedElementY();
			if (targetY < 0 || targetY > window.innerHeight) {
				// Fly to ground if the focused element moves out of bounds
				focusOnGround();
			}
		}

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		if (currentAnimation.draw(ctx, direction, animStart, species[currentTheme])) {
			setAnimation(Animations.STILL);
		}

		// Update HTML element position
		setX(birdX);
		setY(birdY);
	}

	init();
	draw();

	/**
	 * Create an HTML element with the specified parameters
	 * @param {string} className
	 * @param {string} [textContent]
	 * @param {string} [id]
	 * @returns {HTMLElement}
	 */
	function makeElement(className, textContent, id) {
		const element = document.createElement("div");
		element.classList.add(className);
		if (textContent) {
			element.textContent = textContent;
		}
		if (id) {
			element.id = id;
		}
		return element;
	}

	function insertDecoration() {
		// Create a canvas element for the decoration
		const decorationCanvas = document.createElement("canvas");
		decorationCanvas.classList.add("birb-decoration");
		decorationCanvas.width = DECORATIONS_SPRITE_WIDTH * CANVAS_PIXEL_SIZE;
		decorationCanvas.height = DECORATIONS_SPRITE_WIDTH * CANVAS_PIXEL_SIZE;
		const decorationCtx = decorationCanvas.getContext("2d");
		if (!decorationCtx) {
			return;
		}
		// Draw the decoration
		DECORATION_ANIMATIONS.mac.draw(decorationCtx, Directions.LEFT, Date.now());
		// Add the decoration to the page
		document.body.appendChild(decorationCanvas);
		makeDraggable(decorationCanvas, false);
	}

	function activateFeather() {
		if (document.querySelector("#" + FEATHER_ID)) {
			return;
		}
		const themes = Object.keys(species).filter((theme) => !unlockedThemes.includes(theme));
		if (themes.length === 0) {
			// No more themes to unlock
			return;
		}
		const birdType = themes[Math.floor(Math.random() * themes.length)];
		insertFeather(birdType);
	}

	/**
	 * @param {string} birdType
	 */
	function insertFeather(birdType) {
		let theme = species[birdType];
		const featherCanvas = document.createElement("canvas");
		featherCanvas.id = FEATHER_ID;
		featherCanvas.classList.add("birb-decoration");
		featherCanvas.width = FEATHER_SPRITE_WIDTH * CANVAS_PIXEL_SIZE;
		featherCanvas.height = FEATHER_SPRITE_WIDTH * CANVAS_PIXEL_SIZE;
		const x = featherCanvas.width * 2 + Math.random() * (window.innerWidth - featherCanvas.width * 4);
		featherCanvas.style.marginLeft = `${x}px`;
		featherCanvas.style.top = `${-featherCanvas.height}px`;
		const featherCtx = featherCanvas.getContext("2d");
		if (!featherCtx) {
			return;
		}
		FEATHER_ANIMATIONS.feather.draw(featherCtx, Directions.LEFT, Date.now(), theme);
		document.body.appendChild(featherCanvas);
		onClick(featherCanvas, () => {
			unlockBird(birdType);
			removeFeather();
			if (document.querySelector("#" + FIELD_GUIDE_ID)) {
				removeFieldGuide();
				insertFieldGuide();
			}
		});
	}

	function removeFeather() {
		const feather = document.querySelector("#" + FEATHER_ID);
		if (feather) {
			feather.remove();
		}
	}

	/**
	 * @param {string} birdType
	 */
	function unlockBird(birdType) {
		if (!unlockedThemes.includes(birdType)) {
			unlockedThemes.push(birdType);
			insertModal("New Bird Unlocked!", `You've found a <b>${species[birdType].name}</b> feather! Use the Field Guide to switch your bird's theme.`);
		}
	}

	function updateFeather() {
		const feather = document.querySelector("#birb-feather");
		const featherGravity = 1;
		if (!feather || !(feather instanceof HTMLElement)) {
			return;
		}
		const y = parseInt(feather.style.top || "0") + featherGravity;
		feather.style.top = `${Math.min(y, window.innerHeight - feather.offsetHeight)}px`;
		if (y < window.innerHeight - feather.offsetHeight) {
			feather.style.left = `${Math.sin(3.14 * 2 * (ticks / 120)) * 25}px`;
		}
	}
	

	// insertDecoration();
	// insertFieldGuide();

	/**
	 * @param {string} title
	 * @param {string} message
	 */
	function insertModal(title, message) {
		if (document.querySelector("#" + FIELD_GUIDE_ID)) {
			return;
		}
		let html = `
			<div class="birb-window-header">
				<div class="birb-window-title">${title}</div>
				<div class="birb-window-close">x</div>
			</div>
			<div class="birb-window-content">
				<div class="birb-message-content">
					${message}
				</div>
			</div>`
		const modal = makeElement("birb-window");
		modal.style.width = "270px";
		modal.innerHTML = html;
		modal.style.left = `${window.innerWidth / 2 - 115}px`;
		modal.style.top = `${window.innerHeight / 2 - 115}px`;
		document.body.appendChild(modal);
		makeDraggable(modal.querySelector(".birb-window-header"));

		const closeButton = modal.querySelector(".birb-window-close");
		if (closeButton) {
			makeClosable(() => {
				modal.remove();
			}, closeButton);
		}
	}

	function insertFieldGuide() {
		if (document.querySelector("#" + FIELD_GUIDE_ID)) {
			return;
		}
		let html = `
			<div class="birb-window-header">
				<div class="birb-window-title">Field Guide</div>
				<div class="birb-window-close">x</div>
			</div>
			<div class="birb-window-content">
				<div class="birb-grid-content"></div>
				<div class="birb-field-guide-description"></div>
			</div>`
		const fieldGuide = makeElement("birb-window", undefined, FIELD_GUIDE_ID);
		fieldGuide.innerHTML = html;
		fieldGuide.style.left = `${window.innerWidth / 2 - 115}px`;
		fieldGuide.style.top = `${window.innerHeight / 2 - 115}px`;
		document.body.appendChild(fieldGuide);
		makeDraggable(fieldGuide.querySelector(".birb-window-header"));

		const closeButton = fieldGuide.querySelector(".birb-window-close");
		if (closeButton) {
			makeClosable(() => {
				fieldGuide.remove();
			}, closeButton);
		}

		const content = fieldGuide.querySelector(".birb-grid-content");
		if (!content) {
			return;
		}
		content.innerHTML = "";

		const generateDescription = (/** @type {string} */ themeId) => {
			const theme = species[themeId];
			const unlocked = unlockedThemes.includes(themeId);
			return "<b>" + theme.name + "</b><div style='height: 0.3em'></div>" + (!unlocked ? "Not yet unlocked" : theme.description);
		};

		const description = fieldGuide.querySelector(".birb-field-guide-description");
		if (!description) {
			return;
		}
		description.innerHTML = generateDescription(currentTheme);
		for (const [id, theme] of Object.entries(species)) {
			const unlocked = unlockedThemes.includes(id);
			const themeElement = makeElement("birb-grid-item");
			if (id === currentTheme) {
				themeElement.classList.add("birb-grid-item-selected");
			}
			const themeCanvas = document.createElement("canvas");
			themeCanvas.width = SPRITE_WIDTH * CANVAS_PIXEL_SIZE;
			themeCanvas.height = SPRITE_HEIGHT * CANVAS_PIXEL_SIZE;
			const themeCtx = themeCanvas.getContext("2d");
			if (!themeCtx) {
				return;
			}
			birbFrames.base.draw(themeCtx, Directions.RIGHT, theme);
			themeElement.appendChild(themeCanvas);
			content.appendChild(themeElement);
			if (unlocked) {
				onClick(themeElement, () => {
					switchTheme(id);
					document.querySelectorAll(".birb-grid-item").forEach((element) => {
						element.classList.remove("birb-grid-item-selected");
					});
					themeElement.classList.add("birb-grid-item-selected");
				});
			} else {
				themeElement.classList.add("birb-grid-item-locked");
			}
			themeElement.addEventListener("mouseover", () => {
				console.log("mouseover");
				description.innerHTML = generateDescription(id);
			});
			themeElement.addEventListener("mouseout", () => {
				description.innerHTML = generateDescription(currentTheme);
			});
		}
	}

	/**
	 * @param {() => void} func
	 * @param {Element} [closeButton]
	 */
	function makeClosable(func, closeButton) {
		if (closeButton) {
			onClick(closeButton, func);
		}
		document.addEventListener("keydown", (e) => {
			if (e.key === "Escape") {
				func();
			}
		});
	}

	function removeFieldGuide() {
		const fieldGuide = document.querySelector("#" + FIELD_GUIDE_ID);
		if (fieldGuide) {
			fieldGuide.remove();
		}
	}

	// insertPico8();

	function isSafari() {
		return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
	}

	/**
	 * @param {string} name
	 * @param {string} pid
	 */
	function insertPico8(name, pid) {
		let html = `
			<div class="birb-window-header">
				<div class="birb-window-title">${name}</div>
				<div class="birb-window-close">x</div>
			</div>
			<div class="birb-window-content birb-pico-8-content">
				<iframe src="https://www.lexaloffle.com/bbs/widget.php?pid=${pid}" scrolling='${isSafari() ? "yes" : "no"}'></iframe>
			</div>`
		const pico8 = makeElement("birb-window");
		pico8.innerHTML = html;
		pico8.style.left = `${window.innerWidth / 2 - 115}px`;
		pico8.style.top = `${window.innerHeight / 2 - 115}px`;
		document.body.appendChild(pico8);
		makeDraggable(pico8.querySelector(".birb-window-header"));
		const close = pico8.querySelector(".birb-window-close");
		if (close) {
			makeClosable(() => {
				pico8.remove();
			}, close);
		}
	}

	function insertMusicPlayer() {
		let html = `
			<div class="birb-window-header">
				<div class="birb-window-title">Music Player</div>
				<div class="birb-window-close">x</div>
			</div>
			<div class="birb-window-content birb-music-player-content">
			<iframe style="border-radius:12px" src="https://open.spotify.com/embed/playlist/31FWVQBp3WQydWLNhO0ACi?utm_source=generator" width="250" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
		</div>`;
		const pico8 = makeElement("birb-window");
		pico8.innerHTML = html;
		pico8.style.left = `${window.innerWidth / 2 - 115}px`;
		pico8.style.top = `${window.innerHeight / 2 - 115}px`;
		document.body.appendChild(pico8);
		makeDraggable(pico8.querySelector(".birb-window-header"));
		const close = pico8.querySelector(".birb-window-close");
		if (close) {
			makeClosable(() => {
				pico8.remove();
			}, close);
		}
	}

	/**
	 * @param {string} theme
	 */
	function switchTheme(theme) {
		currentTheme = theme;
	}

	/**
	 * Add the menu to the page if it doesn't already exist
	 */
	function insertMenu() {
		if (document.querySelector("#" + MENU_ID)) {
			return;
		}
		let menu = makeElement("birb-window", undefined, MENU_ID);
		let header = makeElement("birb-window-header");
		header.innerHTML = '<div class="birb-window-title">birbOS</div>';
		let content = makeElement("birb-window-content");
		for (const item of menuItems) {
			content.appendChild(makeMenuItem(item));
		}
		menu.appendChild(header);
		menu.appendChild(content);
		document.body.appendChild(menu);
		makeDraggable(document.querySelector(".birb-window-header"));

		let menuExit = makeElement("birb-window-exit", undefined, MENU_EXIT_ID);
		onClick(menuExit, () => {
			removeMenu();
		});
		document.body.appendChild(menuExit);
		makeClosable(removeMenu);

		updateMenuLocation(menu);
	}

	/**
	 * Update the menu's location based on the bird's position
	 * @param {HTMLElement} menu
	 */
	function updateMenuLocation(menu) {
		let x = birdX;
		let y = canvas.offsetTop + canvas.height / 2 + WINDOW_PIXEL_SIZE * 10;
		const offset = 20;
		if (x < window.innerWidth / 2) {
			// Left side
			x += offset;
		} else {
			// Right side
			x -= menu.offsetWidth + offset;
		}
		if (y > window.innerHeight / 2) {
			// Top side
			y -= menu.offsetHeight + offset + 10;
		} else {
			// Bottom side
			y += offset;
		}
		menu.style.left = `${x}px`;
		menu.style.top = `${y}px`;
	}

	/**
	 * @param {MenuItem[]} menuItems
	 */
	function switchMenuItems(menuItems) {
		const menu = document.querySelector("#" + MENU_ID);
		if (!menu || !(menu instanceof HTMLElement)) {
			return;
		}
		const content = menu.querySelector(".birb-window-content");
		if (!content) {
			console.error("Content not found");
			return;
		}
		content.innerHTML = "";
		for (const item of menuItems) {
			content.appendChild(makeMenuItem(item));
		}
		updateMenuLocation(menu);
	}

	/**
	 * @param {MenuItem} item
	 * @returns {HTMLElement}
	 */
	function makeMenuItem(item) {
		if (item instanceof Separator) {
			return makeElement("birb-window-separator");
		}
		let menuItem = makeElement("birb-window-list-item", item.text);
		onClick(menuItem, () => {
			if (item.removeMenu) {
				removeMenu();
			}
			item.action();
		});
		return menuItem;
	}

	/**
	 * @param {Document|Element} element
	 * @param {(e: Event) => void} action
	 */
	function onClick(element, action) {
		element.addEventListener("click", (e) => action(e));
		element.addEventListener("touchstart", (e) => action(e));
	}

	/**
	 * Remove the menu from the page
	 */
	function removeMenu() {
		const menu = document.querySelector("#" + MENU_ID);
		if (menu) {
			menu.remove();
		}
		const exitMenu = document.querySelector("#" + MENU_EXIT_ID);
		if (exitMenu) {
			exitMenu.remove();
		}
	}

	/**
	 * @returns {boolean} Whether the menu element is on the page
	 */
	function isMenuOpen() {
		return document.querySelector("#" + MENU_ID) !== null;
	}

	/**
	 * @param {HTMLElement|null} element
	 */
	function makeDraggable(element, parent = true) {
		if (!element) {
			return;
		}

		let isMouseDown = false;
		let offsetX = 0;
		let offsetY = 0;

		if (parent) {
			element = element.parentElement;
		}

		if (!element) {
			console.error("Birb: Parent element not found");
			return;
		}

		element.addEventListener("mousedown", (e) => {
			isMouseDown = true;
			offsetX = e.clientX - element.offsetLeft;
			offsetY = e.clientY - element.offsetTop;
		});

		element.addEventListener("touchstart", (e) => {
			isMouseDown = true;
			const touch = e.touches[0];
			offsetX = touch.clientX - element.offsetLeft;
			offsetY = touch.clientY - element.offsetTop;
			e.preventDefault();
		});

		document.addEventListener("mouseup", () => {
			isMouseDown = false;
		});

		document.addEventListener("touchend", () => {
			isMouseDown = false;
		});

		document.addEventListener("mousemove", (e) => {
			if (isMouseDown) {
				element.style.left = `${e.clientX - offsetX}px`;
				element.style.top = `${e.clientY - offsetY}px`;
			}
		});

		document.addEventListener("touchmove", (e) => {
			if (isMouseDown) {
				const touch = e.touches[0];
				element.style.left = `${touch.clientX - offsetX}px`;
				element.style.top = `${touch.clientY - offsetY}px`;
			}
		});
	}

	/**
	 * @param {string[][]} array
	 * @param {number} sprite
	 * @param {number} [width]
	 * @returns {string[][]}
	 */
	function getLayer(array, sprite, width = SPRITE_WIDTH) {
		// From an array of a horizontal sprite sheet, get the layer for a specific sprite
		const layer = [];
		for (let y = 0; y < width; y++) {
			layer.push(array[y].slice(sprite * width, (sprite + 1) * width));
		}
		return layer;
	}

	/**
	 * Update the birds location from the start to the target location on a parabolic path
	 * @param {number} speed The speed of the bird along the path
	 * @param {number} [intensity] The intensity of the parabolic path
	 * @returns {boolean} Whether the bird has reached the target location
	 */
	function updateParabolicPath(speed, intensity = 2.5) {
		const dx = targetX - startX;
		const dy = targetY - startY;
		const distance = Math.sqrt(dx * dx + dy * dy);
		const time = Date.now() - stateStart;
		if (distance > Math.max(window.innerWidth, window.innerHeight) / 2) {
			speed *= 1.3;
		}
		const amount = Math.min(1, time / (distance / speed));
		const { x, y } = parabolicLerp(startX, startY, targetX, targetY, amount, intensity);
		birdX = x;
		birdY = y;
		const complete = Math.abs(birdX - targetX) < 1 && Math.abs(birdY - targetY) < 1;
		if (complete) {
			birdX = targetX;
			birdY = targetY;
		} else {
			direction = targetX > birdX ? Directions.RIGHT : Directions.LEFT;
		}
		return complete;
	}

	function getFocusedElementRandomX() {
		if (focusedElement === null) {
			return Math.random() * window.innerWidth;
		}
		const rect = focusedElement.getBoundingClientRect();
		return Math.random() * (rect.right - rect.left) + rect.left;
	}

	function getFocusedElementY() {
		if (focusedElement === null) {
			return 0;
		}
		const rect = focusedElement.getBoundingClientRect();
		return window.innerHeight - rect.top;
	}

	function focusOnGround() {
		if (focusedElement === null) {
			return;
		}
		focusedElement = null;
		flyTo(Math.random() * window.innerWidth, 0);
	}

	function focusOnElement() {
		const images = document.querySelectorAll("img");
		const inWindow = Array.from(images).filter((img) => {
			const rect = img.getBoundingClientRect();
			return rect.left >= 0 && rect.top >= 0 + 100 && rect.right <= window.innerWidth && rect.top <= window.innerHeight;
		});
		const MIN_SIZE = 100;
		const largeImages = Array.from(inWindow).filter((img) => img !== focusedElement && img.width >= MIN_SIZE && img.height >= MIN_SIZE);
		if (largeImages.length === 0) {
			return;
		}
		const randomImage = largeImages[Math.floor(Math.random() * largeImages.length)];
		focusedElement = randomImage;
		flyTo(getFocusedElementRandomX(), getFocusedElementY());
	}

	function getCanvasWidth() {
		return canvas.width * CSS_SCALE
	}

	function getCanvasHeight() {
		return canvas.height * CSS_SCALE
	}

	function hop() {
		if (currentState === States.IDLE) {
			// Determine bounds for hopping
			let minX = 0;
			let maxX = window.innerWidth;
			let y = 0;
			if (focusedElement !== null) {
				// Hop on the element
				const rect = focusedElement.getBoundingClientRect();
				minX = rect.left;
				maxX = rect.right;
				y = window.innerHeight - rect.top;
			}
			setState(States.HOP);
			setAnimation(Animations.FLYING);
			if ((Math.random() < 0.5 && birdX - HOP_DISTANCE > minX) || birdX + HOP_DISTANCE > maxX) {
				targetX = birdX - HOP_DISTANCE;
			} else {
				targetX = birdX + HOP_DISTANCE;
			}
			targetY = y;
		}
	}

	function pet() {
		if (currentState === States.IDLE) {
			setAnimation(Animations.HEART);
		}
	}

	function hideBirb() {
		canvas.style.display = "none";
		visible = false;
	}

	/**
	 * @param {number} x
	 * @param {number} y
	 */
	function flyTo(x, y) {
		targetX = x;
		targetY = y;
		setState(States.FLYING);
		setAnimation(Animations.FLYING);
	}

	/**
	 * Set the current animation and reset the animation timer
	 * @param {Anim} animation
	 */
	function setAnimation(animation) {
		currentAnimation = animation;
		animStart = Date.now();
	}

	/**
	 * Set the current state and reset the state timer
	 * @param {string} state
	 */
	function setState(state) {
		stateStart = Date.now();
		startX = birdX;
		startY = birdY;
		currentState = state;
		if (state === States.IDLE) {
			setAnimation(Animations.BOB);
		}
	}

	/**
	 * @param {number} x
	 */
	function setX(x) {
		let mod = getCanvasWidth() / -2 - (WINDOW_PIXEL_SIZE * (direction === Directions.RIGHT ? 2 : -2));
		canvas.style.left = `${x + mod}px`;
	}

	/**
	 * @param {number} y
	 */
	function setY(y) {
		canvas.style.bottom = `${y}px`;
	}
});

/**
 * @param {number} start
 * @param {number} end
 * @param {number} amount
 * @returns {number}
 */
function linearLerp(start, end, amount) {
	return start + (end - start) * amount;
}

/**
 * @param {number} startX
 * @param {number} startY
 * @param {number} endX
 * @param {number} endY
 * @param {number} amount
 * @param {number} [intensity]
 * @returns {{x: number, y: number}}
 */
function parabolicLerp(startX, startY, endX, endY, amount, intensity = 1.2) {
	const dx = endX - startX;
	const dy = endY - startY;
	const distance = Math.sqrt(dx * dx + dy * dy);
	const angle = Math.atan2(dy, dx);
	const midX = startX + Math.cos(angle) * distance / 2;
	const midY = startY + Math.sin(angle) * distance / 2 + distance / 4 * intensity;
	const t = amount;
	const x = (1 - t) ** 2 * startX + 2 * (1 - t) * t * midX + t ** 2 * endX;
	const y = (1 - t) ** 2 * startY + 2 * (1 - t) * t * midY + t ** 2 * endY;
	return { x, y };
}

/**
 * @param {number} value
 */
function roundToPixel(value) {
	return Math.round(value / WINDOW_PIXEL_SIZE) * WINDOW_PIXEL_SIZE;
}

/**
 * @returns {boolean} Whether the user is on a mobile device
 */
function isMobile() {
	return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}