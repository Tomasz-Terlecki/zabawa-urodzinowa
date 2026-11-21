// =====================================================================
//  TREŚCI DO TELETURNIEJU – akronimy, przysłowia, licytacja, bomba, czółko, kalambury, zdjęcia.
//  Po zmianie możesz sprawdzić plik testami: w terminalu `node --test` (folder projektu).
//  Zasady: każdy wpis w osobnej linii, zakończony przecinkiem,
//  teksty w apostrofach '...'. Po zmianie odśwież panel i ekran TV (F5).
// =====================================================================

window.PYTANIA = {

  // Akronimy: skrót + pełne rozwinięcie.
  // Pierwsze litery słów pasujące do skrótu zostaną wyróżnione na ekranie.
  akronimy: [
    // --- łatwe (na rozgrzewkę) ---
    { skrot: 'PKP',    rozwiniecie: 'Polskie Koleje Państwowe' },
    { skrot: 'ZUS',    rozwiniecie: 'Zakład Ubezpieczeń Społecznych' },
    { skrot: 'NFZ',    rozwiniecie: 'Narodowy Fundusz Zdrowia' },
    { skrot: 'PRL',    rozwiniecie: 'Polska Rzeczpospolita Ludowa' },
    { skrot: 'TVP',    rozwiniecie: 'Telewizja Polska' },
    { skrot: 'BHP',    rozwiniecie: 'Bezpieczeństwo i Higiena Pracy' },
    { skrot: 'OSP',    rozwiniecie: 'Ochotnicza Straż Pożarna' },
    { skrot: 'PKO',    rozwiniecie: 'Powszechna Kasa Oszczędności' },
    { skrot: 'GUS',    rozwiniecie: 'Główny Urząd Statystyczny' },
    { skrot: 'WOŚP',   rozwiniecie: 'Wielka Orkiestra Świątecznej Pomocy' },
    // --- średnie ---
    { skrot: 'PESEL',  rozwiniecie: 'Powszechny Elektroniczny System Ewidencji Ludności' },
    { skrot: 'PTTK',   rozwiniecie: 'Polskie Towarzystwo Turystyczno-Krajoznawcze' },
    { skrot: 'GOPR',   rozwiniecie: 'Górskie Ochotnicze Pogotowie Ratunkowe' },
    { skrot: 'PZPN',   rozwiniecie: 'Polski Związek Piłki Nożnej' },
    { skrot: 'NIK',    rozwiniecie: 'Najwyższa Izba Kontroli' },
    { skrot: 'IPN',    rozwiniecie: 'Instytut Pamięci Narodowej' },
    { skrot: 'KRUS',   rozwiniecie: 'Kasa Rolniczego Ubezpieczenia Społecznego' },
    { skrot: 'SOR',    rozwiniecie: 'Szpitalny Oddział Ratunkowy' },
    { skrot: 'PGR',    rozwiniecie: 'Państwowe Gospodarstwo Rolne' },
    { skrot: 'PIT',    rozwiniecie: 'Personal Income Tax' }, // podchwytliwe – skrót z angielskiego!
    // --- trudne (dla mistrzów) ---
    { skrot: 'REGON',  rozwiniecie: 'Rejestr Gospodarki Narodowej' },
    { skrot: 'PEWEX',  rozwiniecie: 'Przedsiębiorstwo Eksportu Wewnętrznego' },
    { skrot: 'CPN',    rozwiniecie: 'Centrala Produktów Naftowych' },
    { skrot: 'ZOMO',   rozwiniecie: 'Zmotoryzowane Odwody Milicji Obywatelskiej' },
    { skrot: 'FSM',    rozwiniecie: 'Fabryka Samochodów Małolitrażowych' },
    { skrot: 'SGGW',   rozwiniecie: 'Szkoła Główna Gospodarstwa Wiejskiego' },
    { skrot: 'UOKiK',  rozwiniecie: 'Urząd Ochrony Konkurencji i Konsumentów' },
    { skrot: 'GDDKiA', rozwiniecie: 'Generalna Dyrekcja Dróg Krajowych i Autostrad' },
    { skrot: 'IMGW',   rozwiniecie: 'Instytut Meteorologii i Gospodarki Wodnej' },
    { skrot: 'GROM',   rozwiniecie: 'Grupa Reagowania Operacyjno-Manewrowego' },
  ],

  // Przysłowia – koło fortuny. 2 rundy = 2 przysłowia (pierwsze dwa), reszta to zapas.
  // Zgaduje się spółgłoski oraz Ą, Ę, Ó (A, E, I, O, U, Y odsłaniają się dopiero z całym hasłem).
  // TODO Karol i tata: podmienić na wybrane przysłowia (dla zmyłki najlepiej bez Ą, Ę, Ó).
  przyslowia: [
    'Co nagle, to po diable', 
    'Nie ma dymu bez ognia.',
    'Raz kozie śmierć.',
    'Darowanemu koniowi w zęby się nie zagląda.',

    // 'Gdzie kucharek sześć, tam nie ma co jeść',   // runda 1
    // 'Bez pracy nie ma kołaczy',                   // runda 2
    // 'Co nagle, to po diable',                     // zapas
    // 'Kto pod kim dołki kopie, ten sam w nie wpada', // zapas
  ],

  // Licytacja wersów piosenki: tytuł, wykonawca, maks. liczba wersów do wylicytowania.
  //   tekst – tekst piosenki widoczny TYLKO w panelu prowadzącego (jedna linijka = jeden wers,
  //           puste linie oddzielają zwrotki i nie są liczone). Wpisz go między znaki ` `.
  //   mp3   – (opcjonalnie) ścieżka do pliku, np. 'muzyka/sokoly.mp3'. Plik można też wgrać
  //           przyciskiem w panelu (zapamięta się w przeglądarce).
  //   Jeśli nie podasz maxWersow, limitem będzie liczba wersów w tekście.
  licytacja: [
    { tytul: 'Tyle słońca w całym mieście', autor: 'Anna Jantar', maxWersow: 8, mp3: '',
      tekst: `Dzień - wspomnienie lata
Dzień - słoneczne ćmy (a-a)
Nagle w tłumie w samym środku miasta
Ty, po prostu Ty

Dzień (dzień) - godzina zwierzeń (zwierzeń)
Dzień (dzień) - przy twarzy twarz (u-u)
Szuka pamięć poplątanych ścieżek
Lecz (lecz), czy znajdzie nas?

Tyle słońca w całym mieście
Nie widziałeś tego jeszcze
Popatrz, o popatrz!

Szerokimi ulicami
Niosą szczęście zakochani
Popatrz, o popatrz!

Wiatr porywa ich spojrzenia
Biegnie światłem w smugę cienia
Popatrz, o popatrz!

Łączy serca, wiąże dłonie
Może nam zawróci w głowie też!

La-la-la-la-la-la-la
La-la-la-la-la-la-la
La-la-la-la-la-la-la
La-la-la-la-la-la-la

Dzień (dzień) - powrotna podróż (podróż)
Dzień - podanie rąk (u-u)
Ale niebo całe jeszcze w ogniu
Chcę, zatrzymać wzrok

Tyle słońca w całym mieście
Nie widziałeś tego jeszcze
Popatrz, o popatrz!

Szerokimi ulicami
Niosą szczęście zakochani
Popatrz, o popatrz!

Wiatr porywa ich spojrzenia
Biegnie światłem w smugę cienia
Popatrz, o popatrz!

Łączy serca, wiąże dłonie
Może nam zawróci w głowie też!

Dzień (dzień) - wspomnienie lata (lata)
Dzień (dzień) - wspomnienie lata (lata)
Dzień (dzień) - wspomnienie lata (lata)
Dzień (dzień) - wspomnienie lata (lata)
` },
    { tytul: 'Zacznij od Bacha', autor: 'Zbigniew Wodecki', maxWersow: 8, mp3: '',
      tekst: `Gdy musisz wstać,
choć tulisz tak pod głową obłoczek snu
i słów tyle znasz uczonych cicho przez noc,
a tu dzień wstaje już kolorowo — witaj!

Gdy musisz wstać,
bo słońce już zawiesza na szczytach wież
poranny swój szal i rusza, cień w długi marsz,
wokół drzew krząta się ptaków rzesza — witaj!

Zacznij od Bacha, nim słońce po dachach
zeskoczy, jak kot po nocy ćmej.
I zacznij od Bacha, gdy w progu się waha
ktoś, kto winien wejść, a może nie...

Gdy musisz wstać,
Choć tulisz tak pod głową obłoczek snu
i słów tyle znasz uczonych cicho przez noc,
a tu dzień wstaje już kolorowo — witaj!

Gdy musisz wstać,
bo słońce już zawiesza na szczytach wież
poranny swój szal i rusza, cień w długi marsz,
wokół drzew krząta się ptaków rzesza — witaj!

Zacznij od Bacha, nim słońce po dachach
zeskoczy, jak kot po nocy ćmej.
I zacznij od Bacha, gdy w progu się waha
ktoś, kto winien wejść, a może nie...

Tu du ru du...
tu ru du du daj pa ru ba du du du daj
tu ru du du daj pa ru ba du du ru du
du ru daj du ru du du ru du du — witaj!
` },
    { tytul: 'Ściernisko', autor: 'Golec uOrkiestra', maxWersow: 8, mp3: '',
      tekst: `Pole, pole, łyse pole, ale mam już plan
Pomalutku, bez pośpiechu, wszystko zrobię sam
Nad makietą się męczyłem ładnych parę lat
Ale za to zwiedzać cudo będzie cały świat

Tu na razie jest ściernisko
Ale będzie San Francisco
A tam, gdzie to kretowisko
Będzie stał mój bank

Tu na razie jest ściernisko
Ale będzie San Francisco
A tam, gdzie to kretowisko
Będzie stał mój bank

Do roboty mam smykałkę, krzepę mam, jak wół
Sam pociągnę wóz pustaków, choćby był bez kół
Już wyciąłem wszystkie krzaki, teraz zwożę żwir
Mam to w nosie, że sąsiedzi mówią o mnie "świr"

Tu na razie jest ściernisko
Ale będzie San Francisco
A tam, gdzie to kretowisko
Będzie stał mój bank

Tu na razie jest ściernisko
Ale będzie San Francisco
A tam, gdzie to kretowisko
Będzie stał mój bank

Ja nie jestem w ciemię bity, budowlankę znam
I samemu burmistrzowi wstęgę przeciąć dam

Tu na razie jest ściernisko
Ale będzie San Francisco
A tam, gdzie to kretowisko
Będzie stał mój bank

Tu na razie jest ściernisko
Ale będzie San Francisco
A tam, gdzie to kretowisko
Będzie stał mój bank

Tu na razie jest ściernisko
Ale będzie San Francisco
A tam, gdzie to kretowisko
Będzie stał mój bank

Tu na razie jest ściernisko
Ale będzie San Francisco
A tam, gdzie to kretowisko
Będzie stał mój bank
` },
    { tytul: 'Czerwone korale', autor: 'Brathanki', maxWersow: 8, mp3: '',
      tekst: `Czerwone korale, czerwone niczym wino
Korale z polnej jarzębiny
I łzy dziewczyny i wielkie łzy

Z miasta płaszcz i korale me
On pochwalił i rzekł
Że ze mną zatańczyć chce

Jego dżins i mej bluzki biel
Zwarły się w tangu wnet
We włosy miał wtarty żel

Potem mnie na wycieczkę wziął
I na wycieczce tej
Mą bieluśką bluzkę zdjął

Wszyscy mi zazdrościli tam
Gdy wróciłam i gdy
W pomiętej bluzeczce szłam

Czerwone korale, czerwone niczym wino
Korale z polnej jarzębiny
I łzy dziewczyny i wielkie łzy

Wczoraj też na tych tańcach był
A na włosach mu żel
Jak srebrzysty księżyc lśnił

Tyle, że z Kryśką cały czas
Tańczył, a w stronę mą
Nie spojrzał ni jeden raz

Z innym zatańczę gdy
Z tą Kryśką będziesz ty
A potem czemu nie
Niech inny bluzkę mnie

Naj naj naj naj naj naj
Naj naj naj naj na naj
Naj naj naj naj naj naj
Naj naj naj naj naj naj naj naj naj naj` },
  ],

  // Bomba – urodziny: pytania indywidualne (pytanie + odpowiedź widoczna tylko dla prowadzącego).
  bomba: [
    { pytanie: 'Jak nazywa się góralska zupa z kiszonej kapusty?', odpowiedz: 'Kwaśnica' },
    { pytanie: 'Szczecin leży nad morzem – prawda czy fałsz?', odpowiedz: 'Fałsz' },
    { pytanie: 'Jakie owoce znajdują się w tradycyjnej polskiej szarlotce?', odpowiedz: 'Jabłka' },
    { pytanie: 'Kto jest autorem wiersza „Lokomotywa”?', odpowiedz: 'Julian Tuwim' },
    { pytanie: 'Jaki jest tytuł oficjalnej piosenki Mistrzostw Europy w piłce nożnej rozgrywanych w Polsce i Ukrainie w 2012 roku?', odpowiedz: 'Ko-ko Euro spoko' },
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

  // Czółko: piosenki (tytuł + wykonawca). Liczba powinna być PARZYSTA – drużyny wybierają na zmianę,
  // więc przy nieparzystej jedna ma o piosenkę więcej. Nie powtarzaj tu piosenek z licytacji.
  // Kolejność numerków na ekranie jest losowana, więc nie trzeba tu mieszać.
  czolko: [
    { tytul: 'A gdy jest już ciemno',        autor: 'Feel' },
    { tytul: 'Szampan',                      autor: 'Sanah' },
    { tytul: 'Chodź, pomaluj mój świat',     autor: '2 plus 1' },
    { tytul: 'Pokolenie',                    autor: 'Kombi' },
    { tytul: 'Zawsze z Tobą chciałbym być',  autor: 'Ich Troje' },
    { tytul: 'Bieszczadzkie anioły',         autor: 'Stare Dobre Małżeństwo' },
    { tytul: 'Wsiąść do pociągu',            autor: 'Maryla Rodowicz' },
    { tytul: 'Mój jest ten kawałek podłogi', autor: 'Mr. Zoob' },
    { tytul: 'Nie ma fal',                   autor: 'Dawid Podsiadło' },
    { tytul: 'Weź nie pytaj',                autor: 'Paweł Domagała' },
    { tytul: 'Małgośka',                     autor: 'Maryla Rodowicz' },
    { tytul: 'Jolka, Jolka pamiętasz',       autor: 'Budka Suflera' },
    { tytul: 'Przeżyj to sam',               autor: 'Lombard' },
    { tytul: 'Dmuchawce, latawce, wiatr',    autor: 'Urszula' },
    { tytul: 'Autobiografia',                autor: 'Perfect' },
    { tytul: 'Kolorowe jarmarki',            autor: 'Maryla Rodowicz' },
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
