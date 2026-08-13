import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';

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

// Zmienne wewnętrzne
let app, auth, db, currentUser = null;
let isInitialized = false;

// 2. GŁÓWNY OBIEKT EDUBOX CORE
export const EduBoxCore = {
    
    // Inicjalizacja (logowanie + pobranie menu)
    init: (onUserLoad) => {
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

    // Sprawdzanie i aktualizacja liczników
    getUsageCount: () => {
        const today = new Date().toISOString().split('T')[0];
        let usageStr = localStorage.getItem('eduboxUsage');
        if (usageStr) {
            try {
                const parsed = JSON.parse(usageStr);
                if (parsed.date === today) return parsed.count;
            } catch(e) {}
        }
        return 0;
    },

    // Mechanizm blokady limitów (do użycia pod przyciskiem 'Drukuj' itp.)
    executeWithLimitCheck: (isPremium, onSuccess, onLimitReached, onToastUpdate) => {
        const status = localStorage.getItem('eduboxProStatus');
        if (status === 'PRO' || status === 'active' || isPremium) {
            // Konto PRO - akcja bez zwiększania licznika, ale podajemy dotychczasowy stan
            onSuccess(EduBoxCore.getUsageCount());
            return;
        }
        
        let currentCount = EduBoxCore.getUsageCount();
        if (currentCount >= 5) {
            onLimitReached("⚠️ Dzienny limit użyć (5/5) wyczerpany. Wpisz kod odblokowujący na górze!");
            return;
        }
        
        const newCount = currentCount + 1;
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem('eduboxUsage', JSON.stringify({ date: today, count: newCount }));
        
        onToastUpdate(`Wykorzystano ${newCount}/5 darmowych działań`);
        onSuccess(newCount);
    },

    // Weryfikacja kodu premium
    verifyPremiumCode: async (code) => {
        try {
            const res = await fetch('/api/verify-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code })
            });
            const data = await res.json();
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
    }
};
