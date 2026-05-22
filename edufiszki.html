import React, { useState, useEffect, useRef } from 'react';
import { 
  Map, MapPin, Navigation, Camera, Sparkles, History, Heart, 
  Coffee, TreePine, Mountain, Plus, Loader2, Send,
  User, Sun, CloudRain, Train, Eye, List, X,
  CalendarDays, LogOut, Bell, PhoneCall, AlertTriangle, ChevronRight, Filter,
  Video, Image as ImageIcon, Paintbrush, PlayCircle, Upload, Film, ArrowLeft, Utensils, Activity, MessageCircle, Lock
} from 'lucide-react';

// --- BAZA DANYCH SZLAKÓW I ATRAKCJI (LEŻAJSK I OKOLICE) ---
const TRAILS_DATA = [
  { id: 1, location: "Leżajsk", name: "Zespół Klasztorny o. Bernardynów", color: "bg-red-500", distance: "1.5 km", time: "1h 00m", difficulty: "Bardzo Łatwa", elevation: "10 m", transport: "Spacer z centrum / dworca PKP Leżajsk.", food: "Kawiarnia Klasztorna, restauracje w centrum", description: "Perła renesansu i baroku. Zwiedzanie bazyliki i słynnych organów.", mapX: "50%", mapY: "45%", pois: ['Bazylika Zwiastowania NMP', 'Muzeum Prowincji'], familyFriendly: true },
  { id: 2, location: "Leżajsk", name: "Rezerwat 'Las Klasztorny'", color: "bg-green-500", distance: "4.5 km", time: "1h 15m", difficulty: "Łatwa", elevation: "30 m", transport: "Pieszo z okolic Klasztoru w kierunku zachodnim.", food: "Prowiant własny", description: "Uroczy, relaksujący spacer po leśnym rezerwacie pełnym starych drzew.", mapX: "40%", mapY: "40%", pois: ['Stare dęby', 'Ścieżka edukacyjna'], familyFriendly: true },
  { id: 3, location: "Leżajsk", name: "Doliną Sanu na rowerze", color: "bg-blue-500", distance: "15.0 km", time: "2h 30m", difficulty: "Średnia", elevation: "50 m", transport: "Start w okolicach mostu na Sanie.", food: "Zajazdy przy głównych drogach", description: "Malownicza trasa rowerowa wzdłuż rzeki San, świetna na popołudniowy wyjazd.", mapX: "60%", mapY: "30%", pois: ['Starorzecza Sanu', 'Plaże rzeczne'], familyFriendly: false },
  { id: 4, location: "Brzóza Królewska", name: "Spacer wokół Zalewu Floryda", color: "bg-yellow-400", distance: "3.2 km", time: "1h 00m", difficulty: "Łatwa", elevation: "10 m", transport: "Autobus PKS z Leżajska / Samochód.", food: "Punkty gastro przy zalewie (w sezonie)", description: "Przyjemna ścieżka rekreacyjna wokół zalewu w sercu lasu. Idealna dla rodzin.", mapX: "30%", mapY: "60%", pois: ['Zalew Floryda', 'Plaża'], familyFriendly: true },
  { id: 5, location: "Łańcut", name: "Zamek i Park w Łańcucie", color: "bg-purple-500", distance: "4.0 km", time: "2h 30m", difficulty: "Bardzo Łatwa", elevation: "20 m", transport: "Pociąg z Leżajska (z przesiadką) lub PKS.", food: "Restauracja Zamkowa, Kawiarnie w Rynku", description: "Półdniowa wycieczka po jednym z najpiękniejszych pałaców w Polsce i otaczającym go parku.", mapX: "20%", mapY: "80%", pois: ['Zamek', 'Wozownia', 'Oranżeria'], familyFriendly: true },
  { id: 6, location: "Nowa Sarzyna", name: "Rezerwat Azalia Pontyjska", color: "bg-pink-500", distance: "2.5 km", time: "0h 45m", difficulty: "Łatwa", elevation: "15 m", transport: "Bus z Leżajska do Nowej Sarzyny / Woli Zarczyckiej.", food: "Karczma w Nowej Sarzynie", description: "Niezwykłe miejsce, w którym na wiosnę kwitnie dzika azalia. Piękne, leśne zapachy.", mapX: "45%", mapY: "20%", pois: ['Stanowisko Azalii'], familyFriendly: true },
  { id: 7, location: "Sieniawa", name: "Pałac Czartoryskich i Park", color: "bg-purple-500", distance: "3.5 km", time: "1h 30m", difficulty: "Łatwa", elevation: "10 m", transport: "PKS Leżajsk - Sieniawa.", food: "Restauracja Pałacowa", description: "Spokojne zwiedzanie zabytkowego parku krajobrazowego i krypt Czartoryskich.", mapX: "80%", mapY: "65%", pois: ['Pałac', 'Krypta'], familyFriendly: true },
  { id: 8, location: "Julinek / Kuryłówka", name: "Ścieżki Puszczy Sandomierskiej", color: "bg-green-500", distance: "8.5 km", time: "2h 15m", difficulty: "Średnia", elevation: "40 m", transport: "Dojazd własny na parkingi leśne.", food: "Prowiant z plecaka", description: "Dłuższy spacer dla miłośników natury po pięknych lasach dawnej puszczy.", mapX: "70%", mapY: "25%", pois: ['Ostoje dzikiej zwierzyny'], familyFriendly: false }
];

