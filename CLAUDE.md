# Prompt

Napravi mi full-stack web aplikaciju za rezervaciju sportskih terena, inspirisanu platformom Playtomic. Koristim **Next.js 14+ (App Router)** i **Supabase** (Auth, Database, Storage). Aplikacija nema online plaćanje — plaćanje se vrši na licu mesta u klubu. Dizajn treba da bude moderan, minimalan i responsivan (mobile-first), koristeći **Tailwind CSS** i **shadcn/ui** komponente.

Platforma ima tri nivoa korisnika:
1. **Admin** (ja) — kreiram klubove, podešavam terene i cene, dodeljujem vlasnike, imam potpunu kontrolu nad svim klubovima
2. **Vlasnik kluba** — upravlja svakodnevnim operacijama svog kluba (rezervacije, blokiranje termina, statistika), ali ne može menjati strukturne podatke kluba (terene, cene, radno vreme)
3. **Igrač** — pretražuje klubove, gleda dostupnost i rezerviše termine

---

## BAZA PODATAKA — Supabase PostgreSQL

Kreiraj kompletne SQL migracije sa sledećim tabelama i relacijama:

### Tabela `profiles`
Proširenje Supabase auth.users tabele. Polja: `id` (UUID, FK na auth.users), `full_name` (text, not null), `phone` (text), `avatar_url` (text), `role` (enum: 'player', 'club_owner', 'admin', default 'player'), `created_at`, `updated_at`. Napravi trigger koji automatski kreira profil sa role='player' kada se novi korisnik registruje. Role se menja ISKLJUČIVO kroz admin panel ili direktno u bazi — korisnik ne može sam da promeni svoju ulogu.

### Tabela `clubs`
Predstavlja sportski klub/objekat. Polja: `id` (UUID, PK), `owner_id` (UUID, FK na profiles.id, nullable — klub može postojati bez dodeljenog vlasnika, admin ga sam vodi), `name` (text, not null), `slug` (text, unique, not null — automatski generisan iz imena), `description` (text), `phone` (text), `email` (text), `website` (text), `address_street` (text, not null), `address_city` (text, not null), `address_postal_code` (text), `address_country` (text, default 'Serbia'), `latitude` (decimal), `longitude` (decimal), `is_published` (boolean, default false — klub je vidljiv tek kada admin objavi), `created_at`, `updated_at`. Samo admin može kreirati, menjati strukturne podatke i objavljivati klubove.

### Tabela `club_images`
Slike kluba. Polja: `id` (UUID, PK), `club_id` (UUID, FK na clubs.id, ON DELETE CASCADE), `image_url` (text, not null), `position` (integer, default 0 — za sortiranje), `created_at`.

### Tabela `club_amenities`
Pogodnosti kluba. Polja: `id` (UUID, PK), `club_id` (UUID, FK na clubs.id, ON DELETE CASCADE), `amenity` (enum: 'parking', 'free_parking', 'changing_room', 'showers', 'lockers', 'wifi', 'cafeteria', 'restaurant', 'equipment_rental', 'store', 'disabled_access', 'lighting', 'covered', 'air_conditioning', 'heating'). Unique constraint na (club_id, amenity).

### Tabela `working_hours`
Radno vreme kluba po danu. Polja: `id` (UUID, PK), `club_id` (UUID, FK na clubs.id, ON DELETE CASCADE), `day_of_week` (integer, 0=ponedeljak, 6=nedelja), `open_time` (time, not null), `close_time` (time, not null), `is_closed` (boolean, default false). Unique constraint na (club_id, day_of_week).

### Tabela `courts`
Tereni unutar kluba. Polja: `id` (UUID, PK), `club_id` (UUID, FK na clubs.id, ON DELETE CASCADE), `name` (text, not null, npr. "Teren 1", "Mali teren"), `sport_type` (enum: 'football', 'basketball', 'tennis', 'padel', 'volleyball', 'handball', 'futsal', 'other'), `surface_type` (enum: 'grass', 'artificial_grass', 'concrete', 'parquet', 'clay', 'rubber', 'sand', 'other', nullable), `is_indoor` (boolean, default false), `max_players` (integer, nullable — npr. 10 za fudbal, 4 za padel), `price_per_hour` (decimal, not null — osnovna cena), `is_active` (boolean, default true), `created_at`, `updated_at`. Samo admin može dodavati/menjati terene.

