import Phaser from 'phaser';
import './style.css';

// =====================================================================
// PSEUDO-3D PIVOT — Iteration 3D-1
// আগের ভার্সন gravity/jump দিয়ে উপর-নিচ dodge করতো (Flappy Bird স্টাইল)।
// এখন থেকে Subway Surfer স্টাইল: ৩-লেন (left/center/right), অবজেক্টগুলো
// দূরে (ছোট) স্পন হয়ে ক্যারেক্টারের দিকে বড় হতে হতে আসে (perspective scale
// trick — আসল 3D ক্যামেরা না, কিন্তু depth-এর illusion তৈরি করে)।
//
// আগের সিস্টেম থেকে যা রিইউজ করা হয়েছে (লজিক অপরিবর্তিত/সামান্য adapt করা):
//   - Score counter, difficulty scaling ধারণা, sound effects (Web Audio API)
//   - Vignette decoration (ground-এ scroll করা, unaffected — এখনো background flavor)
//   - আর্ট assets (neta, pole, bonus icons) — পিলার আর্ট এখন বরং নতুন 3D
//     রেফারেন্সের (কাঠ/বার্ক টেক্সচার) সাথে আগের চেয়ে ভালো মানানসই, তাই আপাতত
//     রিইউজ করা হলো, রিভিশনের দরকার নাই মনে হচ্ছে
// =====================================================================

import runnerFrame1Png from './assets/art/png/runner_frame1.png?no-inline';
import runnerFrame2Png from './assets/art/png/runner_frame2.png?no-inline';
import electricPolePng from './assets/art/png/electric_pole.png?no-inline';
import streetBackgroundPng from './assets/art/png/street_background.png?no-inline';
import heartIconPng from './assets/art/png/heart_icon.png?no-inline';
import moneyIconPng from './assets/art/png/money_icon.png?no-inline';
import bonusChadabajPng from './assets/art/png/bonus_chadabaj.png?no-inline';
import bonusChintaikariPng from './assets/art/png/bonus_chintaikari.png?no-inline';
import bonusShontrashiPng from './assets/art/png/bonus_shontrashi.png?no-inline';
import vignetteAccidentBaseSvg from './assets/art/vignette_accident_base.svg?no-inline';
import vignetteAccidentArmSvg from './assets/art/vignette_accident_arm.svg?no-inline';
import vignetteKissBaseSvg from './assets/art/vignette_kiss_base.svg?no-inline';
import vignetteKissHeartSvg from './assets/art/vignette_kiss_heart.svg?no-inline';
import vignetteEscapeBaseSvg from './assets/art/vignette_escape_base.svg?no-inline';
import vignetteEscapeLegsSvg from './assets/art/vignette_escape_legs.svg?no-inline';
import vignetteEscapeArmsSvg from './assets/art/vignette_escape_arms.svg?no-inline';
import vignetteThugBaseSvg from './assets/art/vignette_thug_base.svg?no-inline';
import vignetteThugArmSvg from './assets/art/vignette_thug_arm.svg?no-inline';
import vignetteThugShopkeeperArmsSvg from './assets/art/vignette_thug_shopkeeper_arms.svg?no-inline';
import vignetteFakeGuruBaseSvg from './assets/art/vignette_fake_guru_base.svg?no-inline';
import vignetteFakeGuruBeadsSvg from './assets/art/vignette_fake_guru_beads.svg?no-inline';
import vignetteFakeGuruDevoteeArmSvg from './assets/art/vignette_fake_guru_devotee_arm.svg?no-inline';
import vignetteHelicopterBaseSvg from './assets/art/vignette_helicopter_base.svg?no-inline';
import vignetteHelicopterRotorSvg from './assets/art/vignette_helicopter_rotor.svg?no-inline';
import vignetteFuelCrisisBaseSvg from './assets/art/vignette_fuel_crisis_base.svg?no-inline';
import vignetteFuelCrisisArmsSvg from './assets/art/vignette_fuel_crisis_arms.svg?no-inline';
import vignetteRedFistBaseSvg from './assets/art/vignette_red_fist_base.svg?no-inline';
import vignetteRedFistSawSvg from './assets/art/vignette_red_fist_saw.svg?no-inline';
// ---- Iteration 8: "লোডশেডিং ওভারলে" প্যাক — বোনাস পপ-আপের "রক্তমাখা" ইফেক্টের
// জন্য নতুন blood-splatter আর্ট (ফিচার #৩, manifesto দ্রষ্টব্য) ----
import bonusSplatterSvg from './assets/art/bonus_splatter.svg?no-inline';

// ---- Iteration 8: কাস্টম সাউন্ড ফাইল ----
import poleHitSfxFile from './assets/sfx/electric-shock.mp3?no-inline';
import gameOverSfxFile from './assets/sfx/gameover_background.mp3?no-inline';
import bonusChadabajSfxFile from './assets/sfx/chadabaj.mp3?no-inline';
import bonusChintaikariSfxFile from './assets/sfx/chintaikari.mp3?no-inline';
import bonusShontrashiSfxFile from './assets/sfx/sontrasii.mp3?no-inline';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 450;

// ইউজারের ফিডব্যাক: নতুন street_background.png আর্টের রাস্তা canvas-এর তুলনায়
// সরু লাগছিল, ফলে রাস্তার পাশের satire দৃশ্য (red fist, gas station ইত্যাদি) লেনের
// কাছে চলে আসছিল। ব্যাকগ্রাউন্ড ইমেজটাকে কেন্দ্র বরাবর zoom-in/crop করে (canvas-এর
// চেয়ে বড় সাইজে বসিয়ে, বাইরের অংশ Phaser নিজে থেকেই ক্লিপ করে দেয়) রাস্তাটাকে
// visually বড়/চওড়া দেখানো হচ্ছে, পাশের দৃশ্যগুলো স্ক্রিনের বাইরে সরে যাচ্ছে —
// সংখ্যাটা বাড়ালে (>1.35) আরও বেশি zoom/crop হবে, কমালে কম
const BG_ZOOM = 1.35;

// ---- Lane system ----
const LANE_COUNT = 3;
// Iteration PNG-4 fix: নতুন street_background.png আর্টে রাস্তাটা আসলে অনেক সরু
// (sidewalk/দোকানের তুলনায়) — পিক্সেল অ্যানালাইসিস করে দেখা গেছে NEAR_Y পজিশনে
// রাস্তার সাদা দাগের ভেতরের space মাত্র ~x=314 থেকে x=511 (width ~197px), কিন্তু
// আগের LANE_SPACING=190 প্রায় পুরো রাস্তার সমান চওড়া ছিল, তাই left/right লেন সরাসরি
// ফুটপাতে চলে যাচ্ছিল। এখন লেনগুলো রাস্তার সাদা দাগের ভেতরেই আঁটানো হলো।
const LANE_CENTER_X = 412;
const LANE_SPACING = 70; // near (নিচের) পজিশনে দুই লেনের মাঝে দূরত্ব
const LANE_X = [
  LANE_CENTER_X - LANE_SPACING,
  LANE_CENTER_X,
  LANE_CENTER_X + LANE_SPACING,
];
const START_LANE = 1; // মাঝের লেনে শুরু

// ---- Perspective (ভ্যানিশিং পয়েন্ট) ----
// নতুন background আর্টের রাস্তার দুই ধারের রেখা যেখানে গিয়ে মেলে (pixel অ্যানালাইসিস
// করে বের করা আসল vanishing point), তার সাথে মিলিয়ে বসানো হলো — VANISH_X কে আর
// LANE_CENTER_X-এর সমান ধরা হচ্ছে না, কারণ আর্টে রাস্তা সামান্য অসমমিত (asymmetric)
const VANISH_X = 407;
const VANISH_Y = 242;
const NEAR_Y = GAME_HEIGHT - 93; // ক্যারেক্টার এই Y-তে ফিক্সড থাকবে (character বড় হওয়ায় পা একই জায়গায় রাখতে সমন্বয় করা হলো)

