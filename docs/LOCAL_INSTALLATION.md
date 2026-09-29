# Instalacija QuoteFlow aplikacije na Android

## 1. Potreban softver

Koristi Node.js 24 LTS (projekat je proveren sa 24.11.1) i npm 11. Node 24 je potreban za testove sa ugrađenim node:sqlite. Instaliraj Node sa https://nodejs.org/ pa otvori novi PowerShell:

~~~powershell
node --version
npm --version
cd C:/Users/lonca/OneDrive/Desktop/Stefan/Personal/QuoteFlow
npm ci
npm run typecheck
npm test
~~~

npm i package-lock.json su izvor verzija. pnpm nije potreban; nemoj paralelno održavati drugi lockfile. Git je preporučen za istoriju izmena. Ako EAS zahteva Git repozitorijum, inicijalizuj ga i sačuvaj prvi commit pre builda. Datoteke sa ključevima su u .gitignore.

Aplikacija koristi Expo SDK 57 i React Native 0.86. EAS cloud build sa Windows računara ne zahteva lokalni Android SDK, JDK niti Android Studio. Za lokalno kompajliranje instaliraj Android Studio, SDK Platform/Build Tools koje generisani Gradle projekat traži, Android SDK Platform Tools i JDK 17. Podesi JAVA_HOME i ANDROID_HOME i dodaj platform-tools u PATH. Emulator zahteva Android Virtual Device i uključenu virtualizaciju.

## 2. Okruženje i nalog

Za lokalnu aplikaciju **nema obaveznih environment varijabli**, servera, baze na internetu niti registracije korisnika. Nikada ne unosi AI ključ u EXPO_PUBLIC_* promenljive: one se ugrađuju u aplikaciju.

Expo nalog je potreban za EAS cloud build/Update, ali nije potreban za lokalni web pregled ili lokalni native build. Napravi nalog na https://expo.dev/signup, pa:

~~~powershell
npx eas-cli@latest login
npx eas-cli@latest whoami
npx eas-cli@latest init
~~~

Poslednja komanda povezuje projekat sa tvojim Expo nalogom i dodaje pravi EAS projectId u app.json. Ne koristi izmišljeni ID. Sačuvaj taj ID za buduće buildove. EAS je servis za build/distribuciju, ne backend podataka aplikacije. Cloud build šalje izvorni kod Expo build servisu; SQLite podaci sa telefona se ne šalju.

## 3. Web pregled i Expo Go

~~~powershell
npm run web
~~~

Otvori adresu koju Expo ispiše. Browser koristi localStorage samo za pregled interfejsa i osnovnih tokova. AI ključevi, PIN i biometrija nisu dostupni u browseru. Za trajnu upotrebu koristi instalirani Android APK.

Za brzi test na telefonu:

~~~powershell
npm run start:go
~~~

Računar i telefon treba da budu na istoj Wi-Fi mreži. Koristi **Expo Go za SDK 57** na telefonu i skeniraj novi QR kod iz terminala. `start:go` eksplicitno bira Expo Go i čisti Metro cache. Dozvoli Node/Metro pristup privatnoj mreži kroz Windows Firewall.

Ako si ranije pokrenuo SDK 55: zaustavi stari Metro terminal sa Ctrl+C, pokreni `npm run start:go` iz ovog projekta i skeniraj NOVI QR. Nemoj otvarati staru sesiju iz liste nedavnih projekata. Ako se poruka o SDK 55 ponavlja, proveri da je terminal u QuoteFlow direktorijumu i pokreni `npx expo install --check`. Verzija Expo Go i projekta moraju biti iste; kompatibilne Android verzije su dostupne na https://expo.dev/go.

Za ovaj lokalni test ne treba da praviš APK preko EAS-a. APK iz tačke 5 je zaseban način instalacije, za rad bez računara.

Expo Go služi za razvoj i koristi svoj sandbox. Podaci u Expo Go ne prelaze automatski u QuoteFlow APK: prvo izvozi backup. Expo Go nije samostalna instalacija tvoje aplikacije i ne potvrđuje njene native dozvole, potpis, update ili sve SecureStore/biometrijske tokove. Za te provere koristi sopstveni build.

## 4. Development build

~~~powershell
npx eas-cli@latest build --platform android --profile development
~~~

Sačekaj build, preuzmi APK sa linka koji EAS prikaže, instaliraj ga na telefonu. Zatim:

~~~powershell
npm start -- --dev-client
~~~

Development build se povezuje na Metro tokom razvoja. **Za rad bez računara i bez Metro servera koristi preview ili production APK.**

Alternativa sa instaliranim Android SDK-om:

~~~powershell
npx expo run:android
~~~

Ovo generiše native projekat i development build. Debug potpis nije isti kao release potpis; ne koristi ga za zamenu svog produkcionog APK-a. Native direktorijumi se generišu i nisu deo ovog repozitorijuma.

## 5. Samostalni Android APK

Ako si došao direktno na ovu tačku i dobio zahtev za login: to je prijava na **Expo/EAS nalog u terminalu računara**, ne u QuoteFlow aplikaciji. Prvo napravi nalog na https://expo.dev/signup ako ga nemaš. Prijava u browseru ne prijavljuje automatski terminal.

U VS Code izaberi **Terminal → New Terminal**, ili otvori PowerShell, pa redom izvrši:

~~~powershell
cd C:/Users/lonca/OneDrive/Desktop/Stefan/Personal/QuoteFlow
npx eas-cli@latest login
npx eas-cli@latest whoami
npx eas-cli@latest init
~~~