### Tabela `court_pricing_rules`
Različite cene u zavisnosti od doba dana i dana u nedelji. Polja: `id` (UUID, PK), `court_id` (UUID, FK na courts.id, ON DELETE CASCADE), `day_of_week` (integer, nullable — null znači svi dani), `start_time` (time, not null), `end_time` (time, not null), `price_per_hour` (decimal, not null). Ova pravila override-uju osnovnu cenu terena. Npr. od 18:00-22:00 radnim danima je skuplje. Samo admin može menjati cene.

### Tabela `bookings`
Rezervacije. Polja: `id` (UUID, PK), `court_id` (UUID, FK na courts.id), `user_id` (UUID, FK na profiles.id, nullable — nullable jer vlasnik kluba može ručno kreirati rezervaciju za neregistrovanog igrača), `club_id` (UUID, FK na clubs.id — denormalizovano za lakše upite), `date` (date, not null), `start_time` (time, not null), `end_time` (time, not null), `duration_minutes` (integer, not null), `total_price` (decimal, not null), `status` (enum: 'confirmed', 'cancelled', 'completed', 'no_show', default 'confirmed'), `payment_status` (enum: 'pending', 'paid', default 'pending' — plaća se na licu mesta), `booked_by` (enum: 'player', 'club_owner', 'admin', not null — ko je kreirao rezervaciju), `guest_name` (text, nullable — ime gosta ako vlasnik ručno kreira rezervaciju za neregistrovanog igrača), `guest_phone` (text, nullable), `notes` (text, nullable), `cancelled_at` (timestamptz, nullable), `created_at`, `updated_at`. Dodaj constraint da ne može biti preklapanja rezervacija: za isti court_id i date, vremenski opsezi se ne smeju preklapati.

### Tabela `blocked_slots`
Blokirani termini — vlasnik ili admin može blokirati termin bez kreiranja prave rezervacije (npr. održavanje, privatni trening). Polja: `id` (UUID, PK), `court_id` (UUID, FK na courts.id, ON DELETE CASCADE), `date` (date, not null), `start_time` (time, not null), `end_time` (time, not null), `reason` (text, nullable), `created_by` (UUID, FK na profiles.id), `created_at`.

### Tabela `favorite_clubs`
Omiljeni klubovi korisnika. Polja: `id` (UUID, PK), `user_id` (UUID, FK na profiles.id), `club_id` (UUID, FK na clubs.id), `created_at`. Unique constraint na (user_id, club_id).

### Row Level Security (RLS)
Uključi RLS na svim tabelama. Pravila:
- `profiles`: korisnik može čitati sve profile, ali menjati samo svoj. Admin može menjati sve profile (uključujući role).
- `clubs`: svi mogu čitati objavljene klubove (is_published = true). Admin može CRUD sve klubove. Vlasnik kluba može čitati samo svoj klub ali NE može menjati strukturne podatke.
- `courts`: svi mogu čitati terene objavljenih klubova. Samo admin može CRUD terene.
- `court_pricing_rules`: svi mogu čitati. Samo admin može CRUD.
- `working_hours`: svi mogu čitati. Samo admin može CRUD.
- `bookings`: igrač vidi samo svoje rezervacije. Vlasnik kluba vidi sve rezervacije za svoje klubove i može menjati status (payment_status, status). Vlasnik kluba može kreirati rezervacije za svoj klub. Admin vidi i može sve.
- `blocked_slots`: svi mogu čitati (da vide da je termin blokiran). Vlasnik kluba može CRUD za svoje klubove. Admin može CRUD za sve.
- `club_amenities`, `club_images`: svi čitaju, samo admin menja.
- `favorite_clubs`: korisnik CRUD samo svoje favorite.

### Database funkcije
Kreiraj Supabase database funkciju `get_available_slots(p_court_id UUID, p_date DATE)` koja vraća slobodne slotove za dati teren i datum. Funkcija treba da:
1. Proveri radno vreme kluba za taj dan u nedelji
2. Generiše slotove u intervalima od 30 minuta unutar radnog vremena
3. Za svaki slot izračuna cenu koristeći `court_pricing_rules` (ako postoji pravilo za to vreme i dan), ili fallback na `courts.price_per_hour`
4. Izbaci slotove koji se preklapaju sa postojećim aktivnim rezervacijama (status != 'cancelled')
5. Izbaci slotove koji se preklapaju sa blokiranih terminima iz `blocked_slots`
6. Vrati: `start_time`, `end_time`, `duration_minutes` (fiksno 60 min za početak, ali omogući i 90 i 120 min slotove ako su uzastopni slotovi slobodni), `price`

