# 🥷 Matematički Ninja

Zabavna edukacijska igra za učenje tablice množenja (1-10) namijenjena djeci od 6-12 godina.

## 🎯 Značajke

### ✅ Implementirane funkcionalnosti:

- **10 razina** - svaka za jedan broj tablice množenja (1-10)
- **4 ponuđena odgovora** - multiple choice format
- **Timer** - 10 sekundi po pitanju (8 za dnevni izazov)
- **Bodovanje** - osnovni bodovi + bonus za nizove
- **Vizualne povratne informacije** - animacije za točne/netočne odgovore
- **🔊 Audio sistem** - zvučni efekti i pozadinska glazba
- **🎛️ Audio kontrole** - volume sliders, mute dugmad, odvojene kontrole
- **⚙️ Postavke sustav** - konfiguracija igre i audio postavki
- **📱 Sliding Settings Panel** - dostupnost postavki tokom igre
- **🎵 Button Audio Feedback** - hover i click zvukovi za all buttons
- **Praćenje napretka** - statistike, globalne statistike, broj dana vježbanja
- **Motivacijski elementi** - završni zaslon, zvjezdice, streak brojač
- **Dnevni izazov** - miješana tablica množenja s kraćim vremenom
- **Responsive design** - prilagođeno za mobilne uređaje

### 🎵 Audio Sistem (Task 1) ✅ COMPLETED

#### Zvučni Efekti:

- **Correct Answer** 🎵 - ohrabrujući rising tone
- **Incorrect Answer** 🔉 - blagi falling tone
- **Timeout** ⏰ - neutralni double beep
- **Streak Celebrations** 🎊 - progresivni arpeggi za 3+, 5+, 10+ streaks
- **Level Complete** 🏆 - victory fanfare
- **New Record** 🌟 - specijalni celebration sound
- **Button Hover** 🖱️ - suptilni hover feedback
- **Button Click** 👆 - crisp click acknowledgment

#### Background Music:

- **Ambient pozadinska glazba** - opcionalna, diskretna
- **Automatsko pokretanje** - na menu screen
- **Loop funkcionalnost** - neprekidna reprodukcija

#### Audio Kontrole:

- **Master Mute** 🔇 - globalito utišavanje
- **Effects Volume** 🔊 - kontrola glasnoće efekata (0-100%)
- **Music Volume** 🎵 - kontrola glasnoće glazbe (0-100%)
- **Separate Mute Controls** - nezavislso utišavanje
- **Preference Persistence** - čuvanje postavki u localStorage
- **Real-time Sync** - sve kontrole su sinhronizirane

### ⚙️ Settings UI Enhancement ✅ COMPLETED

#### Glavne značajke:

- **Settings Screen** 📱 - dedicirani zaslon za sve postavke
- **In-Game Settings Panel** 🔄 - sliding panel dostupan tokom igre
- **Settings Button** ⚙️ - na glavnom meniju
- **Audio Settings Section** 🔊 - organizirana kontrola zvuka
- **Future-Ready Structure** 🚀 - framework za buduće postavke

#### UI/UX Poboljšanja:

- **Smooth Animations** ✨ - sliding panel s cubic-bezier transitions
- **Visual Audio State** 👁️ - muted states, volume percentages
- **Synchronized Controls** 🔄 - identična funkcionalnost cross-platform
- **Responsive Design** 📱 - optimized za sve device sizes
- **Accessibility** ♿ - touch-friendly controls, keyboard navigation

#### Button Audio Feedback:

- **Hover Sounds** 🖱️ - suptilni feedback na mouse enter
- **Click Sounds** 👆 - instant acknowledgment za sve interactions
- **Dynamic Generation** 🎼 - Web Audio API za custom UI sounds
- **Volume Aware** 🔊 - respects user volume preferences
- **Graceful Degradation** 💪 - radi bez audio support

## 🛠️ Tehnička arhitektura

### Refaktorirana struktura:

