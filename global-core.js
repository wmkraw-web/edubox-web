import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp, doc, setDoc, increment } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';

// 1. WSPÓLNA KONFIGURACJA FIREBASE
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyDL_mvepNJjMmZYQzifN2cXzoKwCE8jNd0",
    authDomain: "edubox-pro.firebaseapp.com",
    projectId: "edubox-pro",
    storageBucket: "edubox-pro.firebasestorage.app",
    messagingSenderId: "570263845714",
    appId: "1:570263845714:web:0b029211f7af071b66988b"
};

const APP_ID = "eduboxpro";
const TEXT_TRIAL_LIMIT = 3;
const IMAGE_TRIAL_LIMIT = 1;
const TEXT_TRIAL_KEY = 'eduboxTrialTextV1';
const IMAGE_TRIAL_KEY = 'eduboxTrialImageV1';

const readTrialCount = (key) => {
    try {
        const stored = localStorage.getItem(key);
        if (!stored) return 0;
        const parsed = JSON.parse(stored);
        const count = Number(typeof parsed === 'number' ? parsed : parsed.count);
        return Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
    } catch (e) {
        return 0;
    }
};

const saveTrialCount = (key, count) => {
    localStorage.setItem(key, JSON.stringify({ count }));
};

// Starsze aplikacje zapisują liczniki pod własnymi nazwami albo w formacie
// { date, count }. Mostek poniżej kieruje je do tej samej, jednorazowej puli.
// Dzięki temu nie trzeba ryzykownie przebudowywać działających generatorów.
const LEGACY_TEXT_COUNTER_OFFSETS = new Map([
    ['edubox_edudetox_ai', 0],
    ['edubox_edukalendarz_ai', 0],
    ['edubox_edunotariusz_ai', 0],
    ['edubox_eduraport_ai', 0],
    ['edubox_eduwakacje_ai', 0],
    ['edubox_eduwpisy_ai', 2]
]);
const LEGACY_IMAGE_COUNTER_OFFSETS = new Map([
    ['edubox_edubajka_ai', 1],
    ['edubox_eduwystroj_ai', 2],
    ['edubox_edumalarz_ai', 2]
]);
const LEGACY_DAILY_TEXT_PAGES = new Set([
    'asystent-pedagoga.html', 'awans.html', 'eduawans.html', 'edubiurokrata.html',
    'edubystrzak.html', 'edudialog.html', 'edudostosowania.html', 'edudyplomy.html',
    'eduescape.html', 'edufiszki.html', 'edugazetka.html', 'edusprawozdania.html',
    'test-edubiurokrata.html'
]);
const LEGACY_IMAGE_DATE_PAGES = new Set([
    'asystent-pedagoga.html', 'edubajka.html', 'edugazetka.html'
]);
const LEGACY_IMAGE_CORE_LIMIT_2_PAGES = new Set([
    'edudekorator.html', 'edugenerator.html', 'edumalarz.html',
    'eduprezentacja.html', 'eduterapia.html'
]);