Kreiraj i funkciju `get_club_availability(p_club_id UUID, p_date DATE, p_sport_type TEXT DEFAULT NULL)` koja poziva gornju funkciju za sve aktivne terene tog kluba (opcionalno filtrirane po sportu) i vraća grupisane rezultate.

---

## SUPABASE STORAGE

Kreiraj bucket `club-images` (public) za slike klubova. Postavi storage policy da samo admin može upload-ovati i brisati slike, ali svi mogu čitati.

---

## AUTENTIFIKACIJA

Koristi Supabase Auth sa email/password registracijom i prijavom. Registracija je SAMO za igrače — nema izbora uloge, svi novi korisnici su automatski igrači. Napravi middleware koji:
- Štiti `/dashboard/**` rute — pristup samo za korisnike sa role 'club_owner' ili 'admin'
- Štiti `/admin/**` rute — pristup ISKLJUČIVO za korisnike sa role 'admin'
- Štiti `/bookings` i `/favorites` rute — pristup za sve ulogovane korisnike

---

## STRANICE I RUTE

### Javna strana (za igrače):

**`/` — Početna stranica**
Hero sekcija sa naslovom "Pronađi i rezerviši sportski teren" i search barom (pretraga po gradu ili imenu kluba). Ispod: sekcija "Popularni klubovi" — grid kartica sa slikom, imenom, adresom i "Rezerviši" dugmetom. Ispod toga: kratka sekcija "Kako funkcioniše" u 3 koraka (Pronađi → Rezerviši → Igraj).

**`/clubs` — Pretraga klubova**
Na vrhu: search bar i filteri (grad, sport, pogodnosti). Rezultati u grid-u kartica. Svaka kartica prikazuje: sliku kluba, naziv, adresu, listu sportova (badge-ovi), i "Rezerviši" link. Paginacija.

**`/clubs/[slug]` — Profil kluba**
Hero sa imenom kluba i adresom. Ispod hero-a: Booking widget — dropdown za izbor sporta (ako klub ima više sportova), date picker (strelice levo/desno za navigaciju po danima), i availability grid (tabela gde su redovi tereni a kolone časovi u danu, sa zelenom/sivom bojom za slobodno/zauzeto). Ispod grid-a: lista slotova grupisanih po terenu, svaki slot prikazuje vreme, trajanje, cenu i "Rezerviši" dugme. Desni sidebar (ili ispod na mobilnom): mapa sa lokacijom kluba (koristi leaflet sa OpenStreetMap), adresa, kontakt telefon, radno vreme po danima, i lista pogodnosti kao badge-ovi. Sekcija "O klubu" sa opisom. Galerija slika kluba.

**`/clubs/[slug]/book` — Stranica za potvrdu rezervacije**
Korisnik mora biti ulogovan (ako nije, redirect na login sa return URL-om). Prikazuje rezime: ime kluba, teren, datum, vreme, trajanje, cena. Polje za napomenu (opciono). Napomena da je plaćanje na licu mesta. Dugme "Potvrdi rezervaciju". Nakon potvrde: success stranica sa detaljima i opcijom da doda u Google Calendar.

**`/bookings` — Moje rezervacije (zaštićena ruta)**
Lista svih rezervacija korisnika, sortirano po datumu (buduće prvo). Svaka kartica prikazuje: ime kluba, teren, datum, vreme, status (badge u boji), cenu. Mogućnost otkazivanja budućih rezervacija (sa confirm dijalogom). Tabovi: "Predstojeće" i "Prošle".

**`/favorites` — Omiljeni klubovi (zaštićena ruta)**
Grid omiljenih klubova sa mogućnošću uklanjanja.

**`/auth/login` i `/auth/register` — Autentifikacija**
Login forma (email + password). Register forma (ime, email, telefon, password). NEMA izbora uloge — svi se registruju kao igrači. Linkovi između stranica. Redirect na prethodnu stranicu nakon login-a.

### Dashboard (za vlasnike klubova):