export default function App() {
  // --- ZABEZPIECZENIE APLIKACJI ---
  const SECRET_PIN = "LEZAJSK2026"; 
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  const [activeTab, setActiveTab] = useState('home'); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [savedTrips, setSavedTrips] = useState([
    { id: 101, name: "Niedziela w Łańcucie", date: "15 Sierpnia 2025", duration: "3h 10m", media: [] }
  ]);
  const [activeTrip, setActiveTrip] = useState(null);

  // Sprawdzanie, czy użytkownik logował się wcześniej
  useEffect(() => {
    const savedAuth = localStorage.getItem('lezajskAuth') === 'true';
    if (savedAuth) setIsAuthenticated(true);
  }, []);

  const handleLogin = () => {
    if (passwordInput === SECRET_PIN) {
        setIsAuthenticated(true);
        localStorage.setItem('lezajskAuth', 'true');
    } else {
        alert('Nieprawidłowy kod dostępu!');
        setPasswordInput('');
    }
  };

  const handleAddTrip = (trail) => {
    const today = new Date().toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
    const newTrip = { id: Date.now(), name: trail.name, date: today, duration: trail.time, media: [] };
    setSavedTrips(prev => [newTrip, ...prev]);
    setActiveTab('journal'); 
  };

  const handleAddMedia = (tripId, newMediaUrl) => {
    setSavedTrips(prev => prev.map(t => t.id === tripId ? { ...t, media: [...t.media, newMediaUrl] } : t));
    if (activeTrip && activeTrip.id === tripId) {
        setActiveTrip(prev => ({ ...prev, media: [...prev.media, newMediaUrl] }));
    }
  };

  const handleSaveAIPlan = (plan) => {
    const today = new Date().toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
    const newTrip = { id: Date.now(), name: plan.title, date: today, duration: `${plan.days.length} dni`, media: [] };
    setSavedTrips(prev => [newTrip, ...prev]);
    setActiveTab('journal');
  };

  // --- WIDOK LOGOWANIA (BLOKADA APLIKACJI) ---
  if (!isAuthenticated) {
      return (
          <div className="h-screen w-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
              <div className="absolute inset-0 opacity-30">
                  <img src="https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&q=80&w=1920" alt="Krajobraz tło" className="w-full h-full object-cover" />
              </div>
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl w-full max-w-md relative z-10 text-center shadow-2xl animate-in zoom-in-95 duration-500">
                  <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.5)]">
                      <Lock size={32} className="text-white" />
                  </div>
                  <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Leżajsk Przewodnik</h1>
                  <p className="text-emerald-100/70 text-sm mb-8">Aplikacja łączy się z płatnymi interfejsami API. Wymagany jest kod autoryzacji.</p>
                  
                  <input 
                      type="password" 
                      value={passwordInput} 
                      onChange={(e) => setPasswordInput(e.target.value)}
                      onKeyPress={(e) => { if (e.key === 'Enter') handleLogin(); }}
                      placeholder="Wprowadź PIN..."
                      className="w-full bg-black/30 border border-white/10 text-center text-white rounded-xl px-5 py-4 outline-none mb-4 text-2xl tracking-[0.5em] font-bold uppercase focus:border-emerald-500 transition-colors"
                  />
                  
                  <button 
                      onClick={handleLogin}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl transition-all shadow-lg active:scale-95"
                  >
                      Odblokuj
                  </button>
              </div>
          </div>
      );
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden md:flex flex-col w-72 bg-emerald-900 text-white shadow-2xl relative z-20">
        <div className="p-6 border-b border-emerald-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-emerald-500 p-2 rounded-xl"><TreePine size={28} className="text-white" /></div>
            <div>
              <h1 className="text-xl font-black tracking-tight leading-none">Leżajsk<br/>Przewodnik</h1>
            </div>
          </div>
          <p className="text-emerald-300 text-xs font-medium mt-2">Twój osobisty asystent</p>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <SidebarItem icon={<MapPin />} label="Pulpit Główny" isActive={activeTab === 'home'} onClick={() => setActiveTab('home')} />
          <SidebarItem icon={<Map />} label="Trasy i Atrakcje" isActive={activeTab === 'trails'} onClick={() => setActiveTab('trails')} />
          <SidebarItem icon={<CalendarDays />} label="Planer Trasy" isActive={activeTab === 'planner'} onClick={() => setActiveTab('planner')} />
          <SidebarItem icon={<MessageCircle />} label="Asystent AI" isActive={activeTab === 'chat'} onClick={() => setActiveTab('chat')} />
          <SidebarItem icon={<History />} label="Pamiętnik Wypraw" isActive={activeTab === 'journal'} onClick={() => { setActiveTab('journal'); setActiveTrip(null); }} />
        </nav>

        <div className="p-4 border-t border-emerald-800">
          <div className="bg-emerald-800/50 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-700 rounded-full flex items-center justify-center"><User size={20} /></div>
            <div className="flex-1">
              <p className="text-sm font-bold">Turysta</p>
              <p className="text-[10px] text-emerald-300">Wersja PRO</p>
            </div>
            <button onClick={() => { setIsAuthenticated(false); localStorage.removeItem('lezajskAuth'); }} className="p-2 hover:bg-red-500/20 rounded-lg transition text-red-400" title="Wyloguj">
               <LogOut size={16}/>
            </button>
          </div>
        </div>
      </aside>

      {/* --- MOBILE TOP BAR --- */}
      <div className="md:hidden fixed top-0 w-full bg-emerald-600 text-white p-4 shadow-md z-30 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <TreePine size={24} />
          <h1 className="text-xl font-bold tracking-tight">Leżajsk AI</h1>
        </div>
        <button onClick={() => { setIsAuthenticated(false); localStorage.removeItem('lezajskAuth'); }} className="p-2 bg-emerald-700 rounded-full">
          <LogOut size={18} />
        </button>
      </div>

      {/* --- GŁÓWNA ZAWARTOŚĆ --- */}
      <main className="flex-1 overflow-y-auto pt-16 md:pt-0 pb-20 md:pb-0 relative scroll-smooth">
        {activeTab === 'home' && <HomeView setActiveTab={setActiveTab} />}
        {activeTab === 'trails' && <TrailsView onAddTrip={handleAddTrip} />}
        {activeTab === 'planner' && <AIPlannerView onSavePlan={handleSaveAIPlan} />}
        {activeTab === 'chat' && <ChatAssistantView />}
        {activeTab === 'journal' && <JournalView savedTrips={savedTrips} activeTrip={activeTrip} setActiveTrip={setActiveTrip} onAddMedia={handleAddMedia} />}
      </main>

      {/* --- MOBILE BOTTOM NAV --- */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-slate-200 flex justify-around p-2 pb-safe shadow-[0_-10px_20px_rgba(0,0,0,0.05)] z-30">
        <NavItem icon={<MapPin />} label="Start" isActive={activeTab === 'home'} onClick={() => setActiveTab('home')} />
        <NavItem icon={<Map />} label="Atrakcje" isActive={activeTab === 'trails'} onClick={() => setActiveTab('trails')} />
        <NavItem icon={<CalendarDays />} label="Planer" isActive={activeTab === 'planner'} onClick={() => setActiveTab('planner')} />
        <NavItem icon={<MessageCircle />} label="Asystent" isActive={activeTab === 'chat'} onClick={() => setActiveTab('chat')} />
        <NavItem icon={<History />} label="Pamiętnik" isActive={activeTab === 'journal'} onClick={() => { setActiveTab('journal'); setActiveTrip(null); }} />
      </nav>

    </div>
  );
}