const installLegacyTrialBridge = () => {
    try {
        if (typeof Storage === 'undefined') return;
        const storagePrototype = Storage.prototype;
        if (storagePrototype.__eduboxTrialBridgeV1) return;

        const nativeGetItem = storagePrototype.getItem;
        const nativeSetItem = storagePrototype.setItem;
        const currentDate = () => new Date().toISOString().split('T')[0];
        const currentPage = () => (typeof location === 'undefined' ? '' : location.pathname.split('/').pop());

        storagePrototype.getItem = function(key) {
            if (key === 'eduboxUsage') {
                return JSON.stringify({ date: currentDate(), count: Math.min(5, readTrialCount(TEXT_TRIAL_KEY) + 2) });
            }
            if (key === 'eduboxImageUsage') {
                return JSON.stringify({ date: currentDate(), count: Math.min(2, readTrialCount(IMAGE_TRIAL_KEY) + 1) });
            }
            if (LEGACY_TEXT_COUNTER_OFFSETS.has(key)) {
                return String(readTrialCount(TEXT_TRIAL_KEY) + LEGACY_TEXT_COUNTER_OFFSETS.get(key));
            }
            if (LEGACY_IMAGE_COUNTER_OFFSETS.has(key)) {
                return String(readTrialCount(IMAGE_TRIAL_KEY) + LEGACY_IMAGE_COUNTER_OFFSETS.get(key));
            }
            return nativeGetItem.call(this, key);
        };

        storagePrototype.setItem = function(key, value) {
            let trialKey = null;
            let count = null;

            if (key === 'eduboxUsage' || key === 'eduboxImageUsage') {
                const parsed = JSON.parse(value || '{}');
                count = Number(parsed.count);
                trialKey = key === 'eduboxUsage' ? TEXT_TRIAL_KEY : IMAGE_TRIAL_KEY;
                if (key === 'eduboxUsage' && (LEGACY_DAILY_TEXT_PAGES.has(currentPage()) || currentPage() === 'eduwpisy.html')) {
                    count -= 2;
                }
                if (key === 'eduboxImageUsage' && LEGACY_IMAGE_DATE_PAGES.has(currentPage())) {
                    count -= 1;
                }
            } else if (LEGACY_TEXT_COUNTER_OFFSETS.has(key) || LEGACY_IMAGE_COUNTER_OFFSETS.has(key)) {
                count = Number(value);
                if (LEGACY_TEXT_COUNTER_OFFSETS.has(key)) {
                    count -= LEGACY_TEXT_COUNTER_OFFSETS.get(key);
                    trialKey = TEXT_TRIAL_KEY;
                } else {
                    count -= LEGACY_IMAGE_COUNTER_OFFSETS.get(key);
                    trialKey = IMAGE_TRIAL_KEY;
                }
            }

            if (trialKey && Number.isFinite(count)) {
                nativeSetItem.call(this, trialKey, JSON.stringify({ count: Math.max(0, Math.floor(count)) }));
            }
            return nativeSetItem.call(this, key, value);
        };

        Object.defineProperty(storagePrototype, '__eduboxTrialBridgeV1', { value: true });
    } catch (error) {
        console.warn('Nie udało się uruchomić mostka limitów EduBox.', error);
    }
};

installLegacyTrialBridge();

// Wyznacza klucz aktualnego tygodnia (np. "2026-W33") - do statystyk "najpopularniejsze w tym tygodniu"
const getWeekKey = () => {
    const d = new Date();
    const oneJan = new Date(d.getFullYear(), 0, 1);
    const week = Math.ceil((((d - oneJan) / 86400000) + oneJan.getDay() + 1) / 7);
    return `${d.getFullYear()}-W${week}`;
};

// Zmienne wewnętrzne
let app, auth, db, currentUser = null;
let isInitialized = false;

// Sprawdza i czyści wygasły bonusowy dostęp PRO (np. nagroda za polecenie znajomego).
// Dotyczy WYŁĄCZNIE kont, które dostały czasowy bonus (eduboxBonusUntil ustawione) —
// nigdy nie rusza stałego, jednorazowo wykupionego dostępu PRO (ten nie ma tego klucza).
const checkAndExpireBonusPro = () => {
    try {
        const bonusUntil = localStorage.getItem('eduboxBonusUntil');
        if (!bonusUntil) return;
        if (new Date(bonusUntil).getTime() < Date.now()) {
            localStorage.removeItem('eduboxBonusUntil');
            localStorage.removeItem('eduboxProStatus');
        }
    } catch (e) {}
};