U `login` unosiš email/username i lozinku svog Expo naloga, a po potrebi i 2FA kod. Ako CLI ponudi browser prijavu, završi je u otvorenom browseru. Lozinku unosi samo u taj login tok. `whoami` treba da prikaže tvoj Expo username. `init` prvi put povezuje projekat sa tvojim nalogom; izaberi svoj nalog i kreiranje projekta `quoteflow` ako još ne postoji. Ako je projekat već povezan, koristi postojeći projekat, ne pravi drugi. Ta komanda dodaje `extra.eas.projectId` u app.json.

Posle uspešne prijave i povezivanja pokreni preview APK build:

~~~powershell
npx eas-cli@latest build --platform android --profile preview
~~~

Na prvom buildu dozvoli EAS-u da generiše Android keystore, ili unesi postojeći ako već imaš instalaciju potpisanu njime. Sačuvaj keystore, lozinke i alias preko `npx eas-cli@latest credentials --platform android`; vidi APP_UPDATES.md.

Za release build bez objavljivanja na Google Play:

~~~powershell
npx eas-cli@latest build --platform android --profile production
~~~

Oba profila imaju android.buildType = apk. Ne pokreći eas submit; objava na Play nije potrebna. APK sadrži JS bundle i radi bez Metro servera. Internet je potreban samo za dobrovoljne AI zahteve i eventualno konfigurisana OTA ažuriranja.

### Instalacija na telefon

Na pitanje **Install and run the Android build on an emulator?** izaberi **No** ako želiš instalaciju na svoj telefon. Emulator je virtuelni Android na računaru i zahteva zasebno podešen Android SDK.

Ako si izabrao Yes i dobio `spawn adb ENOENT`, nije uspela lokalna instalacija na emulator: terminal ne nalazi Android Debug Bridge (`adb`). Poruka `Successfully downloaded app` znači da je build artefakt već dostupan; ne pokreći novi build samo zbog ove greške.

Otvori build link koji je EAS ispisao u terminalu, ili na https://expo.dev otvori svoj projekat **quoteflow → Builds → završeni Android build**. Otvori njegov install/download link na telefonu i preuzmi APK. Za ovaj način instalacije nisu potrebni adb, Android Studio niti USB debugging. Ako si napravio preview APK, pokrećeš ga kao zasebnu QuoteFlow aplikaciju, bez Expo Go i Metro servera.

1. Preuzmi APK sa svog EAS build linka, ili ga prenesi USB kablom.
2. Na telefonu otvori APK iz Downloads.
3. Ako Android traži, uključi **Install unknown apps / Allow from this source** samo za browser/file manager kojim otvaraš APK.
4. Potvrdi instalaciju i pokreni QuoteFlow.
5. Nakon instalacije možeš isključiti tu dozvolu.

USB alternativa, sa uključenim Developer options → USB debugging i potvrđenim računarom:

~~~powershell
adb devices
adb install -r ./quoteflow.apk
~~~

Tačna putanja zavisi od mesta gde si preuzeo APK. `-r` instalira preko postojeće aplikacije uz isti ID i potpis. Ne deinstaliraj staru aplikaciju da bi rešio grešku potpisa.

### Dozvole

Aplikacija koristi privatni app storage, Android document/image picker, share sheet i opcionu biometriju. Kamera i mikrofon su blokirani u app.json. Ne traži kontakte, lokaciju niti pristup svim fajlovima. Android može prikazati izbor fotografija ili fajlova kada ih biraš. Dozvola za instalaciju nepoznatih APK-ova pripada installer aplikaciji, ne QuoteFlow-u.

## 6. AI ključ

Na telefonu: **More → Writing assistant & CV import**. Unesi svoj OpenAI API ključ i model dostupan tvom nalogu (podrazumevano gpt-4.1-mini), pa **Save connection**. Ključ i naziv modela čuvaju se u Expo SecureStore, ne u SQLite bazi ili backupu.

Svaki zahtev prvo prikazuje potvrdu šta šalje. CV PDF ograničen je na 10 MB. Predlozi su pregledni i izmenjivi; označi polja za uvoz i potvrdi primenu. Cene se nikada ne menjaju kroz AI.

Direktni provider ključevi namenjeni su **isključivo privatnoj/lokalnoj upotrebi**. Pre javne distribucije obavezno zameni pozive server-side AI servisom. Anthropic/Gemini adapteri nisu implementirani u ovoj verziji.

## 7. Podaci, restart, deinstalacija

Android čuva quoteflow.db u privatnom Expo SQLite direktorijumu aplikacije (unutar /data/user/0/com.stefan.quoteflow/). Slike i lokalne backup/recovery datoteke su u FileSystem.documentDirectory. SQLite WAL/migracije čuvaju podatke između restartovanja; zatvaranje aplikacije ne briše bazu.

**Deinstalacija ili Clear storage brišu bazu, slike i lokalne kopije.** OS automatski backup je isključen da se ne oslanjamo na neprovereni cloud povrat. SecureStore podaci se ne prenose kroz naš backup.

Pre deinstalacije: Settings → Data & Backup → Create & export backup. Sačuvaj JSON van privatnog storage-a aplikacije, npr. u Downloads i na računar. Proveri naziv/veličinu i da fajl postoji.

Na novom telefonu instaliraj APK, otvori Settings → Data & Backup → Import backup, izaberi JSON, pročitaj validaciju i potvrdi zamenu. Slike se vraćaju sa novim lokalnim putanjama. Ponovo unesi AI ključ i uključi PIN/biometriju.

## Reference

- [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/)
- [APK build](https://docs.expo.dev/build-reference/apk/)
- [Development builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [Expo SQLite](https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/)
- [Expo Go SDK mismatch](https://docs.expo.dev/troubleshooting/expo-go-version-mismatch/)
- [EAS login i prvi build](https://docs.expo.dev/build/setup/)
- [OpenAI file input](https://developers.openai.com/api/docs/guides/file-inputs)

