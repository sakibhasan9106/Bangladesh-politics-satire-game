// LANDSCAPE-1: Device detection utilities
//
// এই ফাইলে হেল্পারগুলো আছে:
//   - isAndroidBrowser(): শুধুমাত্র Android detect করার জন্য (iOS/desktop-এ false)
//   - isIOS(): শুধুমাত্র iOS (iPhone/iPad/iPod, Safari + iOS-এর অন্য ব্রাউজার,
//     সবগুলোই আসলে WebKit) detect করার জন্য (Android/desktop-এ false)
//   - isPortrait(): screen বর্তমানে portrait orientation-এ আছে কিনা
//
// ⚠️ গুরুত্বপূর্ণ: এই ফাংশনগুলো যেন কখনোই throw না করে — landscape-force
// ফিচারের পুরো লজিক (LANDSCAPE-2+) এই ফাংশনগুলোর রেজাল্টের উপর নির্ভর করে
// গেট করা হয় (isAndroidBrowser()/isIOS() false হলে নতুন কোনো কোড path
// ছোঁয়া হবে না)। তাই কোনো unexpected environment (navigator/window
// missing, ইত্যাদি)-এও এরা নিরাপদে false/best-guess রিটার্ন করবে, exception
// ছুড়বে না। ⚠️ isAndroidBrowser() এই পরিবর্তনে একেবারেই ছোঁয়া হয়নি —
// Android-এর বিহেভিয়ার এই ফিক্সের আগে যেমন ছিল ঠিক তেমনই থাকছে।

/**
 * Android ব্রাউজারে চলছে কিনা তা বলে (iOS/desktop/অন্য যেকোনো কিছুতে false)।
 * UA sniffing ব্যবহার করা হয়েছে — "Android কিনা" এটা feature-detection দিয়ে
 * বোঝার উপায় নাই, তাই এটাই standard approach।
 * @returns {boolean}
 */
export function isAndroidBrowser() {
  try {
    if (typeof navigator === 'undefined' || !navigator.userAgent) {
      return false;
    }
    return /Android/i.test(navigator.userAgent);
  } catch (err) {
    // অপ্রত্যাশিত কোনো environment হলেও যেন crash না করে, safe default false
    console.warn('[device] isAndroidBrowser() check failed, defaulting to false:', err);
    return false;
  }
}

/**
 * iOS ডিভাইসে (iPhone/iPad/iPod) চলছে কিনা তা বলে (Android/desktop-এ false)।
 * সাধারণ iPhone/iPod UA-তে সরাসরি "iPhone"/"iPod" থাকে। কিন্তু iPadOS 13+
 * থেকে iPad নিজেকে ডেস্কটপ Safari-এর মতো UA পাঠায় ("Macintosh" থাকে, "iPad"
 * থাকে না) — তাই শুধু UA স্ট্রিং যথেষ্ট না। সেই কেসটা ধরার জন্য আলাদাভাবে
 * চেক করা হচ্ছে: platform "MacIntel" (আসল Mac ল্যাপটপ/ডেস্কটপের মতোই) কিন্তু
 * touch পয়েন্ট আছে (>1) — আসল Mac-এ কখনো multi-touch থাকে না, তাই এই
 * কম্বিনেশন কার্যত শুধু iPad-Safari-কেই ধরবে, real desktop Mac ভুল করে
 * ধরবে না।
 * @returns {boolean}
 */
export function isIOS() {
  try {
    if (typeof navigator === 'undefined' || !navigator.userAgent) {
      return false;
    }
    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/i.test(ua)) {
      return true;
    }
    // iPadOS 13+ "desktop-class" UA fallback (উপরে কমেন্টে ব্যাখ্যা করা হয়েছে)
    return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  } catch (err) {
    // অপ্রত্যাশিত কোনো environment হলেও যেন crash না করে, safe default false
    console.warn('[device] isIOS() check failed, defaulting to false:', err);
    return false;
  }
}

/**
 * Screen/viewport বর্তমানে portrait mode-এ আছে কিনা তা বলে।
 * matchMedia থাকলে সেটাই প্রাইমারি সোর্স, না থাকলে innerWidth/innerHeight
 * তুলনা করে fallback করে।
 * @returns {boolean}
 */
export function isPortrait() {
  try {
    if (typeof window === 'undefined') {
      return false;
    }
    if (typeof window.matchMedia === 'function') {
      return window.matchMedia('(orientation: portrait)').matches;
    }
    return window.innerHeight > window.innerWidth;
  } catch (err) {
    console.warn('[device] isPortrait() check failed, defaulting to false:', err);
    return false;
  }
}

/**
 * LANDSCAPE-2: Android + portrait হলে Fullscreen ধরে screen orientation
 * landscape-এ lock করার চেষ্টা করে। এটা fire-and-forget হিসেবে ডিজাইন করা —
 * caller-কে কখনো block করবে না, কখনো throw করবে না, আর succeed/fail যাই হোক
 * গেম normally চলতে থাকবে (fail করলে LANDSCAPE-3-এ CSS fallback হ্যান্ডেল
 * করবে, আপাতত silent fail)।
 *
 * ⚠️ শুধু একটা real user gesture (click/tap/keydown handler)-এর ভেতর থেকে
 * কল করতে হবে — নাহলে browser permission দেবে না (এটা caller-এর দায়িত্ব)।
 *
 * @returns {Promise<void>} সবসময় resolve করে, কখনো reject করে না
 */
export async function attemptLandscapeLock() {
  try {
    if (!isAndroidBrowser() || !isPortrait()) {
      return; // iOS/desktop/ইতিমধ্যে landscape — কিছুই করার দরকার নাই
    }

    // ধাপ ১: Fullscreen — Android Chrome-এ orientation.lock() কাজ করতে হলে
    // সাধারণত fullscreen-এর ভেতরে থাকা লাগে। ব্যর্থ হলেও (যেমন Facebook
    // in-app browser প্রায়ই block করে) চেষ্টা চালিয়ে যাওয়া হয়, কারণ কিছু
    // browser fullscreen ছাড়াই lock() allow করতে পারে।
    try {
      const el = document.documentElement;
      if (el && el.requestFullscreen) {
        await el.requestFullscreen();
      } else if (el && el.webkitRequestFullscreen) {
        await el.webkitRequestFullscreen();
      }
    } catch (fsErr) {
      console.warn('[landscape-lock] fullscreen request failed (continuing anyway):', fsErr);
    }

    // ধাপ ২: Orientation lock
    try {
      if (typeof screen !== 'undefined' && screen.orientation && screen.orientation.lock) {
        await screen.orientation.lock('landscape');
        console.log('[landscape-lock] orientation locked to landscape');
      }
    } catch (lockErr) {
      // এটাই expected fail path FB in-app browser-এ বা unsupported ডিভাইসে —
      // LANDSCAPE-3-এ CSS rotation fallback এটা হ্যান্ডেল করবে
      console.warn('[landscape-lock] orientation.lock() failed (CSS fallback will handle this later):', lockErr);
    }
  } catch (err) {
    // চূড়ান্ত সেফটি নেট — এই ফাংশন কখনোই caller-কে ব্লক/ক্র্যাশ করাবে না
    console.warn('[landscape-lock] unexpected error, ignoring:', err);
  }
}