**`/dashboard` — Pregled**
Vlasnik vidi samo podatke za svoj klub (ili klubove ako ima više). Kartica sa statistikama: ukupno rezervacija danas, rezervacija ove nedelje, prihod ovog meseca (zbir total_price gde je payment_status='paid'), popunjenost terena (procenat). Lista današnjih rezervacija sa statusom.

**`/dashboard/bookings` — Rezervacije mog kluba**
Tabela svih rezervacija za klubove ovog vlasnika. Filteri: datum (od-do), teren, status. Kolone: datum, vreme, teren, igrač (ime i telefon), status, iznos, payment status. Akcije: označi kao plaćeno, označi kao no-show, otkaži. Mogućnost ručnog kreiranja rezervacije — vlasnik može zakazati termin za neregistrovanog igrača (unosi guest_name i guest_phone) ili blokirati termin (kreira blocked_slot sa razlogom).

**`/dashboard/schedule` — Kalendarski pregled**
Nedeljni pregled u vidu tabele (redovi = tereni, kolone = sati u danu) sa obojenim blokovima za rezervacije i blokirane termine (različite boje). Navigacija po nedeljama. Klik na prazan slot otvara formu za brzo kreiranje rezervacije ili blokiranje termina.

### Admin panel (samo za admina):

**`/admin` — Admin dashboard**
Pregled svih klubova na platformi. Statistike: ukupno klubova, ukupno terena, ukupno rezervacija, ukupno korisnika.

**`/admin/clubs` — Upravljanje klubovima**
Lista svih klubova sa statusom (objavljen/neobjavljen). Dugme za kreiranje novog kluba. Za svaki klub link na uređivanje.

**`/admin/clubs/new` — Kreiranje novog kluba**
Kompletna forma za kreiranje kluba: osnovni podaci (ime, opis, kontakt), adresa sa mogućnošću unosa koordinata, radno vreme za svaki dan (sa toggle-om za zatvoreno), pogodnosti (checkbox lista), upload slika (drag & drop, reorder, brisanje), dodela vlasnika (search po postojećim korisnicima, opciono — može ostati bez vlasnika). Dugme za objavljivanje/sakrivanje kluba.

**`/admin/clubs/[id]/edit` — Uređivanje kluba**
Ista forma kao kreiranje, sa svim postojećim podacima popunjenim. Dodatna sekcija: upravljanje terenima — lista svih terena sa mogućnošću dodavanja, uređivanja i deaktiviranja. Za svaki teren: forma sa imenom, tipom sporta, podlogom, da li je zatvoren, max igrača, osnovna cena po satu. Sekcija za cenovna pravila: tabela pravila sa mogućnošću dodavanja (dan u nedelji, od-do vreme, cena).

**`/admin/clubs/[id]/edit` — Promena vlasnika**
U okviru edit forme kluba, sekcija za dodelu/promenu vlasnika. Kada se dodeli vlasnik, tom korisniku se automatski menja role na 'club_owner'. Kada se ukloni vlasnik, proveriti da li taj korisnik ima još neki klub — ako ne, vratiti role na 'player'.

**`/admin/users` — Upravljanje korisnicima**
Tabela svih korisnika sa kolonama: ime, email, telefon, uloga, datum registracije, broj rezervacija. Mogućnost promene uloge korisnika. Filter po ulozi.

---

## KLJUČNA POSLOVNA LOGIKA

### Availability Engine
Ovo je srce aplikacije. Kada korisnik otvori stranicu kluba:
1. Frontend poziva Supabase RPC funkciju `get_club_availability(club_id, date, sport_type)`
2. Funkcija za svaki aktivan teren generiše slotove od 30 minuta unutar radnog vremena
3. Za svaki slot računa cenu na osnovu pricing rules
4. Filtrira slotove koji se preklapaju sa postojećim booking-ima
5. Filtrira slotove koji se preklapaju sa blokiranih terminima
6. Vraća strukturu: `{ court_id, court_name, slots: [{ start_time, end_time, duration, price }] }`

### Sprečavanje double-booking
Kada korisnik klikne "Rezerviši":
1. Proveri ponovo da li je slot slobodan (real-time provera)
2. Koristi Supabase transaction ili database-level constraint da atomično kreira booking
3. Ako je slot u međuvremenu zauzet, prikaži grešku i refreshuj dostupnost