```
public/
├── index.php (HTML s Settings UI)
├── assets/
│   ├── css/
│   │   ├── main.css (osnovni stilovi)
│   │   ├── components.css (komponente + settings UI + audio controls)
│   │   ├── animations.css (animacije)
│   │   └── responsive.css (mobilni dizajn + settings responsive)
│   ├── js/
│   │   ├── config.js (konfiguracija + button audio settings)
│   │   ├── game.js (logika igre)
│   │   ├── audio.js (🆕 AudioManager klasa + UI sound generation)
│   │   └── app.js (glavna aplikacija s Settings UI integration)
│   └── sounds/
│       ├── correct.wav, incorrect.wav, timeout.wav
│       ├── streak-3.wav, streak-5.wav, streak-10.wav
│       ├── level-complete.wav, new-record.wav
│       ├── background-music.wav
│       └── [button-hover.wav, button-click.wav] (generated dynamically)
└── README.md
```

### Settings Architecture:

#### Settings Screen Structure:

```html
<div class="settings-screen">
  <h2>⚙️ Postavke</h2>
  <div class="settings-sections">
    <div class="settings-section">
      <h3>🔊 Audio Postavke</h3>
      <!-- Audio controls with live feedback -->
    </div>
    <div class="settings-section">
      <h3>🎮 Igra Postavke</h3>
      <!-- Future game settings -->
    </div>
  </div>
</div>
```

#### Sliding Panel Integration:

```javascript
// In-game settings toggle
toggleInGameSettings() {
  const panel = document.getElementById('settingsPanel');
  panel.classList.toggle('open');
}

// Synchronized audio controls
syncVolumeSliders(type, value) {
  ['panel', 'settings'].forEach(prefix => {
    const slider = document.getElementById(`${prefix}${type}VolumeSlider`);
    if (slider) slider.value = value;
  });
}
```

#### Dynamic UI Sound Generation:

```javascript
// Web Audio API button sound generation
generateUISound(soundName) {
  switch (soundName) {
    case 'button-hover':
      return generateTone(800, 0.1, 0.1); // Soft high tone
    case 'button-click':
      return generateClickSound(); // Frequency sweep
  }
}
```

### Tehnologije:

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Audio**: Web Audio API + HTML5 Audio fallback + dynamic generation
- **UI**: CSS Backdrop-filter, CSS Grid, Flexbox
- **Interactions**: Event delegation, passive event listeners
- **Backend**: PHP (minimalno korištenje)
- **Persistencija**: localStorage (game data + audio preferences + settings)
- **Module System**: ES6 modules

## 🚀 Instalacija i pokretanje

### Preduvjeti:

- PHP 7.0+ (za lokalni razvoj)
- Moderni web pregljednik s podrškom za ES6
- Audio support (Web Audio API ili HTML5 Audio)

### Pokretanje:

```bash
# Kloniraj repozitorij
git clone [repository-url]

# Navigiraj u direktorij
cd math-ninja/public

# Pokreni PHP server
php -S localhost:8000

# Otvori u pregledniku
http://localhost:8000
```

## 🎮 Kako igrati

1. **Podesi audio i postavke** ⚙️: Klikni "Postavke" za kompletnu konfiguraciju
2. **In-game postavke** 🔄: Tijekom igre klikni ikonu postavki u gornjem desnom kutu
3. **Audio feedback** 🔊: Uživaj u hover i click zvukovima na svim gumbovima
4. **Odaberi razinu**: Klikni na broj tablice množenja (1-10)
5. **Odgovori na pitanja**: Imaš 10 sekundi po pitanju
6. **Slušaj povratne informacije**: Različiti zvukovi za točne/netočne odgovore
7. **Gradi nizove**: Uzastopni točni odgovori donose bonus bodove i celebration sounds
8. **Provjeri napredak**: Pogledaj statistike i osvojene zvjezdice
9. **Dnevni izazov**: Testiraj se s miješanim tablicama

## 🎵 Audio Funkcionalnosti

### Korisničke Kontrole:

- **Floating Settings Toggle** - během igre dostupno
- **Dedicated Settings Screen** - kompletna konfiguracija
- **Volume Sliders** - fine-tuning glasnoće (synced across UI)
- **Quick Mute Buttons** - brzo utišavanje po kategorijama
- **Visual Feedback** - indikatori za muted state i volume percentages

### Button Audio Feedback:

