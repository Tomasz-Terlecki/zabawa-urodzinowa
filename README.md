# Teleturniej urodzinowy

Domowy teleturniej na urodziny mamy: dwie drużyny, kilka konkurencji (przysłowia z kołem fortuny, licytacja wersów, bomba, akronimy, kalambury, czółko, zdjęcia mamy) i tablica wyników na telewizorze.

To zwykłe pliki HTML/JS, które otwiera się w przeglądarce (Edge lub Chrome) dwuklikiem. Nie trzeba niczego instalować ani uruchamiać serwera.

## Jak to działa

Są dwa okna:

- **`admin.html`** to panel prowadzącego na laptopie. Stąd przełącza się konkurencje, przyznaje punkty, widzi odpowiedzi i teksty piosenek.
- **`screen.html`** to ekran dla gości, wyświetlany na telewizorze. Otwiera się go z panelu przyciskiem „📺 Otwórz ekran TV” i pokazuje tylko to, co goście mają widzieć.

Oba okna synchronizują się między sobą w obrębie jednej przeglądarki na tym samym komputerze.

## Co gdzie jest

| Ścieżka | Zawartość |
|---|---|
| `admin.html` | Panel prowadzącego (od tego zaczynasz) |
| `index.html` | Tylko przekierowanie na `admin.html` (dla krótszego adresu wersji online) |
| `screen.html` | Ekran na telewizor |
| `data/pytania.js` | **Cała treść gry**: przysłowia, piosenki do licytacji i czółka, pytania do bomby, akronimy, hasła do kalamburów, lista zdjęć. Tu się edytuje pytania. |
| `zdjecia/` | Zdjęcia do konkurencji „Zdjęcia mamy” (trzeba je też dopisać w `data/pytania.js`) |
| `zapis/` | Folder na zapis gry: `wyniki.csv` (historia punktów, otwiera się w Excelu), `stan.json` (pełny stan gry) i archiwa po resecie |
| `css/style.css` | Wygląd i motywy ekranu TV |
| `js/` | Logika: `admin.js` (panel), `screen.js` (ekran TV), `state.js` (wspólny stan i synchronizacja okien), `zapis.js` (zapis do folderu) |

## Szybki start

1. Otwórz `admin.html` w Edge lub Chrome.
2. Wpisz nazwy drużyn.
3. Kliknij „📁 Wybierz folder zapisu” i wskaż folder `zapis`.
4. Kliknij „📺 Otwórz ekran TV” i przeciągnij to okno na telewizor.

Pełny opis wszystkich konkurencji, skrótów klawiszowych, zapisu i wznawiania gry jest w **[INSTRUKCJA.md](INSTRUKCJA.md)**.

## Wersja online (GitHub Pages)

Grę można też otworzyć z dowolnego urządzenia, bez pobierania plików:

**https://tomasz-terlecki.github.io/zabawa-urodzinowa/**

Ten adres przekierowuje na panel prowadzącego. Strona aktualizuje się sama po każdym pushu na gałąź `main`. Działa tylko wtedy, gdy GitHub Pages jest włączone w ustawieniach repozytorium (Settings → Pages → Deploy from a branch → `main`, `/ (root)`).

Czym różni się od wersji z dysku:

- **Strona jest publiczna.** Każdy, kto zna adres, zobaczy grę razem z odpowiedziami z `data/pytania.js`.
- **Nie ma zdjęć mamy.** Folder `zdjecia/` nie trafia do repozytorium (poza przykładowym zdjęciem), więc konkurencję „Zdjęcia mamy” najlepiej prowadzić z wersji z dysku.
- **Każde urządzenie zaczyna od zera.** Stan gry, wgrane mp3 i wybrany folder zapisu są przechowywane w przeglądarce danego urządzenia. Na nowym komputerze trzeba je ustawić od nowa.
- **Do otwarcia strony potrzebny jest internet.** Po załadowaniu gra nadal niczego nie wysyła.

## Prywatność

Aplikacja **niczego nie wysyła do internetu**. Nie ma serwera, kont ani analityki i nie pobiera zewnętrznych bibliotek ani czcionek. Uruchomiona z dysku wczytuje wszystkie pliki (skrypty, style, zdjęcia, muzykę) lokalnie, więc działa też bez Wi-Fi. W wersji online internet jest potrzebny tylko do pobrania plików strony z GitHuba.

Dane zostają na urządzeniu, na którym gra jest uruchomiona:

- bieżący stan gry jest w pamięci przeglądarki (`localStorage`);
- wgrane pliki mp3 i wskazany folder zapisu przeglądarka pamięta lokalnie (`IndexedDB`);
- wyniki i stan gry trafiają tylko do wybranego folderu na dysku (`zapis/`), i to dopiero po wyrażeniu zgody w przeglądarce.

Zawartość folderów `zdjecia/` i `zapis/` jest wpisana do `.gitignore`, więc zdjęcia i wyniki nie trafiają do repozytorium. Treść pytań w `data/pytania.js` jest w repozytorium, więc nie wpisuj tam niczego, czego nie chcesz upubliczniać.
