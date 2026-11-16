// =====================================================================
//  TREŚCI DO TELETURNIEJU – tu edytujesz akronimy i przysłowia.
//  Zasady: każdy wpis w osobnej linii, zakończony przecinkiem,
//  teksty w apostrofach '...'. Po zmianie odśwież panel i ekran TV (F5).
// =====================================================================

window.PYTANIA = {

  // Akronimy: skrót + pełne rozwinięcie.
  // Pierwsze litery słów pasujące do skrótu zostaną wyróżnione na ekranie.
  akronimy: [
    { skrot: 'PKP',   rozwiniecie: 'Polskie Koleje Państwowe' },
    { skrot: 'ZUS',   rozwiniecie: 'Zakład Ubezpieczeń Społecznych' },
    { skrot: 'PRL',   rozwiniecie: 'Polska Rzeczpospolita Ludowa' },
    { skrot: 'NFZ',   rozwiniecie: 'Narodowy Fundusz Zdrowia' },
    { skrot: 'PKO',   rozwiniecie: 'Powszechna Kasa Oszczędności' },
    { skrot: 'PZU',   rozwiniecie: 'Powszechny Zakład Ubezpieczeń' },
    { skrot: 'GOPR',  rozwiniecie: 'Górskie Ochotnicze Pogotowie Ratunkowe' },
    { skrot: 'TOPR',  rozwiniecie: 'Tatrzańskie Ochotnicze Pogotowie Ratunkowe' },
    { skrot: 'PKS',   rozwiniecie: 'Państwowa Komunikacja Samochodowa' },
    { skrot: 'OSP',   rozwiniecie: 'Ochotnicza Straż Pożarna' },
    { skrot: 'PAN',   rozwiniecie: 'Polska Akademia Nauk' },
    { skrot: 'PWN',   rozwiniecie: 'Państwowe Wydawnictwo Naukowe' },
    { skrot: 'IPN',   rozwiniecie: 'Instytut Pamięci Narodowej' },
    { skrot: 'MPK',   rozwiniecie: 'Miejskie Przedsiębiorstwo Komunikacyjne' },
    { skrot: 'PZPN',  rozwiniecie: 'Polski Związek Piłki Nożnej' },
    { skrot: 'PESEL', rozwiniecie: 'Powszechny Elektroniczny System Ewidencji Ludności' },
  ],

  // Przysłowia – koło fortuny. 2 rundy = 2 przysłowia (pierwsze dwa), reszta to zapas.
  // Zgaduje się spółgłoski oraz Ą, Ę, Ó (A, E, I, O, U, Y odsłaniają się dopiero z całym hasłem).
  // TODO Karol i tata: podmienić na wybrane przysłowia (dla zmyłki najlepiej bez Ą, Ę, Ó).
  przyslowia: [
    'Gdzie kucharek sześć, tam nie ma co jeść',   // runda 1
    'Bez pracy nie ma kołaczy',                   // runda 2
    'Co nagle, to po diable',                     // zapas
    'Kto pod kim dołki kopie, ten sam w nie wpada', // zapas
  ],

  // Licytacja wersów piosenki: runda 1 lub 2, tytuł, wykonawca, maks. liczba wersów do wylicytowania.
  //   tekst – tekst piosenki widoczny TYLKO w panelu prowadzącego (jedna linijka = jeden wers,
  //           puste linie oddzielają zwrotki i nie są liczone). Wpisz go między znaki ` `.
  //   mp3   – (opcjonalnie) ścieżka do pliku, np. 'muzyka/sokoly.mp3'. Plik można też wgrać
  //           przyciskiem w panelu (zapamięta się w przeglądarce).
  //   Jeśli nie podasz maxWersow, limitem będzie liczba wersów w tekście.
  // TODO Kasia i tata: podmienić na wybrane piosenki i wkleić teksty.
  licytacja: [
    { runda: 1, tytul: 'Hej, sokoły', autor: 'pieśń ludowa', maxWersow: 8, mp3: '',
      tekst: `
Hej, tam gdzieś znad czarnej wody
Siada na koń kozak młody
Czule żegna się z dziewczyną
Jeszcze czulej z Ukrainą

Hej, hej, hej sokoły
Omijajcie góry, lasy, doły
Dzwoń, dzwoń, dzwoń dzwoneczku
Mój stepowy skowroneczku
` },
    { runda: 1, tytul: 'Szła dzieweczka do laseczka', autor: 'pieśń ludowa', maxWersow: 8, mp3: '', tekst: `` },
    { runda: 2, tytul: 'Jesteś szalona',              autor: 'Boys',         maxWersow: 8, mp3: '', tekst: `` },
    { runda: 2, tytul: 'Czerwone korale',             autor: 'Bayer Full',   maxWersow: 8, mp3: '', tekst: `` },
  ],

  // Bomba – urodziny: pytania indywidualne (pytanie + odpowiedź widoczna tylko dla prowadzącego).
  bomba: [
    { pytanie: 'Jak nazywa się góralska zupa z kiszonej kapusty?', odpowiedz: 'Kwaśnica' },
    { pytanie: 'Szczecin leży nad morzem – prawda czy fałsz?', odpowiedz: 'Fałsz' },
    { pytanie: 'Jakie owoce znajdują się w tradycyjnej polskiej szarlotce?', odpowiedz: 'Jabłka' },
    { pytanie: 'Kto jest autorem wiersza „Lokomotywa”?', odpowiedz: 'Julian Tuwim' },
    { pytanie: 'Jaki jest tytuł hymnu reprezentacji Polski w piłce nożnej na mistrzostwach Europy rozgrywanych w Polsce i Ukrainie w 2012 roku?', odpowiedz: 'Ko-ko Euro spoko' },
    { pytanie: 'W jakim fikcyjnym miasteczku toczy się akcja kultowego serialu komediowego „Ranczo”?', odpowiedz: 'Wilkowyje' },
    { pytanie: 'Podaj jeden z tytułów ekranizacji trylogii Henryka Sienkiewicza.', odpowiedz: '„Potop”, „Pan Wołodyjowski”, „Ogniem i mieczem”' },
    { pytanie: 'Jak nazywa się słynny teleturniej prowadzony przez Karola Strasburgera?', odpowiedz: 'Familiada' },
    { pytanie: 'Jak nazywa się najwyższy szczyt w Polsce?', odpowiedz: 'Rysy' },
    { pytanie: 'Jak nazywa się najdłuższa rzeka przepływająca przez Polskę?', odpowiedz: 'Wisła' },
    { pytanie: 'Jakie miasto było pierwszą stolicą Polski?', odpowiedz: 'Gniezno' },
    { pytanie: 'Jak nazywa się potrawa z surowego mięsa mielonego, podawana z żółtkiem, cebulką i ogórkiem kiszonym, bardzo popularna na polskich imprezach?', odpowiedz: 'Befsztyk tatarski / tatar' },
    { pytanie: 'W jaki dzień tygodnia zgodnie z polską tradycją najczęściej jada się rosół z makaronem?', odpowiedz: 'W niedzielę' },
    { pytanie: 'W jakim sporcie zimowym brał udział słynny polski sportowiec Adam Małysz?', odpowiedz: 'Skoki narciarskie' },
    { pytanie: 'Jaki sport uprawiał Pudzian (Mariusz Pudzianowski), zanim zadebiutował w MMA?', odpowiedz: 'Strongman / podnoszenie ciężarów / zawody siłaczy' },
    { pytanie: 'W jakim mieście co roku odbywa się słynny Krajowy Festiwal Piosenki Polskiej?', odpowiedz: 'W Opolu' },
    { pytanie: 'Z jakiego miasta pochodzą tradycyjne, wypiekane pierniki?', odpowiedz: 'Z Torunia' },
    { pytanie: 'Jak nazywa się słynny polski półwysep w kształcie długiego, wąskiego skrawka lądu (z Mierzeją)?', odpowiedz: 'Półwysep Helski / Hel' },
    { pytanie: 'Jak nazywa się słynny ser produkowany na Podhalu z mleka owczego?', odpowiedz: 'Oscypek' },
    { pytanie: 'Jak się nazywa aktor grający tytułową rolę w filmie „Kiler”?', odpowiedz: 'Cezary Pazura' },
    { pytanie: 'Jak nazywają się tradycyjne małe pierożki z mięsem, które obowiązkowo wrzuca się do barszczu czerwonego na Wigilię?', odpowiedz: 'Uszka' },
    { pytanie: 'Kto jest autorem polskiego hymnu narodowego?', odpowiedz: 'Józef Wybicki' },
    { pytanie: 'Jaki zespół śpiewa wielki hit „Przez twe oczy zielone”?', odpowiedz: 'Akcent' },
    { pytanie: 'Jak brzmi tytuł piosenki Maryli Rodowicz, która zaczyna się od słów „Małgośka, mówią mi”?', odpowiedz: '„Małgośka”' },
    { pytanie: 'Które polskie miasto leży na największej liczbie wysp i wysepek – ponad 40?', odpowiedz: 'Świnoujście' },
    { pytanie: 'Jak nazywa się najgłębsze jezioro w Polsce?', odpowiedz: 'Hańcza' },
    { pytanie: 'Jakie województwo jest najmniejsze pod względem powierzchni?', odpowiedz: 'Opolskie' },
    { pytanie: 'Podaj trzy składniki potrzebne do przygotowania pierogów ruskich.', odpowiedz: 'Ziemniaki, twaróg, cebula, mąka pszenna, woda, sól' },
    { pytanie: 'Która z polskich uczelni jest najstarsza?', odpowiedz: 'UJ / Uniwersytet Jagielloński' },
    { pytanie: 'Kto stronił od cebuli w wierszu Jana Brzechwy „Na straganie”?', odpowiedz: 'Burak' },
    { pytanie: '„Jako że” piszemy łącznie czy oddzielnie?', odpowiedz: 'Oddzielnie' },
    { pytanie: '30 czy 42 – ile pięter ma Pałac Kultury i Nauki w Warszawie?', odpowiedz: '42' },
    { pytanie: 'Jak nazywa się 25. rocznica ślubu – srebrna czy złota?', odpowiedz: 'Srebrna' },
    { pytanie: 'Człowiek, który trzyma węża w kieszeni, jest zgodnie z powiedzeniem spłukany czy skąpy?', odpowiedz: 'Skąpy' },
    { pytanie: 'Który z muchomorów jest bardziej trujący – sromotnikowy czy czerwony?', odpowiedz: 'Sromotnikowy' },
    { pytanie: 'Jakie jest najpopularniejsze miejsce na śmietnik w kuchni?', odpowiedz: 'Pod zlewem' },
  ],

  // Czółko: piosenki (tytuł + wykonawca). Po 6 na drużynę = 12 sztuk.
  // Kolejność numerków na ekranie jest losowana, więc nie trzeba tu mieszać.
  czolko: [
    { tytul: 'Jolka, Jolka pamiętasz',       autor: 'Budka Suflera' },
    { tytul: 'Przeżyj to sam',               autor: 'Lombard' },
    { tytul: 'Dmuchawce, latawce, wiatr',    autor: 'Urszula' },
    { tytul: 'Autobiografia',                autor: 'Perfect' },
    { tytul: 'Kolorowe jarmarki',            autor: 'Maryla Rodowicz' },
    { tytul: 'Małgośka',                     autor: 'Maryla Rodowicz' },
    { tytul: 'Wehikuł czasu',                autor: 'Dżem' },
    { tytul: 'Chałupy Welcome To',           autor: 'Zbigniew Wodecki' },
    { tytul: 'Szczęśliwej drogi, już czas',  autor: 'Ryszard Rynkowski' },
    { tytul: 'Kocham wolność',               autor: 'Chłopcy z Placu Broni' },
    { tytul: 'Mniej niż zero',               autor: 'Lady Pank' },
    { tytul: 'Zawsze tam, gdzie ty',         autor: 'Lady Pank' },
  ],

  // Kalambury: dwa zestawy haseł (A – pierwsza drużyna, B – druga),
  // od średnich do trudnych. Prowadzący odhacza je w panelu.
  kalambury: {
    A: [
      // średnie
      'pszczoła', 'szczoteczka do zębów', 'tort urodzinowy', 'strażak', 'wędkarz', 'piłka nożna', 'latarnia morska',
      // trudne
      'myszka bezprzewodowa', 'ekspres do kawy', 'kolejka w sklepie', 'paragon fiskalny', 'kac', 'Kopciuszek',
      'zmywarka', 'ładowarka do telefonu', 'drukarka', 'hulajnoga elektryczna', 'selfie', 'budzik', 'dieta',
      'zachód słońca', 'burza z piorunami', 'wesele', 'imieniny', 'przeprowadzka', 'prognoza pogody',
      'zebranie z rodzicami', 'przegląd samochodu', 'zakupy przez internet', 'przelew bankowy', 'hasło do Wi-Fi',
      'poniedziałek rano', 'teściowa', 'Mikołaj', 'Śpiąca Królewna', 'syrenka warszawska', 'Kolumb',
    ],
    B: [
      // średnie
      'żyrafa', 'suszarka do włosów', 'bukiet kwiatów', 'lekarz', 'fryzjer', 'jazda na nartach', 'wieża Eiffla',
      // trudne
      'pilot do telewizora', 'odkurzacz automatyczny', 'korek na autostradzie', 'karta płatnicza', 'czkawka', 'Czerwony Kapturek',
      'mikrofalówka', 'słuchawki douszne', 'klawiatura', 'GPS w telefonie', 'wideorozmowa', 'drzemka po obiedzie', 'siłownia',
      'tęcza', 'gołoledź', 'chrzciny', 'rocznica ślubu', 'remont mieszkania', 'horoskop',
      'wywiadówka', 'mandat za parkowanie', 'kurier z paczką', 'bankomat', 'kod PIN',
      'Wigilia', 'sąsiad zza ściany', 'Zajączek Wielkanocny', 'Królewna Śnieżka', 'smok wawelski', 'Kopernik',
    ],
  },

  // Zdjęcia mamy (konkurencja dodatkowa): zdjęcie zakryte kafelkami, odkrywanymi stopniowo.
  //   plik    – ścieżka do zdjęcia; pliki wrzuć do folderu zdjecia/ (np. 'zdjecia/01.jpg')
  //   podpis  – widzi prowadzący (np. co to za uroczystość); na TV tylko po kliknięciu „Pokaż podpis”
  //   kolumny / wiersze – ile kafelków poziomo i pionowo (można też zmienić w panelu)
  zdjecia: [
    { plik: 'zdjecia/wiewiorka.png', podpis: 'Wiewiórka', kolumny: 4, wiersze: 3 },

    // { plik: 'zdjecia/01.jpg', podpis: 'Wesele, 1990', kolumny: 4, wiersze: 3 },
    // { plik: 'zdjecia/02.jpg', podpis: 'Wakacje nad morzem – Łeba', kolumny: 5, wiersze: 4 },
  ],
};
