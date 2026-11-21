# Teleturniej urodzinowy – instrukcja

## Start
1. Otwórz `admin.html` w **Edge** lub **Chrome** (dwuklik na pliku).
2. Pojawi się okno **Nazwy drużyn**: wpisz nazwy (i kolory), kliknij „Zaczynamy!”.
   Później zmienisz je przyciskiem **✏️ Nazwy drużyn** albo klikając nazwę drużyny po lewej.
3. Kliknij **📁 Wybierz folder zapisu** i wskaż folder `zapis` (przeglądarka zapyta o zgodę – zezwól).
4. Kliknij **📺 Otwórz ekran TV**, przeciągnij okno na telewizor, kliknij w nie (pełny ekran + dźwięk).

## Podczas gry
- Zakładki „Na ekranie TV” idą w kolejności teleturnieju i przełączają, co widzą goście.
- Punkty: przyciski +1 / +2 / +3 / +5 lub własna liczba po lewej, klawisze `1` / `2` dają +1.
- Pomyłka? `Ctrl+Z` albo **↶ Cofnij ostatnie**.
- **🎨 Motyw ekranu TV** (lista w górnym pasku panelu): Klasyczny, **Rzutnik / jasna sala** (białe tło, czarny tekst, maksymalny kontrast – na słońce i mocne światło), Złota gala, Urodzinowe konfetti. Zmiana działa od razu na telewizorze.

### 🏆 Wyniki
Duże wyniki obu drużyn albo (przycisk **📋 Pokaż tabelę na TV**) tabela punktów w każdej konkurencji z sumą.

### 1. Przysłowia – koło fortuny (2 rundy)
Wybierz drużynę (`←` / `→`), wpisz literę (polskie: AltGr+A itd.) lub kliknij w panelu.
- Zgaduje się **spółgłoski oraz Ą, Ę, Ó** – **2 pkt za każde wystąpienie** (np. 2× G = 4 pkt).
- A, E, I, O, U, Y są zablokowane – odsłaniają się dopiero z całym hasłem.
- Odgadnięte hasło: przycisk „✔ … odgaduje” = **+7 pkt**. „Następne przysłowie” = runda 2.

### 2. Licytacja wersów
Zakładka „Licytacja” pokazuje wszystkie piosenki z `data/pytania.js`.
1. TV: tytuł, wykonawca i która drużyna zaczyna (ta z mniejszą liczbą punktów; przy remisie wybierz ręcznie).
2. Wpisuj oferty drużyn i klikaj „Licytuj” (każda musi być wyższa od poprzedniej). „↶ Cofnij ofertę” w razie pomyłki.
3. **🔨 Koniec licytacji** → śpiewa drużyna z najwyższą ofertą.
4. **✔ Bez pomyłki** = +1 pkt za wers dla niej, **✖ Pomyłka** = te punkty dostają rywale.

W panelu pod przyciskami widać **tekst piosenki** z numerami wersów (tylko dla prowadzącego) – wylicytowane wersy są podświetlone. Tekst wpisuje się w `data/pytania.js` (pole `tekst`, jedna linijka = jeden wers).
**🎵 Muzyka:** „⬆ Wgraj mp3” przypisuje plik do bieżącej piosenki (przeglądarka go zapamięta), „▶ Puść” / klawisz `M` – start/pauza, „⏹ Stop” – od początku. Dźwięk leci z komputera z panelem.
**🎶 Śpiewamy razem (karaoke):** po „Bez pomyłki” / „Pomyłka” pojawia się przycisk „Śpiewamy razem – tekst na TV”. Telewizor pokazuje wtedy tekst po 2 wersy (duże, żółte) i zapowiedź kolejnych. Przełączasz strzałkami ← / → (albo przyciskami), kliknięcie wersu w panelu przeskakuje do niego. Ten sam przycisk chowa tekst z TV.

### 3. Bomba – urodziny
TV pokazuje bieżące pytanie i licznik poprawnych odpowiedzi (aplikacja nie gra dźwięków – tykanie i wybuch robi głośniczek).
1. `Enter` = odgadnięte, `Backspace` = nieodgadnięte → następne pytanie.
2. Po wybuchu kliknij **💥 [drużyna]**, u której wybuchła bomba: ona dostaje 0 pkt, rywale **+1 pkt za każdą poprawną odpowiedź** w rundzie. TV: „BUM!”.
3. Pomyłkę w oznaczeniach poprawisz na liście (✔ / ✖ / ↺). „↺ Nowa runda bomby” zeruje licznik.