### Cenovodstvo
Cena se određuje po sledećem prioritetu:
1. Ako postoji `court_pricing_rule` za taj dan u nedelji i to vreme → koristi tu cenu
2. Ako postoji `court_pricing_rule` sa `day_of_week = null` (važi za sve dane) za to vreme → koristi tu cenu
3. Fallback na `courts.price_per_hour`
Za rezervacije duže od 60 min, cena je zbir cena svakog 60-minutnog bloka.

### Otkazivanje
Korisnik može otkazati rezervaciju najkasnije 2 sata pre početka. Otkazivanje menja status u 'cancelled' i popunjava `cancelled_at`. Otkazani termin ponovo postaje dostupan.

### Dodela vlasnika kluba
Kada admin dodeli vlasnika klubu:
1. Postavi `clubs.owner_id` na izabranog korisnika
2. Promeni `profiles.role` tog korisnika na 'club_owner'
Kada admin ukloni vlasnika:
1. Postavi `clubs.owner_id` na null
2. Proveri da li korisnik ima još neki klub — ako nema, vrati `profiles.role` na 'player'

---

## KOMPONENTE (shadcn/ui + custom)Za UI koristi shadcn/ui kao bazu komponenti, sa Magic UI (magicui.design) za animirane i vizuelno impresivne komponente (hero sekcije, kartice, efekti). Koristi Framer Motion za sve animacije: page transitions, micro-interactions na hover i klik, smooth otvaranje/zatvaranje modala i drawera, staggered animacije listi (kartice se pojavljuju jedna za drugom), i skeleton loading stanja. Font: Geist (Sans + Mono). Ikone: Lucide React. Koristi modernu paletu boja sa jednom jakom accent bojom, dosta belог prostora, zaobljene uglove, i suptilne senke. Tamni režim (dark mode) treba biti podržan od starta sa toggle-om u header-u.

Napravi sledeće reusable komponente:

- `ClubCard` — kartica kluba za search rezultate (slika, ime, adresa, sportovi, CTA dugme)
- `AvailabilityGrid` — tabela dostupnosti (redovi=tereni, kolone=sati, klik za rezervaciju)
- `SlotPicker` — lista slotova za jedan teren sa vremenom, trajanjem, cenom i "Rezerviši" dugmetom
- `DateNavigator` — navigacija po datumima sa strelicama i prikazom dana (Pon, 7. Apr)
- `SportFilter` — dropdown/tab za filtriranje po sportu
- `AmenityBadge` — badge za pogodnost sa ikonom
- `BookingSummary` — rezime rezervacije pre potvrde
- `BookingCard` — kartica jedne rezervacije u listi "Moje rezervacije"
- `WorkingHoursEditor` — forma za uređivanje radnog vremena (7 redova, za svaki dan)
- `PricingRulesTable` — tabela za uređivanje cenovnih pravila sa CRUD operacijama
- `ImageUploader` — drag & drop upload sa preview-om i mogućnošću brisanja/reordera
- `DashboardStatCard` — kartica sa ikonom, brojem i labelom za dashboard statistike
- `WeeklySchedule` — kalendarski prikaz nedelje za dashboard i admin
- `QuickBookingForm` — forma za brzo kreiranje rezervacije ili blokiranje termina (za vlasnika/admina)
- `UserSearchSelect` — search i select korisnika za dodelu vlasnika kluba (za admin panel)

---

## TEHNIČKE NAPOMENE

- Koristi Next.js App Router sa Server Components gde je moguće, Client Components samo gde treba interaktivnost.
- Supabase klijent: koristi `createServerClient` za server komponente i `createBrowserClient` za klijentske.
- Tipovi: generiši TypeScript tipove iz Supabase šeme (`supabase gen types typescript`).
- Slike: koristi Next.js `<Image>` komponentu sa Supabase Storage URL-ovima.
- Forme: koristi `react-hook-form` sa `zod` validacijom.
- Stanje: koristi React Server Components + `searchParams` za filtere, ne treba globalni state management.
- Date handling: koristi `date-fns` biblioteku, lokalizovanu na srpski.
- Za mapu na profilu kluba koristi `react-leaflet` sa OpenStreetMap (besplatno, ne zahteva API ključ).
- Napravi `middleware.ts` koji proverava auth sesiju i štiti rute po ulogama: `/admin/**` samo za admin, `/dashboard/**` za club_owner i admin, `/bookings` i `/favorites` za sve ulogovane.
- Napravi kvalitetan seed fajl sa 3-4 primera klubova, terena i rezervacija za development, uključujući jednog admin korisnika.