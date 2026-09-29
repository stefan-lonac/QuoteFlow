# Backup i povrat podataka

## Napravi kopiju

1. Otvori **More → Settings → Data & Backup**.
2. Izaberi **Create & export backup**.
3. Android share sheet omogućava da sačuvaš/pošalješ fajl na izabrano mesto. Ako izabereš drugu aplikaciju, toj aplikaciji predaješ ceo backup.
4. Sačuvaj fajl i van telefona. Potvrdi da postoji pre deinstalacije.
5. **Last backup** beleži vreme stvaranja kopije, ne potvrdu da je share destinacija uspešno sačuvala fajl.

Format je **quoteflow-backup-v1-ISO_DATUM.json**, ne ZIP. Jedan prenosiv fajl sadrži:

- sve normalizovane SQLite podatke kao logički snapshot;
- profile, settings, klijente, projekte i veze tehnologija/usluga;
- procene, stavke, ponude i sekcije;
- portfolio, pakete održavanja, uplate i troškove;
- FileReference podatke i base64 sadržaj uvezenih lokalnih slika;
- verziju formata, vreme i SHA-256 checksum kompletnog payload-a.

Ovo je logički backup: ne kopira aktivan .db/WAL fajl. Export koristi konzistentan snapshot SQLite transakcije. Obnovljeni podaci ponovo ulaze u SQLite tabele.

API ključevi, PIN, biometrija i prolazni AI PDF dokumenti **nisu uključeni**. Generisani PDF-ovi mogu se ponovo napraviti iz ponuda. CV PDF se šalje samo po potvrdi, ne postaje trajni attachment.

Backup nije šifrovan. SHA-256 otkriva slučajno oštećenje; nije digitalni potpis i ne dokazuje poreklo fajla. Uvozi samo pouzdane kopije. Čuvaj ih privatno.

## Vrati kopiju

1. Ako trenutni podaci imaju vrednost, prvo ih izvezi na drugo mesto.
2. Izaberi **Import backup**, zatim JSON fajl.
3. Aplikacija proverava veličinu (do 100 MB), format/verziju, checksum, sve tabele, polja, ID-eve, relacije, konfiguraciju i priloge.
4. Nevalidan ili nepodržan fajl se odbija pre izmene podataka.
5. Pročitaj datum i potvrdi **Restore this workspace?**. Uvoz zamenjuje kompletan workspace; ne radi merge.
6. Pre zamene automatski nastaje lokalni **quoteflow-recovery.json**. Ako pravljenje recovery kopije ne uspe, restore se prekida.
7. Slike se upisuju pod novim lokalnim imenima, reference se premapiraju, a baza se zamenjuje u jednoj transakciji sa odloženom proverom FK.
8. Ako transakcija ne uspe, prethodna baza ostaje. Novonapisane slike se uklanjaju. Stare slike nisu automatski obrisane, da bi recovery kopija ostala upotrebljiva.
9. Proveri klijente, ponude, iznose i slike.

Ponovljeni restore prepisuje lokalnu recovery kopiju: eksportuj je ako želiš da je zadržiš. **Export pre-restore recovery copy** omogućava preuzimanje; potom je možeš uvesti standardnim Import backup tokom.

## Novi telefon / deinstalacija / izgubljen PIN

Instaliraj APK, prenesi backup, uvezi ga i ponovo konfiguriši SecureStore ključ i app lock. Uninstall/Clear storage uklanja sve privatne podatke i recovery kopiju; samo backup van aplikacije omogućava oporavak. Ako zaboraviš PIN, prvo pokušaj biometriju; bez pristupa aplikaciji možeš vratiti samo ranije izvezen backup nakon reinstalacije. Ne postoji udaljeni nalog ili reset PIN-a.

Browser preview ima sopstveni localStorage, odvojen od Android baze. JSON format omogućava prenos između njih. Browser storage ima znatno manju kvotu; velike slike mogu premašiti kvotu. Greška se prikazuje i postojeći snapshot ostaje.

## Održavanje

Backup pravi pre svake native/OTA nadogradnje, pre većeg uvoza i redovno tokom rada. Čuvaj više datiranih kopija. Pre oslanjanja na novi telefon praktično proveri uvoz jedne kopije. Prazan početni workspace i sample data nisu backup.