### 4. Akronimy
`Spacja` = pokaż skrót → odsłoń rozwinięcie → następny (pomija te, które już były).
**✔ [drużyna] (+2)** przyznaje punkty i od razu odsłania rozwinięcie. Wykorzystany akronim przywrócisz przyciskiem **↺ do wzięcia**.

### 6. Kalambury
Drużyna 1 pokazuje hasła z zestawu A, drużyna 2 z zestawu B (można zamienić przyciskiem „⇄”).
1. Wybierz drużynę (`←` / `→`), `Spacja` = start zegara 2:00.
2. W panelu widać duże bieżące hasło – osoba pokazująca czyta je z laptopa (TV go nie pokazuje).
3. `Enter` = odgadnięte (od razu **+1 pkt**), `Backspace` = pomiń. Na TV rośnie licznik „Odgadnięte”.
4. Pomyłkę poprawisz na liście (✔ / ✖ / ↺) – punkty dopasują się same.
5. Po obu drużynach: **📊 Pokaż podsumowanie na TV**.

### 8. Czółko
1. TV pokazuje numerki (1–liczba piosenek, losowo przypisane) i która drużyna wybiera.
2. Kliknij numer wybrany przez drużynę → TV: „odwróćcie się tyłem”.
3. `Spacja` / „Pokaż piosenkę” → TV pokazuje tytuł i wykonawcę, rusza zegar 45 s.
4. **✔ Odgadli** (+3 pkt) albo **✖ Nie odgadli** → kolej drugiej drużyny przechodzi sama.

### ★ Zdjęcia mamy (konkurencja dodatkowa)
Zdjęcie na TV jest zakryte numerowanymi kafelkami, które odkrywasz stopniowo. Co goście mają zgadnąć (uroczystość, miejsce…), mówisz sam.
1. Wrzuć zdjęcia do folderu `zdjecia/` i dopisz je w `data/pytania.js` (sekcja `zdjecia`: plik, podpis, kolumny, wiersze).
2. W panelu widzisz całe zdjęcie z numerami. **Kliknij kafelek**, żeby go odkryć (ponownie – zakryć), albo **🎲 Odkryj losowy kafelek** (`Spacja`).
3. „Kafelki dla tego zdjęcia” – ile poziomo × pionowo (osobno dla każdego zdjęcia; zmiana zakrywa kafelki od nowa).
4. **✨ Odsłoń całe zdjęcie** (`Enter`), **🏷 Pokaż podpis na TV**, `←` / `→` – poprzednie / następne zdjęcie.
5. Punkty dajesz ręcznie po lewej (w tabeli: „Zdjęcia mamy”; na TV ten wiersz pojawia się tylko, gdy ktoś ma w nim punkty).

## Zapis i odtwarzanie
- W folderze zapisu na bieżąco aktualizują się `wyniki.csv` (historia punktów – otworzysz w Excelu) i `stan.json` (pełny stan gry).
- Po ponownym otwarciu panelu kliknij **🔓 Wznów zapis** (przeglądarka wymaga jednego kliknięcia zgody).
- Odtworzenie: **⬆ Wczytaj z pliku** → wybierz `stan.json` (wszystko) albo `wyniki.csv` (same punkty).
- **Reset gry** najpierw pobiera kopię CSV i zapisuje archiwum w folderze zapisu, potem pyta o nazwy drużyn.

## Edycja treści
Plik `data/pytania.js` – akronimy, przysłowia, licytacja, bomba, kalambury i piosenki do Czółka.
Miejsca do uzupełnienia przez inne osoby są oznaczone `TODO` (Karol i tata – przysłowia).
Po zmianie odśwież oba okna (`F5`).

**Sprawdzenie treści i logiki (testy):** w folderze projektu uruchom w terminalu `node --test`.
Testy wyłapią m.in. literówki w akronimach, za długie `maxWersow`, powtórzone piosenki, nieparzystą liczbę piosenek w Czółku, brakujące pliki zdjęć.
