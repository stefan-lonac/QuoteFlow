# Ažuriranje lične instalacije

Pre svakog ažuriranja izvezi backup van aplikacije. Nemoj deinstalirati postojeći QuoteFlow. Identitet aplikacije je **com.stefan.quoteflow**, trenutna verzija 1.1.0, Android versionCode 2 (SDK 57). Prethodna SDK 55 verzija bila je 1.0.0 / versionCode 1. Ova nadogradnja zahteva novi native build; ne objavljuj je kao OTA za stari SDK 55 APK.

Podaci se čuvaju kada instaliraš ažuriranje preko postojeće aplikacije **sa istim application ID-em i istim potpisom**. Promena ID-a pravi drugu aplikaciju; promena signing ključa sprečava in-place update.

## A. Kompatibilna JavaScript-only izmena

EAS Update je opcionalan. expo-updates je instaliran, ali repozitorijum namerno nema tuđi projectId ili updates.url. Da ga prvi put uključiš:

~~~powershell
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest update:configure
~~~

Sačuvaj generisani projectId i updates.url u app.json. Politika runtimeVersion je **appVersion**. Zatim napravi i instaliraj NOVI APK: prvi put dodavanje update URL-a zahteva native build.

~~~powershell
npx eas-cli@latest build --platform android --profile preview
~~~

Za kompatibilnu JS/assets izmenu bez menjanja native modula ili runtime-a:

~~~powershell
npm run typecheck
npm test
npm run build
npx eas-cli@latest update --channel preview --platform android --message "UI and workflow improvements"
~~~

Za production instalaciju koristi `--channel production`. Build profili već biraju odgovarajući kanal. EAS će inicijalno povezati kanal/granu ili tražiti potvrdu izbora; objavi na kanal koji je ugrađen u tvoj APK.

Potrebni su internet, isti EAS projekat, kanal, platforma i runtimeVersion. expo-updates proverava update po svojoj launch politici; novi bundle se preuzima i primenjuje pri narednom pokretanju. Za proveru zatvori i ponovo otvori aplikaciju nakon preuzimanja. Offline se koristi ugrađeni/poslednji uspešan bundle.

Za ovu kompatibilnu OTA izmenu nemoj menjati app.json version: appVersion politika bi napravila novi runtime koji stari APK ne prihvata. Ne menjaj native zavisnosti, permissions, package, config plugine ili Expo SDK kroz OTA. Za njih pređi na scenario B.

SQLite migracije mogu biti deo JS izmena, ali moraju biti aditivne i kompatibilne. Stari bundle posle rollback-a možda ne razume novu šemu; zato ne objavljuj destruktivne migracije niti računaj da rollback koda automatski vraća bazu. Aplikacija odbija noviju šemu umesto da je obriše.

OTA ne zahteva poslovni backend; koristi Expo servis za distribuciju koda. Ako ga ne želiš, svaki update distribuiraj APK-om.

## B. Native izmena ili nova verzija aplikacije

1. Izvezi backup.
2. U app.json promeni expo.version, npr. 1.1.0 → 1.2.0.
3. Uvećaj expo.android.versionCode, npr. 2 → 3. Uvek mora rasti.
4. U package.json uskladi version za jasnoću i sačuvaj lockfile.
5. Zadrži package com.stefan.quoteflow i isti EAS projekat/keystore.
6. Proveri, izgradi i preuzmi APK:

~~~powershell
npm ci
npx expo install --check
npm run typecheck
npm test
npm run build:android:bundle
npx eas-cli@latest build --platform android --profile production
~~~

7. Na telefonu otvori novi APK i izaberi **Update**, ili:

~~~powershell
adb install -r ./quoteflow-1.2.0.apk
~~~

8. Proveri postojeće klijente, projekte, slike i backup. Baza se otvara i izvršavaju se samo nove numerisane migracije. SQLite se ne resetuje.

eas.json koristi **local** appVersionSource: versionCode održavaš u app.json; nema skrivenog udaljenog autoincrement-a. Android bundle export je provera kompilacije, a EAS build proizvodi APK.

### Ako instalacija ne prolazi

- INSTALL_FAILED_UPDATE_INCOMPATIBLE: najčešće drugi signing key. Pronađi originalni keystore; nemoj odmah deinstalirati.
- VERSION_DOWNGRADE: povećaj versionCode.
- Drugi package/applicationId: vrati originalni ID ako želiš update postojeće aplikacije.
- Debug APK i release APK mogu imati različite potpise čak i kada dele ID.

## Signing credentials

~~~powershell
npx eas-cli@latest credentials --platform android
~~~

Izaberi Android build profil i opciju za preuzimanje credentials/keystore-a. Interaktivni nazivi opcija mogu se razlikovati po EAS CLI verziji.

Sačuvaj šifrovanu kopiju **.jks/.keystore fajla, keystore password, key alias, key password, application ID i EAS project ID** u password manager/šifrovani backup. Napravi drugu offline kopiju. Ne šalji ih u Git, ne stavljaj u app.json ili SQLite backup. .gitignore isključuje uobičajene credential datoteke, ali proveri svaki novi naziv.

Za lokalni release build Gradle mora biti konfigurisan istim release keystore-om. `npx expo run:android --variant release` sam po sebi nije obećanje da koristi tvoj produkcioni ključ. Pre distribucije proveri potpis. Na Windows-u EAS cloud build je jednostavniji; EAS local build zahteva podržano macOS/Linux okruženje, WSL nije ekvivalent garantovanoj podršci.

## Reference

- [Runtime compatibility](https://docs.expo.dev/eas-update/runtime-versions/)
- [Deploy updates](https://docs.expo.dev/eas-update/deployment/)
- [App versions](https://docs.expo.dev/build-reference/app-versions/)
- [Android credentials](https://docs.expo.dev/app-signing/app-credentials/)