// ==========================================
// WIDOK: HOME (PULPIT)
// ==========================================
function HomeView({ setActiveTab }) {
  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500">
      
      {/* Powitanie i Pogoda */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="md:col-span-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-6 md:p-8 text-white shadow-xl flex justify-between items-center relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10 scale-150 transform translate-x-1/4 -translate-y-1/4"><Sun size={200} /></div>
          <div className="relative z-10">
            <h2 className="text-2xl md:text-4xl font-bold mb-1">Dzień dobry!</h2>
            <p className="text-blue-100 mb-6 text-sm md:text-base">Idealna pogoda na spacer po okolicy.</p>
            <div className="flex items-end gap-4">
              <span className="text-5xl md:text-6xl font-black">21°C</span>
              <div className="pb-1 text-blue-100 text-sm">
                <p>Leżajsk / Łańcut</p>
                <p>Słonecznie, lekki wiatr</p>
              </div>
            </div>
          </div>
        </div>

        {/* Panel Informacyjny / Ratunkowy */}
        <div className="bg-emerald-50 rounded-3xl p-6 border border-emerald-100 flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 bg-emerald-100 w-24 h-24 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
          <AlertTriangle size={32} className="text-emerald-600 mb-4 relative z-10" />
          <h3 className="font-bold text-emerald-900 text-lg relative z-10">Ważne Telefony</h3>
          <p className="text-emerald-700 text-sm mb-4 relative z-10">Zapisz numery alarmowe na wyjazd.</p>
          <button className="bg-emerald-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition shadow-md relative z-10">
            <PhoneCall size={18} /> 112 (Alarmowy)
          </button>
        </div>
      </div>

      {/* Szybkie Akcje */}
      <div>
        <h3 className="font-bold text-slate-800 mb-4 text-xl flex items-center gap-2">Szybkie menu</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickActionButton icon={<CalendarDays />} label="Kreator Trasy" color="bg-emerald-100 text-emerald-700" iconColor="bg-emerald-500" onClick={() => setActiveTab('planner')} />
          <QuickActionButton icon={<MessageCircle />} label="Asystent Chat" color="bg-purple-100 text-purple-700" iconColor="bg-purple-500" onClick={() => setActiveTab('chat')} />
          <QuickActionButton icon={<Map />} label="Mapa Atrakcji" color="bg-orange-100 text-orange-700" iconColor="bg-orange-500" onClick={() => setActiveTab('trails')} />
          <QuickActionButton icon={<Coffee />} label="Restauracje" color="bg-amber-100 text-amber-800" iconColor="bg-amber-500" onClick={() => setActiveTab('trails')} />
        </div>
      </div>

      {/* Polecane */}
      <div>
        <h3 className="font-bold text-slate-800 mb-4 text-xl flex items-center gap-2"><Heart size={20} className="text-rose-500" /> Polecane na dzisiejsze warunki</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="h-40 md:h-48 bg-slate-200 rounded-2xl mb-4 overflow-hidden relative">
               <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent flex flex-col justify-end p-4">
                 <span className="text-white font-black text-xl">Klasztor o. Bernardynów</span>
                 <span className="text-slate-300 text-sm flex items-center gap-1"><MapPin size={14}/> Leżajsk</span>
               </div>
               <img src="https://images.unsplash.com/photo-1548625361-ecacbd715b94?auto=format&fit=crop&q=80&w=800" alt="Zabytek" className="w-full h-full object-cover" />
            </div>
            <div className="flex justify-between items-center text-sm text-slate-600 mb-4 font-medium">
              <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg"><Navigation size={16} className="text-blue-500"/> 1.5 km</span>
              <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg"><History size={16} className="text-amber-500"/> 1h 00m</span>
              <span className="bg-red-100 text-red-700 px-2 py-1 rounded-lg">Architektura</span>
            </div>
            <button onClick={() => setActiveTab('trails')} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition">
              Zobacz szczegóły
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

// ==========================================
// WIDOK: SZLAKI I MAPA 
// ==========================================
function TrailsView({ onAddTrip }) {
  const [activeFilter, setActiveFilter] = useState('Wszystkie');
  const [selectedPin, setSelectedPin] = useState(null);
  const [isMapVisibleOnMobile, setIsMapVisibleOnMobile] = useState(false); 
  
  const filters = ['Wszystkie', 'Leżajsk', 'Łańcut', 'Brzóza Królewska', 'Sieniawa'];
  const filteredTrails = activeFilter === 'Wszystkie' ? TRAILS_DATA : TRAILS_DATA.filter(t => t.location === activeFilter);

  return (
    <div className="h-full flex flex-col md:p-6 p-0 max-w-7xl mx-auto relative">
      
      {/* Nagłówek i Filtry */}
      <div className="bg-white md:bg-transparent p-4 md:p-0 border-b md:border-none border-slate-200 shrink-0 z-20">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-2xl text-slate-800">Eksploruj Region</h2>
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {filters.map(f => (
            <button 
              key={f} onClick={() => { setActiveFilter(f); setSelectedPin(null); }}
              className={`px-5 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all shadow-sm
                ${activeFilter === f ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Kontener dwukolumnowy */}
      <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden md:mt-2 relative">
        
        {/* LEWA: Lista Szlaków */}
        <div className={`w-full md:w-1/2 lg:w-5/12 overflow-y-auto p-4 md:p-0 space-y-4 pb-32 md:pb-4 custom-scrollbar ${isMapVisibleOnMobile ? 'hidden md:block' : 'block'}`}>
          {filteredTrails.map(trail => (
            <div key={trail.id} 
              onMouseEnter={() => setSelectedPin(trail)}
              className={`bg-white rounded-3xl p-5 shadow-sm border-2 transition-all cursor-pointer ${selectedPin?.id === trail.id ? 'border-emerald-500 shadow-md' : 'border-slate-100 hover:border-slate-300'}`}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-3 h-14 rounded-full shrink-0 ${trail.color}`}></div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-slate-800 leading-tight">{trail.name}</h3>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">{trail.location}</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${trail.difficulty==='Łatwa' || trail.difficulty==='Bardzo Łatwa' ?'bg-green-100 text-green-700':trail.difficulty==='Średnia'?'bg-orange-100 text-orange-700':'bg-red-100 text-red-700'}`}>{trail.difficulty}</span>
                    {trail.familyFriendly && <span className="text-[10px] font-bold uppercase px-2 py-1 rounded bg-blue-100 text-blue-700">Rodzinny 👶</span>}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 mb-4 bg-slate-50 p-3 rounded-2xl">
                <div className="text-center"><p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Dystans</p><p className="font-black text-slate-800 text-sm">{trail.distance}</p></div>
                <div className="text-center border-x border-slate-200"><p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Czas</p><p className="font-black text-slate-800 text-sm">{trail.time}</p></div>
                <div className="text-center"><p className="text-[10px] text-slate-500 font-bold uppercase mb-1">W górę</p><p className="font-black text-slate-800 text-sm">{trail.elevation}</p></div>
              </div>

              <div className="flex items-start gap-3 bg-blue-50/50 rounded-xl p-3 mb-4">
                <Train size={18} className="text-blue-500 shrink-0" />
                <p className="text-xs text-slate-600 leading-relaxed">{trail.transport}</p>
              </div>

              <div className="flex gap-2">
                <button onClick={(e) => { e.stopPropagation(); setIsMapVisibleOnMobile(true); setSelectedPin(trail); }} className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200 py-2.5 rounded-xl text-sm font-bold flex md:hidden items-center justify-center gap-2 transition"><MapPin size={16} /> Pokaż na Mapie</button>
                <button onClick={(e) => { e.stopPropagation(); onAddTrip(trail); }} className="flex-1 bg-emerald-600 text-white hover:bg-emerald-500 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition"><Plus size={16} /> Zapisz</button>
              </div>
            </div>
          ))}
        </div>

        {/* PRAWA: Duża Mapa */}
        <div className={`w-full md:w-1/2 lg:w-7/12 relative bg-emerald-50 rounded-none md:rounded-3xl border border-emerald-200 overflow-hidden shadow-inner flex flex-col min-h-[500px] h-full ${!isMapVisibleOnMobile ? 'hidden md:flex' : 'flex'}`}>
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="topo" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse"><path d="M10,10 Q40,40 90,10 M20,30 Q50,60 90,30 M10,50 Q40,80 80,50 M30,70 Q60,90 90,70" fill="none" stroke="#059669" strokeWidth="1" opacity="0.5"/><path d="M0,20 Q30,50 80,20 M10,40 Q40,70 80,40" fill="none" stroke="#047857" strokeWidth="0.5" opacity="0.3"/></pattern></defs><rect x="0" y="0" width="100%" height="100%" fill="url(#topo)" /></svg>
          </div>
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-lg text-xs font-bold text-emerald-800 shadow-sm border border-emerald-100 z-10">Mapa Ziemi Leżajskiej</div>

          <div className="relative w-full h-full">
            {filteredTrails.map(trail => (
              <div 
                key={`pin-${trail.id}`}
                onClick={() => setSelectedPin(trail)}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-transform z-10 cursor-pointer"
                style={{ left: trail.mapX, top: trail.mapY }}
              >
                <div className="relative flex flex-col items-center">
                  <div className={`p-1 rounded-full bg-white shadow-md ${selectedPin?.id === trail.id ? 'ring-4 ring-emerald-400 scale-110' : ''} transition-all`}>
                    <MapPin size={24} className={`${trail.color.replace('bg-', 'text-')} fill-current`} />
                  </div>
                  <span className={`absolute top-full mt-2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-lg whitespace-nowrap pointer-events-none transition-all ${selectedPin?.id === trail.id ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                    {trail.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pływający Przycisk Mapa/Lista na Smartfony */}
      <div className="md:hidden fixed bottom-20 left-1/2 -translate-x-1/2 z-40">
          <button 
              onClick={() => setIsMapVisibleOnMobile(!isMapVisibleOnMobile)} 
              className="bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 font-bold hover:scale-105 transition-transform"
          >
              {isMapVisibleOnMobile ? <><List size={18}/> Pokaż Listę</> : <><Map size={18}/> Pokaż Mapę</>}
          </button>
      </div>

    </div>
  );
}

// ==========================================
// WIDOK: OSOBISTY ASYSTENT CHAT
// ==========================================
function ChatAssistantView() {
  const [msg, setMsg] = useState("");
  const [chat, setChat] = useState([{ role: 'ai', text: 'Cześć! Jestem Twoim przewodnikiem turystycznym po Leżajsku i okolicach. Potrzebujesz porady co warto zjeść, albo jak najlepiej dojechać do Łańcuta?' }]);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  const handleSend = async () => {
    if (!msg.trim()) return;
    const newChat = [...chat, { role: 'user', text: msg }];
    setChat(newChat);
    setMsg("");
    setIsLoading(true);

    try {
      const isVercel = window.location.hostname.includes('vercel.app');
      let reply = "";

      if (isVercel) {
        const res = await fetch('/api/chat', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ prompt: `Jesteś bardzo pomocnym, przyjaznym przewodnikiem turystycznym po Leżajsku i okolicach (Podkarpacie). Udziel krótkiej, zwięzłej porady. Pytanie turysty: ${msg}` })
        });
        
        if (!res.ok) throw new Error("Vercel error");
        const data = await res.json();
        reply = data.candidates?.[0]?.content?.parts?.[0]?.text || data.choices?.[0]?.message?.content || "Nie zrozumiałem, spróbuj jeszcze raz.";
      } else {
        const apiKey = ""; 
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
              contents: [{ parts: [{ text: msg }] }],
              systemInstruction: { parts: [{ text: "Jesteś bardzo pomocnym przewodnikiem turystycznym po Leżajsku i okolicach (Podkarpacie). Udzielaj krótkich, przyjaznych porad." }] }
           })
        });
        if (!res.ok) throw new Error("Canvas error");
        const data = await res.json();
        reply = data.candidates[0].content.parts[0].text;
      }

      setChat([...newChat, { role: 'ai', text: reply }]);
    } catch (e) {
      console.error(e);
      setChat([...newChat, { role: 'ai', text: "⚠️ Błąd połączenia z serwerem. Jeśli jesteś na Vercelu, upewnij się, że dodałeś klucz 'OPENAI_API_KEY'!" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 max-w-4xl mx-auto relative">
      <div className="bg-purple-900 p-6 text-white shrink-0 shadow-md z-10 flex items-center gap-4">
         <div className="bg-purple-500 p-3 rounded-full"><MessageCircle size={24} /></div>
         <div>
            <h2 className="text-2xl font-black">Asystent Turysty</h2>
            <p className="text-purple-200 text-sm">Zawsze gotowy do pomocy</p>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-28 custom-scrollbar">
        {chat.map((c, i) => (
          <div key={i} className={`flex ${c.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-4 rounded-2xl max-w-[85%] text-sm leading-relaxed shadow-sm ${c.role === 'user' ? 'bg-emerald-600 text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'}`}>
               {c.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-purple-600" /> <span className="text-slate-500 text-sm">Asystent pisze...</span>
             </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="absolute bottom-0 left-0 w-full p-4 bg-slate-50 border-t border-slate-200 pb-safe">
        <div className="flex gap-2 bg-white rounded-full p-2 border border-slate-300 shadow-sm">
          <input 
            value={msg} 
            onChange={e => setMsg(e.target.value)} 
            onKeyPress={e => e.key === 'Enter' && handleSend()}
            className="flex-1 bg-transparent px-4 outline-none text-slate-800" 
            placeholder="Zapytaj asystenta..." 
          />
          <button onClick={handleSend} disabled={isLoading || !msg.trim()} className="bg-purple-600 hover:bg-purple-500 disabled:bg-slate-300 text-white p-3 rounded-full transition-colors"><Send size={18}/></button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// WIDOK: KREATOR WYCIECZEK AI 
// ==========================================
function AIPlannerView({ onSavePlan }) {
  const [step, setStep] = useState(1);
  const [preferences, setPreferences] = useState({ days: 1, difficulty: 'easy', companions: 'adults' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState(null);

  const generatePlan = () => {
    setIsGenerating(true);
    setTimeout(() => {
      let selectedTrails = [];
      if (preferences.companions === 'kids') {
        selectedTrails = TRAILS_DATA.filter(t => t.familyFriendly);
      } else if (preferences.difficulty === 'hard') {
        selectedTrails = TRAILS_DATA.filter(t => t.difficulty !== 'Bardzo Łatwa');
      } else {
        selectedTrails = TRAILS_DATA;
      }
      
      while(selectedTrails.length < preferences.days) {
          selectedTrails = [...selectedTrails, ...selectedTrails];
      }
      selectedTrails = selectedTrails.slice(0, preferences.days);

      setGeneratedPlan({
        title: `Twój idealny wyjazd (${preferences.days} dni)`,
        description: preferences.companions === 'kids' ? "Wybrałem trasy spacerowe i pełne atrakcji dla najmłodszych." : "Oto optymalny plan obejmujący najważniejsze zabytki i walory naturalne Leżajska i okolic.",
        days: selectedTrails
      });
      setIsGenerating(false);
      setStep(3);
    }, 2500);
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto h-full flex flex-col pb-24 md:pb-8">
      <div className="bg-emerald-900 rounded-3xl p-6 md:p-10 text-white shadow-xl relative overflow-hidden shrink-0 mb-6">
        <div className="absolute -right-10 -bottom-10 opacity-20"><CalendarDays size={150} /></div>
        <h2 className="text-2xl md:text-4xl font-black mb-2 relative z-10">Kreator Planu Wyjazdu</h2>
        <p className="text-emerald-200 max-w-lg relative z-10">Zamiast przeglądać dziesiątki stron, powiedz mi czego potrzebujesz. Zbuduję harmonogram zwiedzania okolic Leżajska specjalnie dla Ciebie.</p>
      </div>

      <div className="flex-1 bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-10 overflow-y-auto custom-scrollbar">
        {/* KROK 1 */}
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in">
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><CalendarDays size={20} className="text-emerald-500"/> Ile dni spędzisz w okolicy?</h3>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                  <button key={num} onClick={() => setPreferences({...preferences, days: num})} className={`py-3 rounded-xl font-bold border-2 transition-all ${preferences.days === num ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' : 'border-slate-100 bg-white text-slate-500 hover:border-slate-300'}`}>{num}</button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Filter size={20} className="text-emerald-500"/> Z kim podróżujesz?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button onClick={() => setPreferences({...preferences, companions: 'adults'})} className={`p-4 rounded-xl font-bold border-2 flex flex-col items-center gap-2 transition-all ${preferences.companions === 'adults' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 bg-white text-slate-500'}`}><User size={24}/> Dorośli</button>
                <button onClick={() => setPreferences({...preferences, companions: 'kids'})} className={`p-4 rounded-xl font-bold border-2 flex flex-col items-center gap-2 transition-all ${preferences.companions === 'kids' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 bg-white text-slate-500'}`}><Heart size={24}/> Z dziećmi</button>
                <button onClick={() => setPreferences({...preferences, companions: 'dog'})} className={`p-4 rounded-xl font-bold border-2 flex flex-col items-center gap-2 transition-all ${preferences.companions === 'dog' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 bg-white text-slate-500'}`}><Map size={24}/> Z psem</button>
              </div>
            </div>

            <button onClick={() => setStep(2)} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-emerald-700 transition shadow-lg mt-4">Dalej <ChevronRight className="inline" size={20}/></button>
          </div>
        )}

        {/* KROK 2 */}
        {step === 2 && (
          <div className="space-y-8 animate-in slide-in-from-right-8">
             <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><TreePine size={20} className="text-emerald-500"/> Jaka intensywność?</h3>
              <div className="space-y-3">
                <button onClick={() => setPreferences({...preferences, difficulty: 'easy'})} className={`w-full text-left p-4 rounded-xl font-bold border-2 transition-all ${preferences.difficulty === 'easy' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 bg-white text-slate-500'}`}>Rekreacyjna (Zabytki, krótkie spacery)</button>
                <button onClick={() => setPreferences({...preferences, difficulty: 'medium'})} className={`w-full text-left p-4 rounded-xl font-bold border-2 transition-all ${preferences.difficulty === 'medium' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 bg-white text-slate-500'}`}>Średnia (Dłuższe wycieczki, rowery)</button>
                <button onClick={() => setPreferences({...preferences, difficulty: 'hard'})} className={`w-full text-left p-4 rounded-xl font-bold border-2 transition-all ${preferences.difficulty === 'hard' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 bg-white text-slate-500'}`}>Wysoka (Aktywne zwiedzanie całodniowe)</button>
              </div>
            </div>
            
            <div className="flex gap-4">
               <button onClick={() => setStep(1)} className="px-6 py-4 rounded-2xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition">Wróć</button>
               <button onClick={generatePlan} disabled={isGenerating} className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black text-lg hover:bg-slate-800 transition shadow-lg flex justify-center items-center gap-2">
                 {isGenerating ? <><Loader2 className="animate-spin" size={24}/> Tworzę harmonogram...</> : <><Sparkles size={20}/> Stwórz Plan</>}
               </button>
            </div>
          </div>
        )}

        {/* KROK 3 */}
        {step === 3 && generatedPlan && (
          <div className="animate-in zoom-in-95 duration-500 space-y-6">
            <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
               <h3 className="text-2xl font-black text-emerald-900 mb-2">{generatedPlan.title}</h3>
               <p className="text-emerald-700 font-medium">{generatedPlan.description}</p>
            </div>

            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
              {generatedPlan.days.map((trail, idx) => (
                <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                   <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-900 text-white font-bold shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-md z-10">{idx + 1}</div>
                   
                   <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] bg-white p-5 rounded-2xl shadow-sm border border-slate-200 ml-4 md:ml-0 hover:border-emerald-300 transition-colors">
                     <div className="flex items-center gap-2 mb-2">
                       <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">Dzień {idx + 1}</span>
                       <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold text-slate-500">{trail.location}</span>
                     </div>
                     <h4 className="font-bold text-lg text-slate-800 mb-2 leading-tight">{trail.name}</h4>
                     <p className="text-sm text-slate-600 mb-4">{trail.description}</p>
                     
                     <div className="flex flex-col gap-2 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="flex items-start gap-2">
                           <Utensils size={14} className="text-amber-600 shrink-0 mt-0.5" />
                           <span className="text-xs text-slate-700 leading-tight"><b>Jedzenie:</b> {trail.food}</span>
                        </div>
                        <div className="flex items-start gap-2">
                           <Train size={14} className="text-blue-600 shrink-0 mt-0.5" />
                           <span className="text-xs text-slate-700 leading-tight"><b>Dojazd:</b> {trail.transport}</span>
                        </div>
                     </div>

                     <div className="flex flex-wrap gap-2">
                       <span className="bg-slate-100 text-xs font-bold text-slate-600 px-2 py-1 rounded flex items-center gap-1"><History size={12}/> {trail.time}</span>
                       <span className="bg-slate-100 text-xs font-bold text-slate-600 px-2 py-1 rounded flex items-center gap-1"><Navigation size={12}/> {trail.distance}</span>
                     </div>
                   </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
               <button onClick={() => onSavePlan(generatedPlan)} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-emerald-700 transition shadow-lg flex justify-center items-center gap-2 btn-bounce">
                   <History size={20} /> Zapisz w Pamiętniku
               </button>
               <button onClick={() => setStep(1)} className="w-full bg-slate-100 text-slate-600 py-3 rounded-2xl font-bold hover:bg-slate-200 transition">Nowy plan</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// WIDOK: PAMIĘTNIK I MALARZ AI
// ==========================================
function JournalView({ savedTrips, activeTrip, setActiveTrip, onAddMedia }) {
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showMovie, setShowMovie] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const url = URL.createObjectURL(file);
      onAddMedia(activeTrip.id, url);
    });
  };

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    
    try {
        const isVercel = window.location.hostname.includes('vercel.app');
        // Usunięty na sztywno górski krajobraz - AI słucha Twojego opisu.
        const hiddenInstruction = aiPrompt;
        let data;

        if (isVercel) {
            const payload = { prompt: hiddenInstruction, instances: { prompt: hiddenInstruction }, parameters: { sampleCount: 1 } };
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ payload, type: 'image' })
            });

            if (!res.ok) {
                const err = await res.json().catch(()=>({}));
                throw new Error("Błąd Vercel API. Upewnij się, że STABILITY_API_KEY jest dodany do zmiennych środowiskowych! " + (err.error || ""));
            }
            data = await res.json();
        } else {
            const apiKey = ""; 
            const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`;
            // Dla testów lokalnych sztucznie wymuszamy krajobraz z Podkarpacia do Twojego tekstu
            const localPrompt = `A beautiful artistic masterpiece painting of ${aiPrompt}. Scenic landscape in the Lezajsk region, Podkarpacie, vibrant colors, nature.`;
            const fallbackRes = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    instances: [{ prompt: localPrompt }],
                    parameters: { sampleCount: 1 }
                })
            });

            if (!fallbackRes.ok) throw new Error("Błąd serwera testowego Google");
            data = await fallbackRes.json();
        }

        const base64Image = data.predictions?.[0]?.bytesBase64Encoded || data.artifacts?.[0]?.base64 || data.image; 
        
        if (base64Image) {
            const finalUrl = base64Image.startsWith('data:image') ? base64Image : `data:image/png;base64,${base64Image}`;
            onAddMedia(activeTrip.id, finalUrl);
            setAiPrompt("");
        } else {
            throw new Error("Pusta odpowiedź z serwera grafiki.");
        }
    } catch (e) {
        console.error("Błąd generowania AI", e);
        alert(`BŁĄD: ${e.message}\n\nJeśli jesteś na Vercelu, musisz mieć w "Settings -> Environment Variables" klucze OPENAI_API_KEY oraz STABILITY_API_KEY.`);
    } finally {
        setIsGenerating(false);
    }
  };

  if (showMovie && activeTrip) {
      return <MoviePlayer media={activeTrip.media} onClose={() => setShowMovie(false)} title={activeTrip.name} />;
  }

  if (activeTrip) {
      return (
          <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 animate-in slide-in-from-right-8 duration-300 pb-24 md:pb-8">
              <button onClick={() => setActiveTrip(null)} className="flex items-center gap-2 text-emerald-600 font-bold hover:text-emerald-700 transition">
                  <ArrowLeft size={20} /> Powrót do listy
              </button>
              
              <div className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-slate-200">
                  <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
                      <div>
                          <h2 className="font-black text-3xl md:text-4xl text-slate-800">{activeTrip.name}</h2>
                          <p className="text-slate-500 flex items-center gap-2 mt-2 font-medium"><CalendarDays size={18}/> {activeTrip.date} • <History size={18}/> {activeTrip.duration}</p>
                      </div>
                      
                      <div className="flex flex-wrap gap-3">
                          <button onClick={() => setIsTracking(!isTracking)} className={`px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md border btn-bounce ${isTracking ? 'bg-red-50 text-red-600 border-red-200' : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'}`}>
                              <Activity size={20} className={isTracking ? "animate-pulse" : ""} />
                              {isTracking ? 'Zatrzymaj GPS' : 'Rejestruj spacer'}
                          </button>
                          
                          {activeTrip.media.length > 0 && (
                              <button onClick={() => setShowMovie(true)} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-3 hover:bg-slate-800 shadow-xl transition transform hover:scale-105 btn-bounce">
                                  <Film size={20} className="text-emerald-400" /> Zrób Film!
                              </button>
                          )}
                      </div>
                  </div>

                  {/* GALERIA */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                      {activeTrip.media.map((url, idx) => (
                          <div key={idx} className="aspect-square bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative group cursor-pointer">
                              <img src={url} alt="Wspomnienie" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          </div>
                      ))}
                      <div 
                          onClick={() => fileInputRef.current?.click()} 
                          className="aspect-square bg-emerald-50 border-2 border-dashed border-emerald-300 rounded-2xl flex flex-col items-center justify-center text-emerald-700 cursor-pointer hover:bg-emerald-100 transition shadow-inner"
                      >
                          <Upload size={32} className="mb-2 text-emerald-500" />
                          <span className="text-sm font-bold text-center px-2 leading-tight">Dodaj Zdjęcie<br/>lub Wideo</span>
                          <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*,video/*" onChange={handleFileUpload} />
                      </div>
                  </div>

                  {/* MALARZ AI */}
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-6 md:p-8 border border-indigo-100 relative overflow-hidden shadow-inner">
                      <div className="absolute right-0 top-0 opacity-10 translate-x-4 -translate-y-4"><Paintbrush size={160} /></div>
                      <h3 className="font-bold text-indigo-900 mb-2 text-xl flex items-center gap-2 relative z-10"><Sparkles size={24} className="text-indigo-500" /> Malarz z Podkarpacia (AI)</h3>
                      <p className="text-sm text-indigo-700 mb-6 max-w-xl relative z-10 leading-relaxed">Opisz co widziałeś podczas spaceru (np. bocian, stara kapliczka), a sztuczna inteligencja wygeneruje piękny obraz z tej chwili wprost do Twojej galerii!</p>
                      <div className="flex flex-col md:flex-row gap-3 relative z-10">
                          <input 
                              value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} 
                              placeholder="Np. jeleń we mgle w lesie klasztornym..." 
                              className="flex-1 rounded-xl px-5 py-4 outline-none border border-indigo-200 focus:border-indigo-400 bg-white/80 backdrop-blur font-medium"
                              onKeyPress={e => e.key === 'Enter' && handleGenerateAI()}
                          />
                          <button onClick={handleGenerateAI} disabled={isGenerating || !aiPrompt} className={`px-8 py-4 rounded-xl font-black text-white flex items-center justify-center gap-2 transition-all shadow-lg ${isGenerating ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-105 btn-bounce'}`}>
                              {isGenerating ? <Loader2 size={24} className="animate-spin" /> : <Paintbrush size={24} />} 
                              <span>{isGenerating ? 'Maluję obraz...' : 'Namaluj'}</span>
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 pb-24 md:pb-8">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <div>
          <h2 className="font-black text-2xl text-slate-800">Moje Wyprawy</h2>
          <p className="text-slate-500 text-sm mt-1">Zapisane statystyki i wspomnienia z wycieczek.</p>
        </div>
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex flex-col items-center justify-center font-black leading-none">
          <span className="text-xl">{savedTrips.length}</span>
          <span className="text-[10px] uppercase">Wyprawy</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {savedTrips.map(trip => (
          <div key={trip.id} onClick={() => setActiveTrip(trip)} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md hover:border-emerald-300 transition cursor-pointer group">
            <h3 className="font-bold text-lg text-slate-800 mb-2 group-hover:text-emerald-700 transition-colors">{trip.name}</h3>
            <div className="flex items-center gap-4 text-sm text-slate-500 mb-4 font-medium">
              <span className="flex items-center gap-1"><CalendarDays size={16}/> {trip.date}</span>
              <span className="flex items-center gap-1"><History size={16}/> {trip.duration}</span>
            </div>
            <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-2">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg"><ImageIcon size={14}/> {trip.media?.length || 0} Zdjęć</span>
              <span className="text-xs font-black text-emerald-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform uppercase tracking-wider">Otwórz <ChevronRight size={16}/></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MoviePlayer({ media, onClose, title }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (media.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % media.length);
    }, 3500); 
    return () => clearInterval(timer);
  }, [media]);

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col animate-in fade-in duration-500">
      <div className="flex justify-between items-center p-6 bg-gradient-to-b from-black/80 to-transparent absolute top-0 w-full z-20">
        <div>
          <h3 className="text-white font-black text-2xl drop-shadow-lg flex items-center gap-3"><Film className="text-emerald-400" /> Pamiątka z Trasy</h3>
          <p className="text-slate-300 text-sm font-medium mt-1">{title}</p>
        </div>
        <button onClick={onClose} className="text-white bg-white/10 hover:bg-white/30 p-3 rounded-full backdrop-blur transition border border-white/20"><X size={24}/></button>
      </div>
      
      <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-black">
        {media.map((url, idx) => (
           <img 
             key={idx} 
             src={url} 
             className={`absolute w-full h-full object-contain transition-opacity duration-1000 ${idx === currentIndex ? 'opacity-100 scale-110' : 'opacity-0 scale-100'}`} 
             alt="Slajd z wycieczki" 
             style={{ transitionProperty: 'opacity, transform', transitionDuration: '1s, 4s', transitionTimingFunction: 'ease-out' }}
           />
        ))}
        
        <div className="absolute bottom-10 left-0 w-full flex justify-center gap-3 z-20">
           {media.map((_, idx) => (
              <div key={idx} className={`h-2 rounded-full transition-all duration-500 shadow-md ${idx === currentIndex ? 'w-10 bg-emerald-500' : 'w-3 bg-white/40'}`} />
           ))}
        </div>
      </div>
    </div>
  );
}

// --- Komponenty Pomocnicze UI ---
function SidebarItem({ icon, label, isActive, onClick }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-emerald-800 text-white font-bold shadow-inner' : 'text-emerald-200 hover:bg-emerald-800/50 hover:text-white font-medium'}`}>
      {icon} <span>{label}</span>
    </button>
  );
}

function NavItem({ icon, label, isActive, onClick }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center w-[72px] gap-1 transition-colors ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
      <div className={`p-1.5 rounded-full ${isActive ? 'bg-emerald-50 scale-110' : ''} transition-all`}>{icon}</div>
      <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>{label}</span>
    </button>
  );
}

function QuickActionButton({ icon, label, color, iconColor, onClick }) {
  return (
    <button onClick={onClick} className={`${color} p-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover:scale-105 transition-transform shadow-sm`}>
      <div className={`${iconColor} text-white p-3 rounded-full shadow-md`}>{icon}</div>
      <span className="font-bold text-xs text-center leading-tight mt-1">{label}</span>
    </button>
  );
}