const CHAR_DISPLAY_WIDTH = 70;
const CHAR_DISPLAY_HEIGHT = 100;
const CHAR_HITBOX_WIDTH = 40;
const CHAR_HITBOX_HEIGHT = 76;
const LANE_SWITCH_TWEEN_MS = 140;
const CHAR_RUN_FRAME_MS = 150; // দুই running frame-এর মধ্যে toggle করার গতি

// ---- Obstacle (পিলার) ----
// Iteration PNG-3 fix: ইউজার চেয়েছে কাছে আসা obstacle পোল background আর্টের
// static পোলের সমান বড় লাগুক — আরও বড় করা হলো, আর bottom-anchor (origin 0.5,1)
// করা হয়েছে যাতে পোল মাটির লাইন থেকেই বড় হয়ে ওপরের দিকে বাড়ে (কেন্দ্র থেকে না)
const OBSTACLE_DISPLAY_W = 125;
const OBSTACLE_DISPLAY_H = 260;
const OBSTACLE_HIT_T = 0.93; // t এই ভ্যালু পার হলে collision চেক হবে
const OBSTACLE_DESPAWN_T = 1.08;

// ---- বোনাস আইটেম ----
const BONUS_TYPES = [
  { key: 'chadabaj', texture: 'bonusChadabaj', name: 'চাঁদাবাজ' },
  { key: 'chintaikari', texture: 'bonusChintaikari', name: 'ছিনতাইকারি' },
  { key: 'shontrashi', texture: 'bonusShontrashi', name: 'সন্ত্রাসী' },
];
// ইউজারের চাওয়া অনুযায়ী: বোনাস আইটেম ক্যারেক্টার কাছে এলে (t=1, perspective scale
// সর্বোচ্চ 1.15x) মূল ক্যারেক্টারের সমান সাইজ দেখাবে — তাই base size টা 1.15 দিয়ে
// ভাগ করে রাখা হলো, যাতে scale করার পর ফাইনাল সাইজ CHAR_DISPLAY_WIDTH/HEIGHT-এর সমান হয়
const BONUS_DISPLAY_WIDTH = CHAR_DISPLAY_WIDTH / 1.15; // ≈ 45.2
const BONUS_DISPLAY_HEIGHT = CHAR_DISPLAY_HEIGHT / 1.15; // ≈ 64.3
const BONUS_SCORE_VALUE = 10;
const MONEY_BAR_SCORE_STEP = 50; // প্রতি ৫০ স্কোরে money bar একবার পূর্ণ হয়ে রিসেট হবে (cosmetic)

// ---- Difficulty scaling (আগের কনসেপ্ট, নতুন প্যারামিটারে adapt করা) ----
const TRAVEL_MS_BASE = 2200; // দূর থেকে কাছে আসতে কত সময় লাগবে (শুরুতে)
const TRAVEL_MS_MIN = 1250;
const TRAVEL_MS_DECREMENT = 130;
const OBSTACLE_SPAWN_MS_BASE = 1500;
const OBSTACLE_SPAWN_MS_MIN = 850;
const OBSTACLE_SPAWN_MS_DECREMENT = 90;
const BONUS_SPAWN_MS = 3000; // ইউজারের চাওয়া: বোনাস আইটেম যেন মিনিমাম ৩ সেকেন্ড ব্যবধানে আসে, নাহলে "খাওয়ার" সাউন্ড ওভারল্যাপ করে বাজে
const DIFFICULTY_TICK_MS = 12000;
const BG_SCROLL_SPEED_BASE = 170; // background parallax-এর জন্য (পুরনো কনসেপ্ট থেকে)
const BG_SCROLL_SPEED_MAX = 320;
const BG_SCROLL_SPEED_INCREMENT = 15;

const GROUND_HEIGHT = 50;
const HILL_HEIGHT = 260; // এখন এটা "দূরের বিল্ডিং স্কাইলাইন" লেয়ারের উচ্চতা (আগে সবুজ পাহাড় ছিল)
const GROUND_SCROLL_FACTOR = 1;
const HILL_SCROLL_FACTOR = 0.35;

// ---- Vignette (রাস্তার ধারের decoration) — Iteration 3D-6: layered limb-animation ----
// প্রতিটা vignette এখন "base" (স্থির অংশ) + এক বা একাধিক "part" (pivot-এর চারপাশে
// ঘোরা/দোলা movable অংশ) দিয়ে গঠিত। pivot পিক্সেল কোঅর্ডিনেট আসল SVG viewBox
// অনুযায়ী, রানটাইমে fraction-এ কনভার্ট করে ব্যবহার হয়।
const VIGNETTE_TYPES = [
  {
    key: 'accident',
    viewBox: { w: 240, h: 200 },
    baseTexture: 'vignetteAccidentBase',
    parts: [
      {
        texture: 'vignetteAccidentArm',
        pivot: [46, 104],
        motion: { type: 'swing', angle: 10, duration: 190 },
      },
    ],
  },
  {
    key: 'kiss',
    viewBox: { w: 220, h: 150 },
    baseTexture: 'vignetteKissBase',
    parts: [
      {
        texture: 'vignetteKissHeart',
        pivot: [110, 45],
        motion: { type: 'float', amplitude: 14, duration: 1400 },
      },
    ],
  },
  {
    key: 'escape',
    viewBox: { w: 220, h: 150 },
    baseTexture: 'vignetteEscapeBase',
    parts: [
      {
        texture: 'vignetteEscapeLegs',
        pivot: [140, 108],
        motion: { type: 'swing', angle: 11, duration: 150 },
      },
      {
        texture: 'vignetteEscapeArms',
        pivot: [136, 67],
        motion: { type: 'swing', angle: 11, duration: 150, invert: true },
      },
    ],
  },
  {
    key: 'thug',
    viewBox: { w: 220, h: 150 },
    baseTexture: 'vignetteThugBase',
    parts: [
      {
        texture: 'vignetteThugArm',
        pivot: [70, 58],
        motion: { type: 'swing', angle: 9, duration: 210 },
      },
      {
        texture: 'vignetteThugShopkeeperArms',
        pivot: [165, 90],
        motion: { type: 'swing', angle: 4, duration: 90 },
      },
    ],
  },
  {
    key: 'fakeGuru',
    viewBox: { w: 220, h: 150 },
    baseTexture: 'vignetteFakeGuruBase',
    parts: [
      {
        texture: 'vignetteFakeGuruBeads',
        pivot: [48, 82],
        motion: { type: 'swing', angle: 6, duration: 520 },
      },
      {
        texture: 'vignetteFakeGuruDevoteeArm',
        pivot: [182, 100],
        motion: { type: 'swing', angle: 8, duration: 320 },
      },
    ],
  },
  {
    key: 'helicopter',
    viewBox: { w: 220, h: 150 },
    baseTexture: 'vignetteHelicopterBase',
    parts: [
      {
        texture: 'vignetteHelicopterRotor',
        pivot: [151, 27.7],
        motion: { type: 'spin', duration: 380 },
      },
    ],
  },
  {
    key: 'fuelCrisis',
    viewBox: { w: 220, h: 150 },
    baseTexture: 'vignetteFuelCrisisBase',
    parts: [
      {
        texture: 'vignetteFuelCrisisArms',
        pivot: [106, 100],
        motion: { type: 'swing', angle: 10, duration: 110 },
      },
    ],
  },
  {
    key: 'redFist',
    viewBox: { w: 220, h: 150 },
    baseTexture: 'vignetteRedFistBase',
    parts: [
      {
        texture: 'vignetteRedFistSaw',
        pivot: [110, 126],
        motion: { type: 'swing', angle: 6, duration: 160 },
      },
    ],
  },
];
const VIGNETTE_DISPLAY_WIDTH = 150;
const VIGNETTE_DISPLAY_HEIGHT = 102;
const VIGNETTE_SPAWN_INTERVAL_MS = 9000;
// ---- Iteration 3D-7: vignette-ও এখন perspective দিয়ে দূর থেকে আসবে (পিলার/বোনাসের মতো) ----
const ROADSIDE_NEAR_OFFSET = 323; // রাস্তার পাশে, লেনের বাইরে কতদূর — LANE_SPACING থেকে আলাদা রাখা হলো যাতে লেন সরু করলেও roadside vignette-এর জায়গা না বদলায়
const VIGNETTE_FAR_SCALE = 0.22;
const VIGNETTE_NEAR_SCALE = 1.25;
const VIGNETTE_DESPAWN_T = 1.35; // ১.০ পার হয়েও কিছুদূর চলে যাবে, তারপর despawn