- **Hover Feedback** 🖱️ - diskretni zvuk na mouse enter
- **Click Acknowledgment** 👆 - instant feedback za sve interactions
- **Smart Volume** 🧠 - automatski respects user volume settings
- **Generated Sounds** 🎼 - custom UI sounds via Web Audio API
- **Cross-Platform** 📱 - works na desktop i mobile

### Adaptive Audio:

- **Context-Aware Music** - background music samo na menu
- **Progressive Celebrations** - jači zvukovi za veće streaks
- **Non-Intrusive Design** - zvukovi ne prekidaju gameplay
- **Preference Memory** - postavke se čuvaju između sesija
- **Real-time Updates** - sve audio kontrole su instantly synced

## 📊 Sustav bodovanja

- **Osnovni bodovi**: 10 bodova po točnom odgovoru + sound feedback
- **Bonus za nizove**: +5 bodova svakih 3 uzastopna točna odgovora + celebration sounds
- **Zvjezdice**: Osnovu na postotku točnosti (80%+ za completion)
- **Performance tiers**: 5 razina ocjena (😟 → 🤩) s audio feedback
- **New Records**: Specijalni audio celebration za personal bests

## 🔧 Razvoj i doprinosi

### Settings Development:

#### Settings Screen Creation:

```bash
# Struktura postavki
- Dedicated settings screen sa sections
- Audio settings s real-time feedback
- Placeholder za future features
- Responsive design za sve devices
```

#### In-Game Settings Panel:

```bash
# Sliding panel functionality
- CSS transforms za smooth animations
- Event handlers za open/close
- Synchronized controls sa main settings
- Mobile-optimized UX
```

#### Button Audio Integration:

```bash
# Universal button feedback
- Automatic hover sound attachment
- Click sound wrapping za existing handlers
- Volume-aware UI sounds
- Graceful degradation strategy
```

### Sljedeći koraci:

1. **🔊 Sound Effects** ✅ COMPLETED (Task 1)
2. **⚙️ Settings UI** ✅ COMPLETED (Settings Enhancement)
3. **🏆 Sustav nagrada** (Task 2) - READY TO IMPLEMENT
4. **🎯 Prilagodljiva težina** (Task 4) - Settings framework prepared

## 📱 Kompatibilnost

### Browser Support:

- **Desktop**: Chrome, Firefox, Safari, Edge
- **Mobile**: iOS Safari, Android Chrome
- **Audio**: Web Audio API (preferred) + HTML5 Audio (fallback)
- **Settings**: All modern browsers s CSS backdrop-filter support

### Audio Features:

- **Auto-unlock on mobile** - handles iOS audio restrictions
- **Graceful degradation** - game works bez audio support
- **Performance optimized** - preloading i caching
- **Cross-platform tested** - različiti browsers i devices
- **Dynamic generation** - Web Audio API za UI sounds

### Settings Features:

- **Responsive Sliding Panel** - optimized za mobile touch
- **Keyboard Navigation** - accessible controls
- **Preference Persistence** - settings saved across sessions
- **Real-time Sync** - changes reflect immediately
- **Future-Ready** - extensible za new setting categories

## 🐛 Troubleshooting

### Audio Issues:

#### Zvuk se ne čuje:

1. Provjeri Settings screen ili in-game settings panel
2. Provjeri da nisu muted (crvene kontrole)
3. Provjeri master volume slider
4. Na mobile: klikni bilo gdje za audio unlock

#### UI Sounds:

1. Button hover/click sounds generated dynamically
2. Depend na Web Audio API support
3. Gracefully degrade if not supported
4. Respect effects volume settings

#### Settings Panel:

1. Sliding panel može takes moment na slow devices
2. Backdrop-filter requires modern browser
3. Touch targets optimized za mobile
4. All settings persist automatically

### Performance:

- **Settings UI**: Minimal impact, CSS transforms optimized
- **Button Audio**: Generated on-demand, cached efficiently
- **Sync Operations**: Debounced za smooth interaction
- **Mobile Performance**: Touch events optimized

## 📄 Licenca

Edukacijski projekt - slobodno za korištenje i modificiranje.

---

**Razvijeno s ❤️ za bolje učenje matematike! 🥷📚🎵⚙️**
