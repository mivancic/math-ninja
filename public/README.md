# 🥷 Matematički Ninja

Zabavna edukacijska igra za učenje tablice množenja (1-10) namijenjena djeci od 6-12 godina.

## 🎯 Značajke

### ✅ Implementirane funkcionalnosti:

- **10 razina** - svaka za jedan broj tablice množenja (1-10)
- **4 ponuđena odgovora** - multiple choice format
- **Timer** - 10 sekundi po pitanju (8 za dnevni izazov)
- **Bodovanje** - osnovni bodovi + bonus za nizove
- **Vizualne povratne informacije** - animacije za točne/netočne odgovore
- **Praćenje napretka** - statistike, globalne statistike, broj dana vježbanja
- **Motivacijski elementi** - završni zaslon, zvjezdice, streak brojač
- **Dnevni izazov** - miješana tablica množenja s kraćim vremenom
- **Responsive design** - prilagođeno za mobilne uređaje

## 🛠️ Tehnička arhitektura

### Refaktorirana struktura:

```
public/
├── index.php (HTML struktura)
├── assets/
│   ├── css/
│   │   ├── main.css (osnovni stilovi)
│   │   ├── components.css (komponente)
│   │   ├── animations.css (animacije)
│   │   └── responsive.css (mobilni dizajn)
│   ├── js/
│   │   ├── config.js (konfiguracija)
│   │   ├── game.js (logika igre)
│   │   └── app.js (glavna aplikacija)
│   └── sounds/ (pripravljeno za audio)
└── README.md
```

### Tehnologije:

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Backend**: PHP (minimalno korištenje)
- **Persistencija**: localStorage
- **Module System**: ES6 modules

## 🚀 Instalacija i pokretanje

### Preduvjeti:

- PHP 7.0+ (za lokalni razvoj)
- Moderni web pregljednik s podrškom za ES6

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

## 📁 Struktura koda

### `/assets/css/`

- **main.css**: Osnovni stilovi, layout, tipografija
- **components.css**: Stilovi za gumbove, kartiče, ninja avatar
- **animations.css**: CSS animacije i keyframe definicije
- **responsive.css**: Media queries za mobilne uređaje

### `/assets/js/`

- **config.js**: Konstante, konfiguracija, performance tiers
- **game.js**: `GameEngine` klasa - logika igre, generiranje pitanja, bodovanje
- **app.js**: `MathNinjaApp` klasa - glavna aplikacija, UI koordinacija

## 🎮 Kako igrati

1. **Odaberi razinu**: Klikni na broj tablice množenja (1-10)
2. **Odgovori na pitanja**: Imaš 10 sekundi po pitanju
3. **Gradi nizove**: Uzastopni točni odgovori donose bonus bodove
4. **Provjeri napredak**: Pogledaj statistike i osvojene zvjezdice
5. **Dnevni izazov**: Testiraj se s miješanim tablicama

## 📊 Sustav bodovanja

- **Osnovni bodovi**: 10 bodova po točnom odgovoru
- **Bonus za nizove**: +5 bodova svakih 3 uzastopna točna odgovora
- **Zvjezdice**: Osnovu na postotku točnosti (80%+ za completion)
- **Performance tiers**: 5 razina ocjena (😟 → 🤩)

## 🔧 Razvoj i doprinosi

### Priprema za nove funkcionalnosti:

Projekt je refaktoriran za lakše dodavanje novih značajki:

- **Modularni kod**: Svaka komponenta ima svoju odgovornost
- **Čisti API**: Jednostavno dodavanje novih igara i funkcionalnosti
- **Skalabilnost**: Pripremljeno za framework migraciju

### Sljedeći koraci:

1. **Zvučni efekti** (Task 1)
2. **Sustav nagrada** (Task 2)
3. **Prilagodljiva težina** (Task 4)

### Kodiranje standardi:

- ES6+ JavaScript s modulima
- JSDoc komentari za sve funkcije
- Dosljedna konvencija imenovanja
- Pristup "mobile-first" za CSS

## 📱 Kompatibilnost

- **Desktop**: Chrome, Firefox, Safari, Edge
- **Mobile**: iOS Safari, Android Chrome
- **Minimalni zahtjevi**: ES6 support, localStorage

## 📄 Licenca

Edukacijski projekt - slobodno za korištenje i modificiranje.

---

**Razvijeno s ❤️ za bolje učenje matematike! 🥷📚**