// =====================================================================
// Iteration 3D-2: Title Screen — "Bangladesh Politics" ব্লাড-ড্রিপ স্টাইল
// =====================================================================
const TITLE_TEXT = 'Bangladesh Politics';
const BLOOD_COLOR = 0x8a0303;
const BLOOD_COLOR_DARK = 0x4a0101;

class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#0d0d0d');

    // Google Font (Nosifer, horror-drip স্টাইল) লোড হওয়ার অপেক্ষা করা — না হলে
    // প্রথমবার fallback ফন্টে দেখাতে পারে। document.fonts.ready ব্যবহার করে
    // নিশ্চিত হওয়া হচ্ছে আসল ফন্ট দিয়েই টেক্সট আঁকা হচ্ছে।
    const renderTitle = () => {
      const titleText = this.add
        .text(GAME_WIDTH / 2, 150, TITLE_TEXT, {
          fontFamily: '"Nosifer", Impact, sans-serif',
          fontSize: '46px',
          color: '#c40808',
          stroke: '#3d0000',
          strokeThickness: 6,
          align: 'center',
          wordWrap: { width: GAME_WIDTH - 60 },
        })
        .setOrigin(0.5);

      // ---- Blood drip shapes — টাইটেল টেক্সটের নিচের সীমানা বরাবর কয়েকটা
      // এলোমেলো "ফোঁটা গড়িয়ে পড়ছে" শেপ (teardrop) আঁকা হচ্ছে ----
      const dripGfx = this.add.graphics();
      const bounds = titleText.getBounds();
      const dripCount = 9;
      for (let i = 0; i < dripCount; i++) {
        const dx = Phaser.Math.Between(0, bounds.width);
        const x = bounds.x + dx;
        const startY = bounds.y + bounds.height - Phaser.Math.Between(0, 6);
        const dripLen = Phaser.Math.Between(10, 34);
        const dripW = Phaser.Math.Between(3, 7);

        dripGfx.fillStyle(BLOOD_COLOR, 1);
        dripGfx.fillRect(x - dripW / 2, startY, dripW, dripLen);
        // ফোঁটার নিচে গোল "বিন্দু" (teardrop-এর ডগা)
        dripGfx.fillStyle(BLOOD_COLOR_DARK, 1);
        dripGfx.fillCircle(x, startY + dripLen, dripW * 0.7);
      }
    };

    if (document.fonts && document.fonts.ready) {
      document.fonts.load('46px "Nosifer"').then(renderTitle).catch(renderTitle);
    } else {
      renderTitle();
    }

    // ---- সাবটাইটেল ----
    this.add
      .text(GAME_WIDTH / 2, 250, 'একটা লোডশেডিং স্যাটায়ার গেম', {
        fontSize: '18px',
        color: '#cccccc',
      })
      .setOrigin(0.5);

    // ---- Tap to start (ব্লিংক) ----
    const startText = this.add
      .text(GAME_WIDTH / 2, 340, 'Tap / Space চাপো শুরু করতে', {
        fontSize: '20px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.tweens.add({
      targets: startText,
      alpha: 0.2,
      duration: 700,
      yoyo: true,
      repeat: -1,
    });

    const goToGame = () => this.scene.start('MainScene');
    this.input.once('pointerdown', goToGame);
    this.input.keyboard.once('keydown-SPACE', goToGame);
  }
}

