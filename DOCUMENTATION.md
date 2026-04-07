# e-termini.com — Kompletna dokumentacija

> Platforma za rezervaciju sportskih terena inspirisana Playtomic-om.
> Next.js 16 + Supabase + shadcn/ui + Tailwind CSS 4

---

## Sadržaj

1. [Pregled sistema](#pregled-sistema)
2. [Korisničke uloge i pristup](#korisnicke-uloge-i-pristup)
3. [Baza podataka](#baza-podataka)
4. [Autentifikacija](#autentifikacija)
5. [Availability Engine — Kako radi dostupnost termina](#availability-engine)
6. [Booking Flow — Rezervacija termina](#booking-flow)
7. [Cenovna pravila](#cenovna-pravila)
8. [Otkazivanje rezervacije](#otkazivanje-rezervacije)
9. [Dashboard za vlasnike](#dashboard-za-vlasnike)
10. [Admin panel](#admin-panel)
11. [Dodela vlasnika kluba](#dodela-vlasnika-kluba)
12. [Stranice i rute](#stranice-i-rute)
13. [Edge Cases i poslovna pravila](#edge-cases)
14. [Tehnički stack](#tehnicki-stack)

---

## 1. Pregled sistema <a name="pregled-sistema"></a>

e-termini.com je web platforma za pronalaženje i rezervaciju sportskih terena u Srbiji. Platforma podržava 8 sportova (fudbal, košarka, tenis, padel, odbojka, rukomet, futsal i ostalo) i nudi tri nivoa korisničkih uloga.

**Ključne karakteristike:**
- Pretraga klubova po gradu i imenu
- Real-time dostupnost termina sa vizuelnim prikazom (slobodno/zauzeto/blokirano)
- Online rezervacija sa potvrdom — plaćanje na licu mesta u klubu
- Dashboard za vlasnike klubova sa statistikama i upravljanjem
- Admin panel za kompletnu kontrolu platforme
- Google OAuth + email/password autentifikacija

---

## 2. Korisničke uloge i pristup <a name="korisnicke-uloge-i-pristup"></a>

### Igrač (`player`)
- Podrazumevana uloga za sve registrovane korisnike
- Može: pretraživati klubove, gledati dostupnost, rezervisati termine, otkazivati svoje rezervacije, dodavati omiljene klubove
- Ne može: pristupiti dashboard-u ili admin panelu
- Pristup: `/`, `/clubs`, `/clubs/[slug]`, `/bookings`, `/favorites`

### Vlasnik kluba (`club_owner`)
- Dodeljuje ga admin kroz admin panel
- Može: **punu kontrolu nad svojim klubom** — menjati podatke kluba, terene, cene, radno vreme, pogodnosti, upravljati rezervacijama (plaćeno, završeno, nepojavljivanje, otkaži), ručno kreirati rezervacije za goste, blokirati termine
- Ne može: objaviti/sakriti klub (to može samo admin), pristupiti admin panelu, menjati podatke tuđih klubova
- Pristup: sve što igrač + `/dashboard`, `/dashboard/bookings`, `/dashboard/schedule`, `/dashboard/club`

### Admin (`admin`)
- Postoji samo jedan (ili više) — postavlja se ručno u bazi
- Može: SVE — kreirati/menjati/brisati klubove, terene, cene, radno vreme, dodeljivati vlasnike, menjati uloge korisnika
- Pristup: sve rute + `/admin`, `/admin/clubs`, `/admin/clubs/new`, `/admin/clubs/[id]/edit`, `/admin/users`

### Zaštita ruta (Middleware)
| Ruta | Ko može |
|------|---------|
| `/admin/**` | Samo admin |
| `/dashboard/**` | Admin + club_owner |
| `/bookings`, `/favorites` | Svi ulogovani |
| `/clubs/**`, `/` | Svi (i neulogovani) |

Neulogovani korisnici koji pokušaju da pristupe zaštićenim rutama se redirectuju na `/`.

---

## 3. Baza podataka <a name="baza-podataka"></a>

### Tabele

| Tabela | Opis | RLS |
|--------|------|-----|
| `profiles` | Proširenje auth.users — ime, telefon, avatar, uloga | Da |
| `clubs` | Klubovi — naziv, slug, adresa, koordinate, kontakt, is_published | Da |
| `courts` | Tereni unutar kluba — sport, podloga, cena, indoor/outdoor | Da |
| `bookings` | Rezervacije — datum, vreme, cena, status, payment_status | Da |
| `working_hours` | Radno vreme po danu (0=pon, 6=ned) | Da |
| `court_pricing_rules` | Cenovna pravila — override osnove cene po danu/vremenu | Da |
| `blocked_slots` | Blokirani termini (održavanje, privatno) | Da |
| `club_amenities` | Pogodnosti kluba (15 tipova) | Da |
| `club_images` | Slike kluba sa pozicijom za sortiranje | Da |
| `favorite_clubs` | Omiljeni klubovi korisnika | Da |

### Enum tipovi
- **user_role**: `player`, `club_owner`, `admin`
- **booking_status**: `confirmed`, `cancelled`, `completed`, `no_show`
- **payment_status**: `pending`, `paid`
- **booked_by_type**: `player`, `club_owner`, `admin`
- **sport_type**: `football`, `basketball`, `tennis`, `padel`, `volleyball`, `handball`, `futsal`, `other`
- **surface_type**: `grass`, `artificial_grass`, `concrete`, `parquet`, `clay`, `rubber`, `sand`, `other`
- **amenity_type**: `parking`, `free_parking`, `changing_room`, `showers`, `lockers`, `wifi`, `cafeteria`, `restaurant`, `equipment_rental`, `store`, `disabled_access`, `lighting`, `covered`, `air_conditioning`, `heating`

### Constraint za sprečavanje duplikata
Na `bookings` tabeli postoji `EXCLUDE USING gist` constraint koji sprečava preklapajuće rezervacije na istom terenu, za isti datum, sa aktivnim statusom (sve osim `cancelled`). Ovo je database-level zaštita — čak i ako dva korisnika kliknu u istom trenutku, samo jedna rezervacija će proći.

### Trigger za automatsko kreiranje profila
Kada se novi korisnik registruje u Supabase Auth, trigger `on_auth_user_created` automatski kreira profil sa `role='player'` i podacima iz registracije (full_name, phone).

### Database funkcije (RPC)

**`get_available_slots(court_id, date)`** — Vraća SVE slotove za teren na dati datum:
- Generiše 60-minutne slotove na svakih 30 minuta (rolling window) unutar radnog vremena
- Za svaki slot vraća `status`: `available`, `booked`, ili `blocked`
- Za svaki slot računa cenu prema cenovnim pravilima

**`get_club_availability(club_id, date, sport_type?)`** — Poziva gornju funkciju za sve aktivne terene kluba i vraća grupisane rezultate. Opcioni filter po tipu sporta.

---

## 4. Autentifikacija <a name="autentifikacija"></a>

### Auth Modal
Umesto posebnih login/register stranica, koristi se **modal dialog** koji se otvara klikom na "Prijava" dugme u header-u.

**Dva moda:**
1. **Prijava** — email + lozinka
2. **Registracija** — ime, email, telefon (opciono), lozinka

**Google OAuth:**
- Klik na "Nastavi sa Google" → Supabase OAuth flow → redirect na `/auth/callback` → razmena koda za sesiju → redirect nazad

**Registracija:**
- Svi novi korisnici dobijaju ulogu `player`
- NEMA izbora uloge pri registraciji — uloga se menja ISKLJUČIVO kroz admin panel
- Trigger automatski kreira profil u `profiles` tabeli

**Zaštita prilikom rezervacije:**
- Kada neulogovani korisnik klikne na slobodan termin → otvara se Auth Modal
- Nakon uspešne prijave → automatski se otvara potvrda rezervacije za izabrani slot

---

## 5. Availability Engine <a name="availability-engine"></a>

Ovo je srce aplikacije. Kada korisnik otvori profil kluba:

### Tok
1. Korisnik bira datum (strelice levo/desno) i opciono sport
2. Frontend poziva Supabase RPC `get_club_availability(club_id, date, sport_type)`
3. Funkcija za svaki aktivan teren:
   a. Čita radno vreme kluba za taj dan u nedelji
   b. Generiše slotove od 60 minuta, sa početkom na svakih 30 minuta
   c. Za svaki slot proverava da li se preklapa sa booking-om ili blokiranim terminom
   d. Za svaki slot računa cenu (vidi sekciju Cenovna pravila)
   e. Vraća status: `available`, `booked`, ili `blocked`
4. Frontend prikazuje SVE slotove vizuelno:
   - **Beli** (sa cenom) = slobodni, klikabilni
   - **Crveni** ("Zauzeto") = rezervisani, disabled
   - **Sivi** ("Blokirano") = blokirani, disabled
5. Legenda objašnjava boje

### Važno
- Prikazuju se SVI termini, ne samo slobodni — korisnik vidi kompletnu sliku dana
- Prošli datumi se ne mogu izabrati (dugme za nazad je disabled)
- Filtriranje po sportu radi client-side (tereni se filtriraju po sport_type)

---

## 6. Booking Flow — Rezervacija termina <a name="booking-flow"></a>

### Igrač rezerviše termin

1. **Klik na slobodan slot** → Provera da li je korisnik ulogovan
2. **Ako NIJE ulogovan** → Otvara se Auth Modal → nakon login-a automatski se otvara potvrda
3. **Ako JESTE ulogovan** → Otvara se Confirmation Dialog sa detaljima:
   - Ime kluba
   - Naziv terena
   - Datum i vreme
   - Trajanje
   - Cena
   - Napomena: "Plaćanje se vrši na licu mesta u klubu"
4. **Klik na "Potvrdi rezervaciju"**:
   a. Server action `createBooking()` se poziva
   b. **Double-check**: Ponovo se proverava da li je slot slobodan (zaštita od race condition-a)
   c. Proverava se da nema blokiranih termina
   d. Kreira se booking sa: `status='confirmed'`, `payment_status='pending'`, `booked_by='player'`
   e. Ako je u međuvremenu zauzeto → prikazuje se greška i dostupnost se osvežava
5. **Success screen**: Zelena checkmark animacija, detalji rezervacije, linkovi ka "Moje rezervacije" ili "Zatvori"

### Vlasnik/Admin ručno kreira rezervaciju

1. Dashboard → Rezervacije → "Nova rezervacija"
2. Bira: teren, datum, od-do vreme, cenu, ime i telefon gosta (opciono)
3. Kreira se booking sa: `user_id=NULL`, `guest_name`, `guest_phone`, `booked_by='club_owner'/'admin'`

### Trostruka zaštita od duplikata
1. **Frontend**: Zauzeti slotovi su disabled i ne mogu se kliknuti
2. **Server action**: Pre insert-a proverava da nema preklapajućih booking-a
3. **Database constraint**: `EXCLUDE USING gist` sprečava preklapanje na nivou baze

---

## 7. Cenovna pravila <a name="cenovna-pravila"></a>

Cena se određuje po sledećem prioritetu (od najvišeg ka najnižem):

### Prioritet 1: Pravilo za specifičan dan + vreme
Ako postoji `court_pricing_rule` gde:
- `day_of_week` = dan u nedelji (0=pon, 6=ned)
- `start_time` ≤ slot start
- `end_time` ≥ slot end
→ koristi tu cenu

### Prioritet 2: Pravilo za sve dane + vreme
Ako postoji pravilo sa `day_of_week = NULL` (važi za sve dane):
- `start_time` ≤ slot start
- `end_time` ≥ slot end
→ koristi tu cenu

### Prioritet 3: Osnovna cena terena
`courts.price_per_hour` — fallback cena

### Primer
| Teren | Osnovna cena | Pravilo |
|-------|-------------|---------|
| Fudbalski teren 1 | 6.000 RSD/h | Svi dani 18:00-22:00 → 8.000 RSD/h |
| Padel 1 | 5.000 RSD/h | Svi dani 18:00-22:00 → 6.500 RSD/h |

Rezultat: slot u 10:00 košta 6.000, slot u 19:00 košta 8.000.

---

## 8. Otkazivanje rezervacije <a name="otkazivanje-rezervacije"></a>

### Pravila
- Korisnik može otkazati **samo svoje** rezervacije
- Otkazivanje je moguće **najkasnije 2 sata pre početka termina**
- Već otkazana rezervacija se ne može ponovo otkazati

### Šta se dešava
1. Korisnik klikne "Otkaži" na `/bookings` stranici
2. Prikazuje se confirm dialog: "Da li ste sigurni?"
3. Server action `cancelBooking()`:
   - Proverava vlasništvo (`user_id = auth.uid()`)
   - Proverava status (nije već cancelled)
   - Računa koliko sati je do termina
   - Ako < 2 sata → greška: "Otkazivanje je moguće najkasnije 2 sata pre početka termina"
   - Ako OK → `status = 'cancelled'`, `cancelled_at = now()`
4. Otkazani termin ponovo postaje dostupan (availability engine filtrira po `status != 'cancelled'`)

### Otkazivanje od strane vlasnika/admina
Vlasnik i admin mogu otkazati BILO KOJU rezervaciju za svoj klub bez 2h ograničenja, kroz Dashboard → Rezervacije → dugme "Otkaži".

---

## 9. Dashboard za vlasnike <a name="dashboard-za-vlasnike"></a>

Pristup: `/dashboard` — dostupno za `club_owner` i `admin`.

### Pregled (`/dashboard`)
- **Statistike**: rezervacije danas, rezervacije ove nedelje, prihod meseca (zbir total_price gde payment_status='paid'), broj klubova
- **Današnje rezervacije**: lista sa imenom igrača, terenom, vremenom, statusom plaćanja

### Rezervacije (`/dashboard/bookings`)
- Lista svih rezervacija za klubove ovog vlasnika (admin vidi sve)
- **Akcije** za svaku potvrđenu rezervaciju:
  - ✅ Plaćeno / ⏳ Nije plaćeno — menja payment_status
  - ✅ Završeno — menja status u `completed`
  - 🚫 Nije došao — menja status u `no_show`
  - ❌ Otkaži — menja status u `cancelled`
- **Nova ručna rezervacija** — modal za kreiranje guest booking-a

### Nedeljni raspored (`/dashboard/schedule`)
- Grid prikaz: redovi = sati (8:00-22:00), kolone = dani u nedelji
- Za svaki teren poseban grid
- Boje: zeleno = slobodno, crveno = zauzeto, sivo = blokirano
- Navigacija po nedeljama
- Izbor kluba (ako vlasnik ima više, ili admin)

### Moj klub (`/dashboard/club`)
- **Kompletno uređivanje kluba**: naziv, opis, kontakt, adresa, koordinate
- **Radno vreme**: za svaki dan u nedelji (od-do, zatvoreno)
- **Pogodnosti**: multi-select (15 tipova)
- **Tereni**: dodavanje, uređivanje, deaktiviranje terena
- **Cenovna pravila**: za svaki teren posebno — dodavanje i brisanje pravila
- Vlasnik NE može da menja `is_published` status — to kontroliše samo admin

### Ko šta vidi
- **Admin**: vidi SVE klubove i njihove podatke
- **Club owner**: vidi SAMO svoje klubove (gde je `clubs.owner_id = user.id`) ali ima PUNU kontrolu nad njima

---

## 10. Admin panel <a name="admin-panel"></a>

Pristup: `/admin` — ISKLJUČIVO za korisnike sa `role='admin'`.

### Admin dashboard (`/admin`)
Globalne statistike: ukupno klubova, ukupno terena, ukupno rezervacija, ukupno korisnika.

### Upravljanje klubovima (`/admin/clubs`)
- Lista svih klubova sa statusom (Objavljen/Nacrt), gradom, brojem terena, imenom vlasnika
- Link na kreiranje novog kluba

### Kreiranje kluba (`/admin/clubs/new`)
Kompletna forma sa sekcijama:
1. **Osnovni podaci**: naziv, opis, telefon, email, veb sajt
2. **Adresa**: ulica, grad, poštanski broj, latitude, longitude
3. **Radno vreme**: za svaki dan u nedelji — otvoreno/zatvoreno + od-do vreme
4. **Pogodnosti**: multi-select za 15 tipova pogodnosti
5. **Objavljivanje**: toggle za is_published

Slug se automatski generiše iz imena sa transliteracijom srpskih karaktera (č→c, š→s, ž→z, đ→dj) i dodaje timestamp suffix za jedinstvenost.

### Uređivanje kluba (`/admin/clubs/[id]/edit`)
Ista forma kao kreiranje + tri dodatne sekcije:

**Sekcija: Vlasnik kluba**
- Prikaz trenutnog vlasnika sa mogućnošću uklanjanja
- Pretraga korisnika po imenu za dodelu novog vlasnika
- (Vidi sekciju "Dodela vlasnika kluba" za detalje)

**Sekcija: Tereni**
- Lista svih terena sa sport tipom, cenom, statusom (aktivan/neaktivan)
- Dodavanje novog terena: naziv, sport, podloga, cena/sat, max igrača, indoor/outdoor
- Uređivanje postojećih terena
- Za svaki teren: upravljanje cenovnim pravilima

**Sekcija: Cenovna pravila** (per teren)
- Lista postojećih pravila (dan, vreme, cena) sa brisanjem
- Forma za dodavanje novog pravila

### Upravljanje korisnicima (`/admin/users`)
- Lista svih korisnika sa imenom, telefonom, ulogom, datumom registracije
- Filter po ulozi (Svi/Igrači/Vlasnici/Admini)
- Dropdown za promenu uloge korisnika

---

## 11. Dodela vlasnika kluba <a name="dodela-vlasnika-kluba"></a>

Ovo je kritičan deo koji automatski upravlja ulogama korisnika.

### Kada admin dodeli vlasnika

1. Admin pretražuje korisnike po imenu u admin panelu
2. Klikne na korisnika za dodelu
3. Server action `assignOwner(clubId, userId)`:
   - Postavlja `clubs.owner_id = userId`
   - **Automatski menja ulogu**: `profiles.role = 'club_owner'`
4. Korisnik odmah dobija pristup dashboard-u

### Kada admin ukloni vlasnika

1. Admin klikne "X" pored imena vlasnika
2. Server action `assignOwner(clubId, null)`:
   - Postavlja `clubs.owner_id = NULL`
   - **Proverava da li korisnik ima još klubova**:
     - Ako DA → uloga ostaje `club_owner`
     - Ako NE → uloga se vraća na `player`
   - **Izuzetak**: Admin se NIKAD ne degradira — `.neq("role", "admin")` sprečava to

### Primer scenarija
1. Marko je `player`
2. Admin ga dodeli kao vlasnika Kluba A → Marko postaje `club_owner`
3. Admin ga dodeli i kao vlasnika Kluba B → ostaje `club_owner`
4. Admin ga ukloni sa Kluba A → ostaje `club_owner` (jer ima Klub B)
5. Admin ga ukloni sa Kluba B → postaje `player` (nema više klubova)

---

## 12. Stranice i rute <a name="stranice-i-rute"></a>

### Javne stranice

| Ruta | Opis |
|------|------|
| `/` | Početna — hero, popularni klubovi, kako funkcioniše |
| `/clubs` | Pretraga klubova sa search bar-om |
| `/clubs/[slug]` | Profil kluba — dostupnost, tereni, kontakt, radno vreme, pogodnosti |

### Zaštićene stranice (ulogovani)

| Ruta | Opis |
|------|------|
| `/bookings` | Moje rezervacije — predstojeće/prošle sa otkazivanjem |
| `/favorites` | Omiljeni klubovi |

### Dashboard (club_owner + admin)

| Ruta | Opis |
|------|------|
| `/dashboard` | Statistike + današnje rezervacije |
| `/dashboard/bookings` | Sve rezervacije sa akcijama + ručno kreiranje |
| `/dashboard/schedule` | Nedeljni kalendarski pregled |
| `/dashboard/club` | Uređivanje svog kluba (tereni, cene, radno vreme, pogodnosti) |

### Admin panel (samo admin)

| Ruta | Opis |
|------|------|
| `/admin` | Globalne statistike |
| `/admin/clubs` | Lista klubova |
| `/admin/clubs/new` | Kreiranje novog kluba |
| `/admin/clubs/[id]/edit` | Uređivanje kluba + tereni + vlasnik |
| `/admin/users` | Upravljanje korisnicima |

### API rute

| Ruta | Opis |
|------|------|
| `/auth/callback` | OAuth callback — razmena koda za sesiju |

---

## 13. Edge Cases i poslovna pravila <a name="edge-cases"></a>

### Rezervacije
- ✅ Trostruka zaštita od duplih rezervacija (UI + server action + DB constraint)
- ✅ Otkazivanje moguće najkasnije 2h pre termina (enforced server-side)
- ✅ Otkazani termini ponovo postaju dostupni
- ✅ Guest booking-i (bez user_id) za ručne rezervacije vlasnika
- ✅ Cena se računa na osnovu pricing rules, ne hardcodovana

### Korisničke uloge
- ✅ Registracija uvek kreira `player` — nema izbora uloge
- ✅ Automatska promena uloge pri dodeli/uklanjanju vlasništva
- ✅ Admin se nikad ne degradira pri uklanjanju sa kluba
- ✅ Middleware proverava uloge na svakom zahtevu

### Klubovi
- ✅ Neobjavljeni klubovi (`is_published=false`) nisu vidljivi igračima
- ✅ Slug se automatski generiše sa srpskom transliteracijom
- ✅ Klub može postojati bez vlasnika — admin ga vodi
- ✅ Brisanje radnog vremena i pogodnosti pri update-u (delete + insert strategija)

### Dostupnost
- ✅ Slotovi se prikazuju na svakih 30min (rolling window), trajanje 60min
- ✅ Prošli datumi nisu dostupni za navigaciju
- ✅ Blokirani termini su vidljivi ali ne-klikabilni
- ✅ Zauzeti termini su vizuelno drugačiji (crveni)

### Auth
- ✅ Stali auth cookie-ji ne blokiraju pristup login-u
- ✅ Google OAuth + email/password u istom modalu
- ✅ Redirect nazad na slot potvrdu nakon login-a pri booking flow-u

---

## 14. Tehnički stack <a name="tehnicki-stack"></a>

| Tehnologija | Verzija | Namena |
|-------------|---------|--------|
| Next.js | 16.2.2 | Framework (App Router, Server Components) |
| React | 19.2.4 | UI library |
| Supabase | 2.101.1 | Backend (Auth, Database, Storage) |
| @supabase/ssr | 0.10.0 | SSR auth handling |
| Tailwind CSS | 4.2.2 | Styling |
| shadcn/ui | base-nova | UI komponente |
| Framer Motion | 12.38.0 | Animacije |
| date-fns | 4.1.0 | Datumske operacije (srpski locale) |
| react-hook-form | 7.72.1 | Forme (instaliran) |
| zod | 4.3.6 | Validacija (instaliran) |
| Lucide React | 1.7.0 | Ikone |
| react-leaflet | 5.0.0 | Mape (instaliran, nije još implementiran) |
| TypeScript | 5.9.3 | Type safety |

### Arhitektura
- **Server Components**: Fetch podataka u page.tsx fajlovima
- **Client Components**: Interaktivnost (modali, forme, real-time queries)
- **Server Actions**: Mutacije (booking, admin CRUD, auth)
- **Supabase RPC**: Database funkcije za availability engine
- **Middleware**: Zaštita ruta po ulogama

### Supabase Storage
- Bucket `club-images` (public read, admin write)
- Još nije implementiran upload u UI-u

---

*Poslednje ažuriranje: 6. april 2026.*