// 2. GŁÓWNY OBIEKT EDUBOX CORE
export const EduBoxCore = {
    TEXT_TRIAL_LIMIT,
    IMAGE_TRIAL_LIMIT,
    
    // Inicjalizacja (logowanie + pobranie menu)
    init: (onUserLoad) => {
        checkAndExpireBonusPro();
        if (!isInitialized) {
            app = initializeApp(FIREBASE_CONFIG);
            auth = getAuth(app);
            db = getFirestore(app);
            signInAnonymously(auth).catch(e => console.error("Firebase Auth Error:", e));
            isInitialized = true;
            
            // Auto-pobieranie menu do wskazanego kontenera!
            EduBoxCore.loadMenu();
        }
        
        onAuthStateChanged(auth, (user) => {
            currentUser = user;
            if(onUserLoad) onUserLoad(user);
        });
    },

    // Pobieranie menu
    loadMenu: () => {
        const container = document.getElementById('wspolne-menu-kontener');
        if (container) {
            fetch('/menu.html')
                .then(r => r.text())
                .then(html => {
                    container.innerHTML = html;
                    // innerHTML nie wykonuje tagów <script> - trzeba je ręcznie odtworzyć
                    container.querySelectorAll('script').forEach(oldScript => {
                        const newScript = document.createElement('script');
                        if (oldScript.src) newScript.src = oldScript.src;
                        newScript.textContent = oldScript.textContent;
                        oldScript.parentNode.replaceChild(newScript, oldScript);
                    });
                })
                .catch(err => console.log('Brak pliku menu lokalnie.', err));
        }
    },

    // Jednorazowa, wspólna pula próbna dla wszystkich aplikacji tekstowych EduBox.
    // Klucz wersjonowany daje każdemu użytkownikowi uczciwy, świeży start po wdrożeniu nowego modelu.
    getUsageCount: () => readTrialCount(TEXT_TRIAL_KEY),

    // Mechanizm blokady limitów (do użycia pod przyciskiem 'Drukuj' itp.)
    executeWithLimitCheck: (isPremium, onSuccess, onLimitReached, onToastUpdate) => {
        const status = localStorage.getItem('eduboxProStatus');
        if (status === 'PRO' || status === 'active' || isPremium) {
            // Konto PRO - akcja bez zwiększania licznika, ale podajemy dotychczasowy stan
            EduBoxCore.bumpGlobalCounter();
            onSuccess(EduBoxCore.getUsageCount());
            return;
        }
        
        let currentCount = EduBoxCore.getUsageCount();
        if (currentCount >= TEXT_TRIAL_LIMIT) {
            onLimitReached(`⚠️ Darmowa pula startowa (${TEXT_TRIAL_LIMIT}/${TEXT_TRIAL_LIMIT}) została wykorzystana. Odblokuj PRO, aby korzystać dalej.`);
            return;
        }
        
        const newCount = currentCount + 1;
        saveTrialCount(TEXT_TRIAL_KEY, newCount);
        
        onToastUpdate(`Darmowy start: wykorzystano ${newCount}/${TEXT_TRIAL_LIMIT} generowań tekstowych`);
        EduBoxCore.bumpGlobalCounter();
        onSuccess(newCount);
    },

    // Osobna, jednorazowa pula próbna dla kosztownego generowania obrazków AI.
    getImageUsageCount: () => {
        const actualCount = readTrialCount(IMAGE_TRIAL_KEY);
        const page = typeof location === 'undefined' ? '' : location.pathname.split('/').pop();
        return LEGACY_IMAGE_CORE_LIMIT_2_PAGES.has(page) && actualCount >= IMAGE_TRIAL_LIMIT
            ? 2
            : actualCount;
    },

    executeImageLimitCheck: (isPremium, onSuccess, onLimitReached, onToastUpdate) => {
        const status = localStorage.getItem('eduboxProStatus');
        if (status === 'PRO' || status === 'active' || isPremium) {
            EduBoxCore.bumpGlobalCounter();
            onSuccess(readTrialCount(IMAGE_TRIAL_KEY));
            return;
        }

        let currentCount = readTrialCount(IMAGE_TRIAL_KEY);
        if (currentCount >= IMAGE_TRIAL_LIMIT) {
            onLimitReached(`⚠️ Darmowa grafika na start (${IMAGE_TRIAL_LIMIT}/${IMAGE_TRIAL_LIMIT}) została wykorzystana. Odblokuj PRO, aby tworzyć kolejne.`);
            return;
        }

        const newCount = currentCount + 1;
        saveTrialCount(IMAGE_TRIAL_KEY, newCount);

        onToastUpdate(`Darmowy start: wykorzystano ${newCount}/${IMAGE_TRIAL_LIMIT} grafiki AI`);
        EduBoxCore.bumpGlobalCounter();
        onSuccess(newCount);
    },

    // Weryfikacja kodu premium (stały kod PREMIUM_CODE ORAZ czasowe kody bonusowe z polecenia)
    verifyPremiumCode: async (code) => {
        try {
            const res = await fetch('/api/verify-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code })
            });
            const data = await res.json();
            if (data.valid === true) {
                if (data.bonus === true && data.until) {
                    // Kod bonusowy (z polecenia) — czasowy dostęp, wygasa samoczynnie.
                    localStorage.setItem('eduboxBonusUntil', data.until);
                } else {
                    // Zwykły, stały kod (bezpośredni zakup) — usuwamy ewentualny stary
                    // licznik bonusu, żeby nie wygasił w przyszłości permanentnego dostępu.
                    localStorage.removeItem('eduboxBonusUntil');
                }
            }
            return data.valid === true;
        } catch (e) {
            return false;
        }
    },

    // Giełda Wzorów - ZAPIS
    saveToGielda: async (collectionName, appType, itemName, config) => {
        if (!currentUser) throw new Error("Brak połączenia z chmurą. Odśwież stronę.");
        
        const publicRef = collection(db, 'artifacts', APP_ID, 'public', 'data', collectionName);
        const payload = {
            userId: currentUser.uid,
            createdAt: serverTimestamp(),
            type: appType,
            name: itemName,
            config: config
        };

        // Zabezpieczenie przed za dużymi plikami (b64 obrazki)
        if (JSON.stringify(payload).length > 950000) {
            throw new Error("🚨 Użyta grafika jest za duża by zapisać ją w chmurze (Max ~1MB)!");
        }

        await addDoc(publicRef, payload);
    },

    // Giełda Wzorów - ODCZYT W CZASIE RZECZYWISTYM
    subscribeToGielda: (collectionName, onDataLoaded, onError) => {
        if (!db) return () => {};
        
        const publicRef = collection(db, 'artifacts', APP_ID, 'public', 'data', collectionName);
        return onSnapshot(publicRef, (snapshot) => {
            const loaded = [];
            snapshot.forEach(doc => loaded.push({ id: doc.id, ...doc.data() }));
            loaded.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
            onDataLoaded(loaded);
        }, onError);
    },

    // STATYSTYKI - prawdziwy, globalny licznik wykonanych działań AI (nie fałszywy!)
    bumpGlobalCounter: () => {
        if (!db) return;
        const statsRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'stats', 'global_counter');
        setDoc(statsRef, { total: increment(1) }, { merge: true }).catch(() => {});
    },

    subscribeGlobalCounter: (callback) => {
        if (!db) return () => {};
        const statsRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'stats', 'global_counter');
        return onSnapshot(statsRef, (snap) => {
            callback(snap.exists() ? (snap.data().total || 0) : 0);
        }, () => {});
    },

    // STATYSTYKI - popularność narzędzi w bieżącym tygodniu (na podstawie kliknięć na stronie głównej)
    trackAppClick: (appUrl) => {
        if (!db) return;
        const safeKey = appUrl.replace(/[.\/]/g, '_');
        const clickRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'stats', `clicks_${getWeekKey()}`);
        setDoc(clickRef, { [safeKey]: increment(1) }, { merge: true }).catch(() => {});
    },

    subscribeWeeklyPopular: (callback, topN = 5) => {
        if (!db) return () => {};
        const clickRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'stats', `clicks_${getWeekKey()}`);
        return onSnapshot(clickRef, (snap) => {
            if (!snap.exists()) { callback([]); return; }
            const data = snap.data();
            const sorted = Object.entries(data)
                .map(([safeKey, count]) => ({ url: safeKey.replace(/_/g, '.'), count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, topN);
            callback(sorted);
        }, () => callback([]));
    }
};