class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
  }

  preload() {
    // ---- Iteration PNG-1: painterly PNG sprite (আগের flat SVG runner/pole বাদ) ----
    this.load.image('runnerTexture1', runnerFrame1Png);
    this.load.image('runnerTexture2', runnerFrame2Png);
    this.load.image('poleShaftTexture', electricPolePng);
    this.load.image('streetBackground', streetBackgroundPng);
    this.load.image('heartIcon', heartIconPng);
    this.load.image('moneyIcon', moneyIconPng);

    this.load.image('bonusChadabaj', bonusChadabajPng);
    this.load.image('bonusChintaikari', bonusChintaikariPng);
    this.load.image('bonusShontrashi', bonusShontrashiPng);
    this.load.svg('vignetteAccidentBase', vignetteAccidentBaseSvg, {
      width: VIGNETTE_DISPLAY_WIDTH,
      height: VIGNETTE_DISPLAY_HEIGHT,
    });
    this.load.svg('vignetteAccidentArm', vignetteAccidentArmSvg, {
      width: VIGNETTE_DISPLAY_WIDTH,
      height: VIGNETTE_DISPLAY_HEIGHT,
    });
    this.load.svg('vignetteKissBase', vignetteKissBaseSvg, {
      width: VIGNETTE_DISPLAY_WIDTH,
      height: VIGNETTE_DISPLAY_HEIGHT,
    });
    this.load.svg('vignetteKissHeart', vignetteKissHeartSvg, {
      width: VIGNETTE_DISPLAY_WIDTH,
      height: VIGNETTE_DISPLAY_HEIGHT,
    });
    this.load.svg('vignetteEscapeBase', vignetteEscapeBaseSvg, {
      width: VIGNETTE_DISPLAY_WIDTH,
      height: VIGNETTE_DISPLAY_HEIGHT,
    });
    this.load.svg('vignetteEscapeLegs', vignetteEscapeLegsSvg, {
      width: VIGNETTE_DISPLAY_WIDTH,
      height: VIGNETTE_DISPLAY_HEIGHT,
    });
    this.load.svg('vignetteEscapeArms', vignetteEscapeArmsSvg, {
      width: VIGNETTE_DISPLAY_WIDTH,
      height: VIGNETTE_DISPLAY_HEIGHT,
    });
    this.load.svg('vignetteThugBase', vignetteThugBaseSvg, {
      width: VIGNETTE_DISPLAY_WIDTH,
      height: VIGNETTE_DISPLAY_HEIGHT,
    });
    this.load.svg('vignetteThugArm', vignetteThugArmSvg, {
      width: VIGNETTE_DISPLAY_WIDTH,
      height: VIGNETTE_DISPLAY_HEIGHT,
    });
    this.load.svg('vignetteThugShopkeeperArms', vignetteThugShopkeeperArmsSvg, {
      width: VIGNETTE_DISPLAY_WIDTH,
      height: VIGNETTE_DISPLAY_HEIGHT,
    });
    this.load.svg('vignetteFakeGuruBase', vignetteFakeGuruBaseSvg, {
      width: VIGNETTE_DISPLAY_WIDTH,
      height: VIGNETTE_DISPLAY_HEIGHT,
    });
    this.load.svg('vignetteFakeGuruBeads', vignetteFakeGuruBeadsSvg, {
      width: VIGNETTE_DISPLAY_WIDTH,
      height: VIGNETTE_DISPLAY_HEIGHT,
    });
    this.load.svg('vignetteFakeGuruDevoteeArm', vignetteFakeGuruDevoteeArmSvg, {
      width: VIGNETTE_DISPLAY_WIDTH,
      height: VIGNETTE_DISPLAY_HEIGHT,
    });
    this.load.svg('vignetteHelicopterBase', vignetteHelicopterBaseSvg, {
      width: VIGNETTE_DISPLAY_WIDTH,
      height: VIGNETTE_DISPLAY_HEIGHT,
    });
    this.load.svg('vignetteHelicopterRotor', vignetteHelicopterRotorSvg, {
      width: VIGNETTE_DISPLAY_WIDTH,
      height: VIGNETTE_DISPLAY_HEIGHT,
    });
    this.load.svg('vignetteFuelCrisisBase', vignetteFuelCrisisBaseSvg, {
      width: VIGNETTE_DISPLAY_WIDTH,
      height: VIGNETTE_DISPLAY_HEIGHT,
    });
    this.load.svg('vignetteFuelCrisisArms', vignetteFuelCrisisArmsSvg, {
      width: VIGNETTE_DISPLAY_WIDTH,
      height: VIGNETTE_DISPLAY_HEIGHT,
    });
    this.load.svg('vignetteRedFistBase', vignetteRedFistBaseSvg, {
      width: VIGNETTE_DISPLAY_WIDTH,
      height: VIGNETTE_DISPLAY_HEIGHT,
    });
    this.load.svg('vignetteRedFistSaw', vignetteRedFistSawSvg, {
      width: VIGNETTE_DISPLAY_WIDTH,
      height: VIGNETTE_DISPLAY_HEIGHT,
    });

    // ---- Iteration 8: বোনাস পপ-আপের রক্তমাখা splatter (ফিচার #৩) ----
    this.load.svg('bonusSplatter', bonusSplatterSvg, {
      width: 110,
      height: 70,
    });

    // ---- Iteration 8: কাস্টম সাউন্ড ফাইল (ফিচার #৪, #৫ + বোনাস সাউন্ড) ----
    // gameOverSfx = ব্যাকগ্রাউন্ড মিউজিক, ইলেকট্রিক শক সাউন্ডের পর লুপ আকারে বাজবে
    this.load.audio('gameOverSfx', gameOverSfxFile);       // লোডশেডিং/গেম-ওভার ব্যাকগ্রাউন্ড মিউজিক (লুপ)
    this.load.audio('poleHitSfx', poleHitSfxFile);         // পোল-হিট/শক সাউন্ড
    this.load.audio('bonusChadabajSfx', bonusChadabajSfxFile);
    this.load.audio('bonusChintaikariSfx', bonusChintaikariSfxFile);
    this.load.audio('bonusShontrashiSfx', bonusShontrashiSfxFile);
    // ফাইল না থাকা অবস্থাতেও গেম ক্র্যাশ করবে না — playCustomSound() হেল্পার
    // (নিচে সংজ্ঞায়িত) cache-এ key না পেলে চুপচাপ স্কিপ করে, আর প্রতিটা জায়গায়
    // আগের Web Audio synth টোন (playHitSound/playCollectSound) ফলব্যাক হিসেবে
    // থেকেই যাচ্ছে।
  }

  create() {
    // scene.restart() হলেও Phaser-এর global sound manager (this.sound) আগের
    // instance-গুলো ধরে রাখে — তাই আগের রাউন্ডের লুপিং ব্যাকগ্রাউন্ড মিউজিক
    // (gameOverSfx) থেমে না গিয়ে চলতে থাকতে পারে; নতুন রাউন্ড শুরুর আগেই সেটা
    // বন্ধ করে দেওয়া হচ্ছে।
    this.sound.stopByKey('gameOverSfx');

    this.cameras.main.setBackgroundColor('#a9d3e8');

    // ---- Iteration PNG-1: painterly static street background (আগের procedural
    // sky+skyline+ground Graphics বাদ দিয়ে একটাই perspective আর্ট বসানো হলো —
    // যেহেতু এটা একটা fixed vanishing-point ছবি, তাই scroll করার দরকার নাই;
    // obstacle/bonus/vignette-এর perspective motion দিয়েই forward-motion illusion হয়) ----
    this.streetBg = this.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'streetBackground')
      .setDisplaySize(GAME_WIDTH * BG_ZOOM, GAME_HEIGHT * BG_ZOOM)
      .setDepth(-10);

    // ---- ইন্সট্রাকশন (কয়েক সেকেন্ড পর নিজে থেকে fade out হয়ে যাবে) ----
    this.instructionText = this.add
      .text(
        GAME_WIDTH / 2,
        20,
        'বামে/ডানে ট্যাপ করো (বা \\u2190/\\u2192 কী) লেন পাল্টাতে',
        { fontSize: '16px', color: '#000000' }
      )
      .setOrigin(0.5, 0);
    this.tweens.add({
      targets: this.instructionText,
      alpha: 0,
      delay: 2600,
      duration: 500,
    });

    // ---- Score/Level state ----
    this.score = 0;
    this.level = 1;

    // ---- HUD (রেফারেন্স ছবির মতো: বাম দিকে heart/health bar + money bar,
    // ডান দিকে Level/Score টেক্সট) — শুধু ভিজ্যুয়াল, গেম-ওভার/স্কোর লজিক অপরিবর্তিত ----
    const HUD_BAR_X = 46;
    const HUD_BAR_W = 130;
    this.hudGfx = this.add.graphics().setDepth(30).setScrollFactor(0);

    // heart আইকন (health bar — এই গেমে এক হিটেই গেম-ওভার, তাই bar সবসময়
    // পূর্ণ থাকে যতক্ষণ বেঁচে থাকে, গেম-ওভার হলে খালি হয়ে যায়)
    this.healthBarBg = { x: HUD_BAR_X, y: 12, w: HUD_BAR_W, h: 13 };
    this.healthFillRatio = 1;

    // money bar — বর্তমান লেভেলের মধ্যে score progress দেখায় (cosmetic)
    this.moneyBarBg = { x: HUD_BAR_X, y: 30, w: HUD_BAR_W, h: 11 };
    this.moneyFillRatio = 0;

    // ---- Iteration PNG-1: আসল আঁকা heart/money-bag আইকন (আগে Graphics দিয়ে
    // বৃত্ত এঁকে বানানো placeholder ছিল) ----
    this.heartIconImg = this.add
      .image(20, this.healthBarBg.y + this.healthBarBg.h / 2, 'heartIcon')
      .setDisplaySize(26, 22)
      .setDepth(31)
      .setScrollFactor(0);
    this.moneyIconImg = this.add
      .image(20, this.moneyBarBg.y + this.moneyBarBg.h / 2, 'moneyIcon')
      .setDisplaySize(24, 22)
      .setDepth(31)
      .setScrollFactor(0);

    this.drawHud();

    this.levelText = this.add
      .text(GAME_WIDTH - 20, 8, 'Level: 1', {
        fontSize: '17px',
        color: '#000000',
        fontStyle: 'bold',
      })
      .setOrigin(1, 0)
      .setDepth(30);

    // Iteration 8, ফিচার #২: "Score" → "লুটপাট"
    this.scoreText = this.add
      .text(GAME_WIDTH - 20, 28, 'লুটপাট: 0', {
        fontSize: '20px',
        color: '#000000',
        fontStyle: 'bold',
      })
      .setOrigin(1, 0)
      .setDepth(30);

    // ---- ক্যারেক্টার (এখন fixed Y, শুধু লেন বদলে x পাল্টায়) ----
    this.laneIndex = START_LANE;
    this.character = this.add.image(
      LANE_X[this.laneIndex],
      NEAR_Y,
      'runnerTexture1'
    );
    this.character.setDisplaySize(CHAR_DISPLAY_WIDTH, CHAR_DISPLAY_HEIGHT);
    this.character.setDepth(10); // সবসময় obstacle/bonus-এর ওপরে দেখা যাবে যখন কাছে চলে আসে

    // ---- Iteration PNG-1: ২-frame running cycle (পা বদল দেখানোর জন্য টেক্সচার toggle) ----
    this.runFrameToggle = false;
    this.runFrameTimer = this.time.addEvent({
      delay: CHAR_RUN_FRAME_MS,
      loop: true,
      callback: () => {
        if (this.isGameOver) return;
        this.runFrameToggle = !this.runFrameToggle;
        this.character.setTexture(this.runFrameToggle ? 'runnerTexture2' : 'runnerTexture1');
      },
    });

    // ---- Obstacle/Bonus/Vignette ট্র্যাকিং array ----
    this.obstacles = []; // {sprite, lane, t}
    this.bonuses = []; // {sprite, label, lane, t}
    this.vignetteItems = []; // {container, pivotContainers}

    // ---- Difficulty state ----
    this.travelMs = TRAVEL_MS_BASE;
    this.obstacleSpawnMs = OBSTACLE_SPAWN_MS_BASE;
    this.bgScrollSpeed = BG_SCROLL_SPEED_BASE;

    // ---- Audio ----
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    this.audioCtx = AudioCtx ? new AudioCtx() : null;

    // ---- Input: ট্যাপ/ক্লিক স্ক্রিনের বাম/ডান অর্ধেকে => লেন সুইচ ----
    this.input.on('pointerdown', (pointer) => {
      if (pointer.x < GAME_WIDTH / 2) {
        this.switchLane(-1);
      } else {
        this.switchLane(1);
      }
    });
    this.leftKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.LEFT
    );
    this.rightKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.RIGHT
    );

    this.isGameOver = false;

    // ---- Timers ----
    this.obstacleSpawnTimer = this.time.addEvent({
      delay: this.obstacleSpawnMs,
      callback: () => this.spawnObstacle(),
      loop: true,
    });
    this.bonusSpawnTimer = this.time.addEvent({
      delay: BONUS_SPAWN_MS,
      callback: () => this.spawnBonus(),
      loop: true,
    });
    // রাস্তার ধারের animated vignette (accident/kiss/thug/fake-guru ইত্যাদি
    // চরিত্র) বন্ধ করে দেওয়া হলো — বোনাস পয়েন্টের সাথে এর কোনো সম্পর্ক নেই,
    // শুধু এই spawn timer/delayedCall বন্ধ থাকায় ওরা আর আসবে না। পরে দরকার
    // হলে নিচের ব্লক আনকমেন্ট করলেই আবার চালু হয়ে যাবে।
    // this.vignetteSpawnTimer = this.time.addEvent({
    //   delay: VIGNETTE_SPAWN_INTERVAL_MS,
    //   callback: () => this.spawnVignette(),
    //   loop: true,
    // });
    this.vignetteSpawnTimer = { remove: () => {} }; // gameOver()-এর .remove() কল নিরাপদ রাখতে ডামি
    this.difficultyTimer = this.time.addEvent({
      delay: DIFFICULTY_TICK_MS,
      callback: () => this.increaseDifficulty(),
      loop: true,
    });

    this.time.delayedCall(700, () => this.spawnObstacle());
    this.time.delayedCall(1600, () => this.spawnBonus());
    // this.time.delayedCall(3500, () => this.spawnVignette());

    // ---- Game Over UI ----
    // ব্ল্যাকআউট ওভারলে: শক-এর পরে পুরো স্ক্রিন কালো হয়ে যাবে, তার ওপরে
    // Game Over/Score/Restart টেক্সট দেখাবে। এটা শুধু একটা plain rectangle
    // shape (কোনো image/asset না) — তাই বান্ডল সাইজ/লোড টাইমে কোনো প্রভাব
    // নেই, ক্যানভাসের নিজস্ব রেন্ডারেই আঁকা হয়, lag হওয়ার কারণ নেই।
    this.gameOverOverlay = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 1)
      .setDepth(19)
      .setScrollFactor(0)
      .setAlpha(0)
      .setVisible(false);

    // Iteration 8, ফিচার #১: "Game Over" → "লোডশেডিং চলছে..." (satirical থিম)
    this.gameOverText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, 'লোডশেডিং চলছে...', {
        fontSize: '36px',
        color: '#ff0000',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(20)
      .setVisible(false);

    // Iteration 8, ফিচার #২: "Final Score" → "সর্বমোট লুটপাট"
    // রঙ সাদা করা হয়েছে (আগে কালো ছিল) — কালো ব্ল্যাকআউট ওভারলের ওপর কালো
    // টেক্সট দেখা যেত না
    this.finalScoreText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 12, '', {
        fontSize: '22px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(20)
      .setVisible(false);

    // Iteration 8, ফিচার #৬: রিস্টার্ট — ক্লিকযোগ্য "Restart" টেক্সট, blood-drip
    // স্টাইলে (bold + লাল fill + গাঢ় মেরুন stroke/shadow, বোনাস পপ-আপের থিমের
    // সাথে মিলিয়ে) — ক্লিক করলে scene.restart() (স্কোর/হেলথ ম্যানুয়ালি রিসেট
    // করার দরকার নাই, restart() পুরো scene fresh state-এ শুরু করে)
    this.restartText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 58, 'Restart', {
        fontSize: '26px',
        color: '#ff3b3b',
        fontStyle: 'bold',
        stroke: '#5c0a0a',
        strokeThickness: 5,
        shadow: {
          offsetX: 0,
          offsetY: 2,
          color: '#3a0505',
          blur: 4,
          fill: true,
        },
      })
      .setOrigin(0.5)
      .setDepth(20)
      .setVisible(false)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => this.restartText.setScale(1.08))
      .on('pointerout', () => this.restartText.setScale(1))
      .on('pointerdown', () => this.scene.restart());

    // Iteration 8, ফিচার #৭: স্যাটায়ারিক ক্রেডিট লাইন — বাম-নিচে, ছোট, সবসময়
    // দৃশ্যমান (গেমপ্লেতে বাধা না দিয়ে), কম opacity তে
    // রঙ সাদা করা হয়েছে (আগে কালো ছিল) — গেম-ওভারের কালো ব্ল্যাকআউটের ওপরেও
    // যেন পড়া যায় (স্বাভাবিক গেমপ্লের সময়ও রাস্তার ছবির ওপর ভালোভাবেই দেখা যাবে)
    this.creditText = this.add
      .text(10, GAME_HEIGHT - 10, 'নির্মাতা: Sakib Hasan (আর কেউ দায়ী না)', {
        fontSize: '11px',
        color: '#ffffff',
      })
      .setOrigin(0, 1)
      .setAlpha(0.55)
      .setDepth(30)
      .setScrollFactor(0);
  }

  // ---- HUD আঁকা (heart/health bar + money/score bar, বাম উপরে) ----
  drawHud() {
    const g = this.hudGfx;
    g.clear();

    // -- health bar (background + fill) --
    const hb = this.healthBarBg;
    g.fillStyle(0x2b2b2b, 0.55);
    g.fillRoundedRect(hb.x, hb.y, hb.w, hb.h, 4);
    g.fillStyle(0xe74c3c, 1);
    g.fillRoundedRect(hb.x + 2, hb.y + 2, Math.max(0, (hb.w - 4) * this.healthFillRatio), hb.h - 4, 3);
    g.lineStyle(2, 0x000000, 0.6);
    g.strokeRoundedRect(hb.x, hb.y, hb.w, hb.h, 4);

    // -- money bar (background + fill) --
    const mb = this.moneyBarBg;
    g.fillStyle(0x2b2b2b, 0.55);
    g.fillRoundedRect(mb.x, mb.y, mb.w, mb.h, 3);
    g.fillStyle(0x2ecc71, 1);
    g.fillRoundedRect(mb.x + 2, mb.y + 1.5, Math.max(0, (mb.w - 4) * this.moneyFillRatio), mb.h - 3, 2.5);
    g.lineStyle(2, 0x000000, 0.6);
    g.strokeRoundedRect(mb.x, mb.y, mb.w, mb.h, 3);
  }

  switchLane(direction) {
    if (this.isGameOver) return;
    const newLane = Phaser.Math.Clamp(
      this.laneIndex + direction,
      0,
      LANE_COUNT - 1
    );
    if (newLane === this.laneIndex) return;
    this.laneIndex = newLane;
    this.tweens.add({
      targets: this.character,
      x: LANE_X[this.laneIndex],
      duration: LANE_SWITCH_TWEEN_MS,
      ease: 'Quad.easeOut',
    });
    this.playSwitchSound();
  }

  increaseDifficulty() {
    if (this.isGameOver) return;
    this.level += 1;
    this.levelText.setText(`Level: ${this.level}`);
    this.travelMs = Math.max(this.travelMs - TRAVEL_MS_DECREMENT, TRAVEL_MS_MIN);
    this.obstacleSpawnMs = Math.max(
      this.obstacleSpawnMs - OBSTACLE_SPAWN_MS_DECREMENT,
      OBSTACLE_SPAWN_MS_MIN
    );
    this.bgScrollSpeed = Math.min(
      this.bgScrollSpeed + BG_SCROLL_SPEED_INCREMENT,
      BG_SCROLL_SPEED_MAX
    );
    this.obstacleSpawnTimer.remove();
    this.obstacleSpawnTimer = this.time.addEvent({
      delay: this.obstacleSpawnMs,
      callback: () => this.spawnObstacle(),
      loop: true,
    });
  }

  // ---- t (0..1) অনুযায়ী perspective পজিশন/স্কেল হিসাব করার হেল্পার ----
  perspectiveTransform(lane, t) {
    const x = Phaser.Math.Linear(VANISH_X, LANE_X[lane], t);
    const y = Phaser.Math.Linear(VANISH_Y, NEAR_Y, t);
    const scale = Phaser.Math.Linear(0.28, 1.15, t);
    return { x, y, scale };
  }

  spawnObstacle() {
    if (this.isGameOver) return;
    const lane = Phaser.Math.Between(0, LANE_COUNT - 1);
    const sprite = this.add.image(VANISH_X, VANISH_Y, 'poleShaftTexture');
    sprite.setOrigin(0.5, 1); // মাটির লাইনে bottom-anchored, ওপরের দিকে বড় হবে
    sprite.setDisplaySize(
      OBSTACLE_DISPLAY_W * 0.28,
      OBSTACLE_DISPLAY_H * 0.28
    );
    this.obstacles.push({ sprite, lane, t: 0, resolved: false });
  }

  spawnBonus() {
    if (this.isGameOver) return;
    const type = Phaser.Utils.Array.GetRandom(BONUS_TYPES);
    const lane = Phaser.Math.Between(0, LANE_COUNT - 1);
    const sprite = this.add.image(VANISH_X, VANISH_Y, type.texture);
    sprite.setDisplaySize(BONUS_DISPLAY_WIDTH * 0.28, BONUS_DISPLAY_HEIGHT * 0.28);
    const label = this.add
      .text(VANISH_X, VANISH_Y, type.name, {
        fontSize: '10px',
        color: '#000000',
        fontStyle: 'bold',
        backgroundColor: '#ffffffcc',
        padding: { x: 2, y: 1 },
      })
      .setOrigin(0.5, 0);
    // Iteration 8: bonus-এর key রাখা হলো, যাতে eatBonus() নির্দিষ্ট বোনাস
    // টাইপ অনুযায়ী আলাদা কাস্টম সাউন্ড বাজাতে পারে (ফিচার: বোনাস সাউন্ড)
    this.bonuses.push({ sprite, label, lane, t: 0, collected: false, key: type.key });
  }

  // ============ Iteration 3D-6: layered limb-animation vignettes ============
  // প্রতিটা vignette এখন একটা Container: base image (স্থির) + এক/একাধিক "part"
  // (প্রতিটা তার নিজস্ব ছোট pivot-container-এ বসানো, যাতে ইমেজের কেন্দ্র না,
  // বরং সঠিক pivot পয়েন্ট (কাঁধ/হিপ/হাব) ঘিরে ঘোরে/দোলে — যেমন কাগজের কাটআউট
  // পুতুলে (paper cutout puppet) হাত-পা আলাদা করে জোড়া লাগিয়ে নাড়ানো হয়)।
  spawnVignette() {
    if (this.isGameOver) return;
    const type = Phaser.Utils.Array.GetRandom(VIGNETTE_TYPES);
    const side = Math.random() < 0.5 ? -1 : 1; // রাস্তার বাম বা ডান পাশ, random

    // t=0 অবস্থায় (দূরে, ভ্যানিশিং পয়েন্টে) শুরু হবে — পিলার/বোনাসের perspective
    // সিস্টেমের মতোই, কিন্তু লেনের বদলে রাস্তার পাশে (side অনুযায়ী)
    const container = this.add.container(VANISH_X, VANISH_Y);
    container.setScale(VIGNETTE_FAR_SCALE);
    container.setDepth(-0.5);

    const base = this.add.image(0, 0, type.baseTexture);
    base.setDisplaySize(VIGNETTE_DISPLAY_WIDTH, VIGNETTE_DISPLAY_HEIGHT);
    container.add(base);

    const pivotContainers = [];
    type.parts.forEach((part) => {
      const [pivotPxX, pivotPxY] = part.pivot;
      const fx = pivotPxX / type.viewBox.w;
      const fy = pivotPxY / type.viewBox.h;
      // pivot-এর লোকাল পজিশন, container-এর কেন্দ্র (base image origin 0.5,0.5) থেকে অফসেট
      const localX = (fx - 0.5) * VIGNETTE_DISPLAY_WIDTH;
      const localY = (fy - 0.5) * VIGNETTE_DISPLAY_HEIGHT;

      const pivot = this.add.container(localX, localY);
      // part image-টা উল্টো অফসেটে বসানো, যাতে pivot (0,0)-এ থাকা সত্ত্বেও
      // ছবির কনটেন্ট base-এর সাথে ঠিক জায়গায় সারিবদ্ধ থাকে
      const partImg = this.add.image(-localX, -localY, part.texture);
      partImg.setDisplaySize(VIGNETTE_DISPLAY_WIDTH, VIGNETTE_DISPLAY_HEIGHT);
      pivot.add(partImg);
      container.add(pivot);
      pivotContainers.push(pivot);

      this.startVignettePartMotion(pivot, partImg, part.motion);
    });

    this.vignetteItems.push({ container, pivotContainers, side, t: 0 });
  }

  startVignettePartMotion(pivot, partImg, motion) {
    if (motion.type === 'spin') {
      // একটানা ঘোরা (যেমন হেলিকপ্টারের রোটর)
      this.tweens.add({
        targets: pivot,
        angle: 360,
        duration: motion.duration,
        repeat: -1,
        ease: 'Linear',
      });
    } else if (motion.type === 'swing') {
      // pivot-কে ঘিরে দোলা (হাত/পা/মালা নাড়ানোর জন্য)
      const a = motion.invert ? -motion.angle : motion.angle;
      pivot.angle = -a;
      this.tweens.add({
        targets: pivot,
        angle: a,
        duration: motion.duration,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    } else if (motion.type === 'float') {
      // ওপরে ভেসে ওঠা + fade (যেমন হার্ট আইকন) — লুপ করে রিসেট হয়
      const startY = pivot.y;
      partImg.setAlpha(1);
      this.tweens.add({
        targets: pivot,
        y: startY - motion.amplitude,
        duration: motion.duration,
        repeat: -1,
        onRepeat: () => {
          pivot.y = startY;
        },
      });
      this.tweens.add({
        targets: partImg,
        alpha: 0,
        duration: motion.duration,
        repeat: -1,
        onRepeat: () => {
          partImg.setAlpha(1);
        },
      });
    }
  }
  // ============ layered vignette animation শেষ ============

  addScore(amount = 1) {
    this.score += amount;
    this.scoreText.setText(`লুটপাট: ${this.score}`);
    this.moneyFillRatio = (this.score % MONEY_BAR_SCORE_STEP) / MONEY_BAR_SCORE_STEP;
    this.drawHud();
  }

  // ================= Iteration 3D-5: বোনাস "খাওয়া" animation =================
  // বোনাস আইটেম গায়েব হয়ে যাওয়ার বদলে ক্যারেক্টারের দিকে টেনে এনে ছোট হতে হতে
  // "গিলে ফেলা" ভাব তৈরি করা হয় (single-image আর্ট দিয়েই সম্ভব, নতুন sprite লাগে না)
  eatBonus(b) {
    this.playCollectSound();
    // Iteration 8: বোনাস টাইপ অনুযায়ী আলাদা কাস্টম সাউন্ড (৩ রকম — চাঁদাবাজ/
    // চিন্তাইকারি/সন্ত্রাসী), ফাইল লোড না থাকলে playCustomSound() স্কিপ করবে
    const bonusSfxKey = {
      chadabaj: 'bonusChadabajSfx',
      chintaikari: 'bonusChintaikariSfx',
      shontrashi: 'bonusShontrashiSfx',
    }[b.key];
    if (bonusSfxKey) this.playCustomSound(bonusSfxKey);
    // বোনাস আইটেম ক্যারেক্টারের মুখের কাছাকাছি (একটু ওপরে) টেনে আনা + ছোট করে ফেলা
    const mouthX = this.character.x;
    const mouthY = this.character.y - CHAR_DISPLAY_HEIGHT * 0.28;
    this.tweens.add({
      targets: b.sprite,
      x: mouthX,
      y: mouthY,
      scale: 0,
      angle: Phaser.Math.Between(-40, 40),
      duration: 190,
      ease: 'Cubic.easeIn',
      onComplete: () => b.sprite.destroy(),
    });
    this.tweens.add({
      targets: b.label,
      x: mouthX,
      y: mouthY,
      alpha: 0,
      duration: 140,
      onComplete: () => b.label.destroy(),
    });

    // ক্যারেক্টারের "চিবানো" bounce — squash-and-stretch
    this.tweens.add({
      targets: this.character,
      scaleX: 1.28,
      scaleY: 0.8,
      duration: 90,
      yoyo: true,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.character.setScale(1, 1);
      },
    });

    // Iteration 8, ফিচার #৩: "+১০%" পপ-আপ — রক্তমাখা (blood-splatter) স্টাইল।
    // পেছনে splatter আর্ট + সামনে bold লাল টেক্সট গাঢ় মেরুন stroke/shadow দিয়ে,
    // দুইটা একসাথে group করে ওপরে ভেসে fade-out (আগের প্লেইন সবুজ টেক্সটের বদলে)
    const splatter = this.add
      .image(mouthX, mouthY - 10, 'bonusSplatter')
      .setOrigin(0.5)
      .setDepth(14)
      .setScale(0.7)
      .setAlpha(0.95);
    const popup = this.add
      .text(mouthX, mouthY - 10, `+${BONUS_SCORE_VALUE}%`, {
        fontSize: '22px',
        color: '#ff2b2b',
        fontStyle: 'bold',
        stroke: '#5c0a0a',
        strokeThickness: 4,
        shadow: {
          offsetX: 0,
          offsetY: 2,
          color: '#3a0505',
          blur: 3,
          fill: true,
        },
      })
      .setOrigin(0.5)
      .setDepth(15);
    this.tweens.add({
      targets: [popup, splatter],
      y: '-=26',
      alpha: 0,
      duration: 500,
      ease: 'Quad.easeOut',
      onComplete: () => {
        popup.destroy();
        splatter.destroy();
      },
    });

    // সামান্য দেরিতে স্কোর যোগ করা (animation শুরুর সাথে সামান্য sync রাখতে)
    this.time.delayedCall(60, () => this.addScore(BONUS_SCORE_VALUE));
  }
  // ================= eatBonus শেষ =================

  gameOver() {
    if (this.isGameOver) return;
    this.isGameOver = true;
    // ইলেকট্রিক শক ইফেক্ট: পোল টাচ করার সাথে সাথেই (একদম প্রথমে) ফুল-স্ক্রিন
    // ক্যামেরা ফ্ল্যাশ + শেক — কোনো নতুন asset লাগে না, Phaser-এর built-in
    // camera FX ব্যবহার করা হয়েছে বলে lag হবে না, deploy করলেও extra
    // network request লাগবে না (Option 1, সবচেয়ে হালকা approach)
    this.electricShockFX();
    this.obstacleSpawnTimer.remove();
    this.bonusSpawnTimer.remove();
    this.vignetteSpawnTimer.remove();
    this.difficultyTimer.remove();
    this.character.setTint(0x888888);
    this.healthFillRatio = 0;
    this.drawHud();
    // Iteration 8, ফিচার #৪/#৫: আগের synth টোন ফলব্যাক হিসেবে থাকছে, সাথে
    // কাস্টম "লোডশেডিং" সাউন্ড আর পোল-হিট সাউন্ড (ফাইল লোড হলেই বাজবে,
    // না হলে playCustomSound() চুপচাপ স্কিপ করবে — নিচে সংজ্ঞা দ্রষ্টব্য)
    this.playHitSound();
    this.playCustomSound('poleHitSfx');
    // ইলেকট্রিক শক সাউন্ড বাজার পর ব্যাকগ্রাউন্ড মিউজিক লুপ আকারে বাজতে থাকবে
    // (রিস্টার্ট করলে create()-এর শুরুতে stopByKey('gameOverSfx') দিয়ে থেমে যাবে)
    this.time.delayedCall(120, () => this.playCustomSound('gameOverSfx', { loop: true }));

    // শক অ্যানিমেশন (flash/shake, প্রায় ২৮০ms) শেষ হওয়ার পরে ব্ল্যাকআউট +
    // গেম ওভার UI দেখানো হবে, যাতে শক আগে পুরোপুরি দেখা যায়, তারপর কালো
    // স্ক্রিনে স্কোর/রিস্টার্ট আসে
    this.time.delayedCall(280, () => this.showGameOverScreen());
  }

  // ================= ব্ল্যাকআউট স্ক্রিন + Game Over UI দেখানো =================
  showGameOverScreen() {
    // গেমপ্লে HUD (হার্ট/মানি বার, লেভেল, স্কোর) লুকিয়ে ফেলা হচ্ছে — কালো
    // স্ক্রিনের ওপর এগুলো অগোছালো দেখাতো (এগুলোর depth game-over টেক্সটের
    // চেয়ে বেশি বলে ওপরে দেখা যেত)। creditText ইচ্ছাকৃতভাবে hide করা হয়নি —
    // ওটা আগের মতোই (নিচের-বামে) দেখা যাবে, শুধু রঙ সাদা করা হয়েছে যাতে
    // কালো ব্যাকগ্রাউন্ডেও পড়া যায়।
    this.hudGfx.setVisible(false);
    this.heartIconImg.setVisible(false);
    this.moneyIconImg.setVisible(false);
    this.levelText.setVisible(false);
    this.scoreText.setVisible(false);

    // ব্ল্যাক ওভারলে ফেড-ইন (alpha 0 → 1, দ্রুত কিন্তু হঠাৎ কালো না হয়ে
    // একটু smooth transition)
    this.gameOverOverlay.setAlpha(0).setVisible(true);
    this.tweens.add({ targets: this.gameOverOverlay, alpha: 1, duration: 200 });

    this.gameOverText.setVisible(true);
    this.finalScoreText.setText(`সর্বমোট লুটপাট: ${this.score}`);
    this.finalScoreText.setVisible(true);
    this.restartText.setVisible(true);
  }

  // ================= ইলেকট্রিক শক ফুল-স্ক্রিন FX =================
  // Phaser এর built-in camera.flash() + camera.shake() দিয়ে বানানো — কোনো
  // extra image/SVG asset লাগে না, তাই বান্ডল সাইজ/লোড টাইম বাড়বে না এবং
  // ক্যানভাসের নিজস্ব রেন্ডার পাইপলাইনেই চলে বলে পারফরম্যান্স হিট নেই।
  // কয়েকটা দ্রুত flash চেইন করে "শক লাগার" মতো flicker ফিল আনা হয়েছে।
  electricShockFX() {
    const cam = this.cameras.main;
    // পুরো screen সাথে সাথে কেঁপে উঠবে (duration ms, intensity 0-1)
    cam.shake(280, 0.018);
    // প্রথমে কড়া সাদা ফ্ল্যাশ (আসল শক লাগার মুহূর্ত)
    cam.flash(70, 255, 255, 255);
    // এরপর হালকা নীলচে-সাদা ফ্লিকার (electric arc এর ফিল)
    this.time.delayedCall(100, () => {
      if (cam) cam.flash(60, 150, 200, 255);
    });
    this.time.delayedCall(180, () => {
      if (cam) cam.flash(90, 255, 255, 255);
    });
  }

  // ================= সাউন্ড এফেক্ট (আগের Iteration থেকে অপরিবর্তিত) =================
  _ensureAudio() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  _playTone({ startFreq, endFreq = startFreq, duration = 0.15, type = 'sine', volume = 0.25, delay = 0 }) {
    const ctx = this._ensureAudio();
    if (!ctx) return;
    const startTime = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, startTime);
    if (endFreq !== startFreq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(endFreq, 1), startTime + duration);
    }
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  }

  // লেন সুইচ — ছোট্ট blip (আগে জাম্প সাউন্ড ছিল)
  playSwitchSound() {
    this._playTone({ startFreq: 420, endFreq: 620, duration: 0.08, type: 'square', volume: 0.15 });
  }

  playCollectSound() {
    this._playTone({ startFreq: 700, endFreq: 700, duration: 0.09, type: 'sine', volume: 0.2 });
    this._playTone({ startFreq: 1050, endFreq: 1050, duration: 0.14, type: 'sine', volume: 0.2, delay: 0.09 });
  }

  playHitSound() {
    this._playTone({ startFreq: 220, endFreq: 60, duration: 0.45, type: 'sawtooth', volume: 0.28 });
  }

  // Iteration 8: কাস্টম (uploaded) সাউন্ড ফাইল চালানোর হেল্পার — cache-এ key
  // (preload()-এ this.load.audio(...) দিয়ে লোড করা) না থাকলে চুপচাপ স্কিপ করে,
  // তাই ফাইল আপলোডের আগেও গেম নির্বিঘ্নে চলবে।
  playCustomSound(key, options) {
    if (this.cache.audio.exists(key)) {
      this.sound.play(key, options);
    }
  }
  // ================= সাউন্ড এফেক্ট শেষ =================

  update(time, delta) {
    if (this.isGameOver) return;

    if (Phaser.Input.Keyboard.JustDown(this.leftKey)) this.switchLane(-1);
    if (Phaser.Input.Keyboard.JustDown(this.rightKey)) this.switchLane(1);

    // ---- Obstacle আপডেট (t বাড়ানো, position/scale/depth রিক্যালকুলেট) ----
    this.obstacles = this.obstacles.filter((obs) => {
      obs.t += delta / this.travelMs;
      const { x, y, scale } = this.perspectiveTransform(obs.lane, obs.t);
      // Iteration PNG-4 fix: পোল bottom-anchored (origin 0.5,1), কিন্তু ক্যারেক্টারের
      // origin center হওয়ায় তার আসল পা-এর লাইন NEAR_Y-এর চেয়ে (CHAR_DISPLAY_HEIGHT/2)
      // নিচে থাকে। এই অফসেট না থাকলে পোলের base মাটির লাইনের ওপরে ভাসতো ("উড়ে আসা" ভাব)
      const groundOffset = (CHAR_DISPLAY_HEIGHT / 2) * obs.t;
      obs.sprite.setPosition(x, y + groundOffset);
      obs.sprite.setDisplaySize(OBSTACLE_DISPLAY_W * scale, OBSTACLE_DISPLAY_H * scale);
      obs.sprite.setDepth(obs.t);

      if (!obs.resolved && obs.t >= OBSTACLE_HIT_T) {
        obs.resolved = true;
        if (obs.lane === this.laneIndex) {
          this.gameOver();
        } else {
          this.addScore(1); // নিরাপদে পাশ কাটানো
        }
      }

      if (obs.t >= OBSTACLE_DESPAWN_T) {
        obs.sprite.destroy();
        return false;
      }
      return true;
    });

    // ---- Bonus আপডেট ----
    this.bonuses = this.bonuses.filter((b) => {
      b.t += delta / this.travelMs;
      const { x, y, scale } = this.perspectiveTransform(b.lane, b.t);
      b.sprite.setPosition(x, y);
      b.sprite.setDisplaySize(BONUS_DISPLAY_WIDTH * scale, BONUS_DISPLAY_HEIGHT * scale);
      b.sprite.setDepth(b.t);
      b.label.setPosition(x, y + (BONUS_DISPLAY_HEIGHT * scale) / 2 + 2);
      b.label.setDepth(b.t);
      b.label.setAlpha(scale > 0.55 ? 1 : 0); // দূরে থাকতে লেবেল লুকানো (ক্লাটার এড়াতে)

      if (!b.collected && b.t >= OBSTACLE_HIT_T && b.lane === this.laneIndex) {
        b.collected = true;
        this.eatBonus(b); // ধ্বংস না করে "খাওয়া" animation ট্রিগার করা
        return false; // মূল আপডেট লুপ থেকে সরিয়ে ফেলা, animation নিজের মতো চলবে
      }

      if (b.t >= OBSTACLE_DESPAWN_T) {
        b.sprite.destroy();
        b.label.destroy();
        return false;
      }
      return true;
    });

    // ---- Vignette (আগের মতোই, ground scroll speed অনুযায়ী বামে সরে) ----
    this.vignetteItems = this.vignetteItems.filter((item) => {
      // পিলার/বোনাসের একই perspective ধারণা — t (0→1→আরেকটু বেশি) অনুযায়ী
      // দূর থেকে কাছে, তারপর রাস্তার পাশ দিয়ে অতিক্রম করে বেরিয়ে যাবে
      item.t += delta / this.travelMs;
      const nearX = VANISH_X + item.side * ROADSIDE_NEAR_OFFSET;
      const x = Phaser.Math.Linear(VANISH_X, nearX, item.t);
      const y = Phaser.Math.Linear(VANISH_Y, NEAR_Y, item.t);
      const scale = Phaser.Math.Linear(VIGNETTE_FAR_SCALE, VIGNETTE_NEAR_SCALE, item.t);
      item.container.setPosition(x, y);
      item.container.setScale(scale);
      item.container.setDepth(item.t - 0.6); // ক্যারেক্টার (depth 10)-এর নিচেই থাকবে সবসময়

      if (item.t >= VIGNETTE_DESPAWN_T) {
        item.pivotContainers.forEach((pivot) => {
          this.tweens.killTweensOf(pivot);
          pivot.list.forEach((child) => this.tweens.killTweensOf(child));
        });
        item.container.destroy(true); // true = recursively destroy children (base image + pivot containers)
        return false;
      }
      return true;
    });
  }
}

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'app',
  scale: {
    // মোবাইলে স্ক্রিনের সাথে পুরো ৮০০x৪৫০ ক্যানভাসটা fit করে ছোট/বড় হবে
    // (aspect ratio ঠিক রেখে), তাই কোনো টেক্সট/অংশ ভিউপোর্টের বাইরে কাটা পড়বে না।
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
  scene: [TitleScene, MainScene],
};

new Phaser.Game(config);
