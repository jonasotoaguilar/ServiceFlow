# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [3.1.0](https://github.com/jonasotoaguilar/warranty-system/compare/v3.0.2...v3.1.0) (2026-01-08)


### Features

* **warranties:** add entry date field and sku validation logic ([962a703](https://github.com/jonasotoaguilar/warranty-system/commit/962a703623442b99335a0a6ea56243545d9c2b0a))
* **warranties:** hide immutable fields in edit mode ([3726052](https://github.com/jonasotoaguilar/warranty-system/commit/3726052ffe1b4163167c68d9c9a137a6c37b6275))
* **warranties:** optimize entry date selection logic ([38eb753](https://github.com/jonasotoaguilar/warranty-system/commit/38eb7537b1a0562027356f758c979539e4091963))


### Bug Fixes

* add fallback for appwrite endpoint in next config and clean dockerfile ([3120baa](https://github.com/jonasotoaguilar/warranty-system/commit/3120baa90b69f6c88ce323081fe2f2e394e36573))
* **auth:** redirect to login after logout ([1a4421d](https://github.com/jonasotoaguilar/warranty-system/commit/1a4421d8c5c9bd5960679e74783f8bcfc06be546))
* **ci:** update docker tag generation to use semver ([23c4374](https://github.com/jonasotoaguilar/warranty-system/commit/23c437480192c9e2add161bf9f4c937646cdfe86))
* **dashboard:** use server action for logout ([6055e39](https://github.com/jonasotoaguilar/warranty-system/commit/6055e3962022a98d6062072d44c173547dd4860d))
* proxy.ts ([4e2552b](https://github.com/jonasotoaguilar/warranty-system/commit/4e2552ba671e69dd12549f972f36052c8a9af114))
* **ui:** adjust filter layout and fix undefined date error in warranty modal ([3b74f20](https://github.com/jonasotoaguilar/warranty-system/commit/3b74f2001181bfa079d69a8a1ecff19d587436c0))
* **ui:** enforce dark color scheme for date inputs and cleanup unused var ([b0383ae](https://github.com/jonasotoaguilar/warranty-system/commit/b0383ae54da5cd4a50084a5e58dccd7e965f3da5))
* **ui:** prevent empty container rendering in edit mode ([5f0babd](https://github.com/jonasotoaguilar/warranty-system/commit/5f0babdd5f4a2c601757f6f81bcb4ce6a7c4037b))
* v3.0.3 ([56ffa94](https://github.com/jonasotoaguilar/warranty-system/commit/56ffa94d1bf38c55f8b6d09378e0d99fcca91258))

### [3.0.3](https://github.com/jonasotoaguilar/warranty-system/compare/v3.0.2...v3.0.3) (2026-01-06)


### Bug Fixes

* proxy.ts ([4e2552b](https://github.com/jonasotoaguilar/warranty-system/commit/4e2552ba671e69dd12549f972f36052c8a9af114))

### [3.0.2](https://github.com/jonasotoaguilar/warranty-system/compare/v3.0.1...v3.0.2) (2026-01-06)

### [3.0.1](https://github.com/jonasotoaguilar/warranty-system/compare/v3.0.0...v3.0.1) (2026-01-06)

## 3.0.0 (2026-01-05)


### ⚠ BREAKING CHANGES

* **auth:** migrate to authentik

### Features

* **a11y:** replace role='group' with fieldset for status filters ([522d7e6](https://github.com/jonasotoaguilar/warranty-system/commit/522d7e6a13f449625d6a4d918772c6ee24711082))
* add character limits to warranty and location fields ([9eec88b](https://github.com/jonasotoaguilar/warranty-system/commit/9eec88b3f040dd38ac6ee7ba15936c64b3ba7f9f))
* add location filter to warranty dashboard ([33c0095](https://github.com/jonasotoaguilar/warranty-system/commit/33c00959eb6cd6b245d4f30dc179e675b35ee525))
* add table Location ([e035c63](https://github.com/jonasotoaguilar/warranty-system/commit/e035c635402586a58c802a8fad31a0b6a9cedc1f))
* **api:** implement storage and backend routes ([87e3cff](https://github.com/jonasotoaguilar/warranty-system/commit/87e3cffbface2790538d91acd9c6c328aa6ff967))
* **auth:** enhance register and login views with premium design and password validation ([ad05350](https://github.com/jonasotoaguilar/warranty-system/commit/ad0535083cd04baedd6b568f59bf19c72a993205))
* **auth:** Implement user authentication with Supabase ([1bc950e](https://github.com/jonasotoaguilar/warranty-system/commit/1bc950eb32c7d5aad24d40b73ff722adf6373e6f))
* **auth:** improve login ([8bffa74](https://github.com/jonasotoaguilar/warranty-system/commit/8bffa749abd7860dd2b7927e9285e51c102d8015))
* **auth:** improve login view with real-time validation, responsive design, and spanish error messages ([b0c071f](https://github.com/jonasotoaguilar/warranty-system/commit/b0c071f8a1546de8b1b344cf4a0a7d3870853b5a))
* **auth:** migrar autenticación y configuración base a Appwrite ([1e62d77](https://github.com/jonasotoaguilar/warranty-system/commit/1e62d77b7101a7e84022a4ccb28a2dc19e374860))
* **auth:** migrate to authentik ([323a0dd](https://github.com/jonasotoaguilar/warranty-system/commit/323a0ddab78858709c3f94f4d1e0b351c323130c))
* **dashboard:** hide inactive locations from search filter ([e0aa91f](https://github.com/jonasotoaguilar/warranty-system/commit/e0aa91f6a65d8cbae9defdc7e6a635bcd123440f))
* **data:** adaptar almacenamiento y scripts de esquema para Appwrite ([d0dcc01](https://github.com/jonasotoaguilar/warranty-system/commit/d0dcc0136841f466f4c2490ed60d379cd038b29b))
* **data:** Implement dockerfile ([4099f58](https://github.com/jonasotoaguilar/warranty-system/commit/4099f584b3c54d05a2bc76f11f105c3b33e8f9bd))
* **data:** migrate supabase ([32482f1](https://github.com/jonasotoaguilar/warranty-system/commit/32482f1d959d2557ef6288d3e7d9e98aee2ac268))
* **db:** migrate to sqlite ([e2b2935](https://github.com/jonasotoaguilar/warranty-system/commit/e2b2935424bae1c2e8905c3a07eb76b2ffaa39d0))
* enhance location management with active/inactive states and warranty history check ([00c6516](https://github.com/jonasotoaguilar/warranty-system/commit/00c6516a5eb45c7002aba1f56a9391febbc2735f))
* **logs:** implement location movement history with advanced filtering and pagination ([10605ca](https://github.com/jonasotoaguilar/warranty-system/commit/10605ca11445cf7894bdd6a0e32d20c620d26401))
* **logs:** improve date and location filters design ([fe689e7](https://github.com/jonasotoaguilar/warranty-system/commit/fe689e77863afb71c95269c9730a3008c4dcbe6c))
* **logs:** improve date and location filters design ([619bcac](https://github.com/jonasotoaguilar/warranty-system/commit/619bcac23a87ea18283f8b8c28d6a8e25d808672))
* **pagination:** implement pagination controls and storage logic ([4a6d84e](https://github.com/jonasotoaguilar/warranty-system/commit/4a6d84ef843b18960d8cb8d5b3f161077adf1816))
* **search:** add RUT search support with multiple formats ([d3a203d](https://github.com/jonasotoaguilar/warranty-system/commit/d3a203dec01631b7018fb2db5e74a17917b16efc))
* **ui:** add core ui components and theme styles ([ba01cd2](https://github.com/jonasotoaguilar/warranty-system/commit/ba01cd203e344b3b304a5cb33798adb1ddb0d56c))
* **ui:** add Textarea component and currency formatting utilities ([de2f73c](https://github.com/jonasotoaguilar/warranty-system/commit/de2f73cd7fb5d672639c0cc63c120336f93a8134))
* **ui:** enhance accessibility in management views ([894f549](https://github.com/jonasotoaguilar/warranty-system/commit/894f54960af8791ba9b551e4e94972e5eb30acc1))
* **ui:** implement custom ConfirmationDialog ([ee8b659](https://github.com/jonasotoaguilar/warranty-system/commit/ee8b65972304d807d9fb75ffd178fe9464e17c45))
* **ui:** implement movements registry ([990e03a](https://github.com/jonasotoaguilar/warranty-system/commit/990e03a81c4b3629ad38938345722381ad573ca5))
* **ui:** improve semantic html and a11y on dashboard ([d4a8699](https://github.com/jonasotoaguilar/warranty-system/commit/d4a86992f4a1599ab57883a5049394d1066f34c5))
* **warranties:** add full management dashboard with validation and rules ([5af0837](https://github.com/jonasotoaguilar/warranty-system/commit/5af08374ab1382df49773ffe13b1103f36cc82aa))


### Bug Fixes

* **auth:** proxy authentik ([ec9feed](https://github.com/jonasotoaguilar/warranty-system/commit/ec9feed68b9298ee99d018fd72e4a28f20ffd228))
* **build:** resolve prerender errors by adding Suspense ([12db511](https://github.com/jonasotoaguilar/warranty-system/commit/12db5117b36c6123b70773805cfdd9512ec4aea6))
* **core:** adapt implementation to Next.js 16 async APIs ([bd062de](https://github.com/jonasotoaguilar/warranty-system/commit/bd062dee430523ffeb28b93f2f5db7ab844de8d1))
* force absolute redirect for global logout ([f9be40a](https://github.com/jonasotoaguilar/warranty-system/commit/f9be40a41e83c00a222c03e3d9ff1e1587b39d74))
* implement server-side logout redirect ([12b7653](https://github.com/jonasotoaguilar/warranty-system/commit/12b7653c44270b4dee0235250945e6d66198bf51))
* improve logout redirect transparency and logging ([8dd6388](https://github.com/jonasotoaguilar/warranty-system/commit/8dd6388f142904f3b6234a851f39f486671c1d00))
* **layout:** add suppressHydrationWarning to html tag to fix hydration mismatch ([8e16b37](https://github.com/jonasotoaguilar/warranty-system/commit/8e16b374ea4c3d7de9a8dbfe85d0ab7050ebee83))
* **locations:** prevent deletion of locations with history and sync UI ([f1afe39](https://github.com/jonasotoaguilar/warranty-system/commit/f1afe39766acd2e7010b5d26e2aad2d7d09e6be1))
* **locations:** remove async from onConfirm to match expected void return ([d7f79ad](https://github.com/jonasotoaguilar/warranty-system/commit/d7f79ad5fb1714eb27ced077e16dbfb4b0c91efe))
* logout ([154632e](https://github.com/jonasotoaguilar/warranty-system/commit/154632e2a102a05f40deea43128dbf525eb163f1))
* **prisma:** solve type error in seed-dummy script ([a0cf447](https://github.com/jonasotoaguilar/warranty-system/commit/a0cf447e7a98e0aa396eb9f6206e7d194f390f33))
* remove delete button for completed warranties ([f8951fb](https://github.com/jonasotoaguilar/warranty-system/commit/f8951fb96bde465857d2a09a3c3f3d3f18976bf0))
* restore action buttons functionality and simplify deactivate button UI ([78be823](https://github.com/jonasotoaguilar/warranty-system/commit/78be823f8bdc4bcae49b36582330c354eecd6c02))
* rout.js logout ([8036f0d](https://github.com/jonasotoaguilar/warranty-system/commit/8036f0d958020a35e292484b8098991259e3da47))
* **search:** support all RUT formats by generating search variants ([eb74700](https://github.com/jonasotoaguilar/warranty-system/commit/eb74700db64a66657ee77a1c5abf29bcfabda73f))
* **ui:** enforce Chilean phone number format ([10eaf5e](https://github.com/jonasotoaguilar/warranty-system/commit/10eaf5e505b1593835ad0870ed75c7016f794dee))
* **ui:** make dialogs responsive with height limits and internal scrolling ([c994c83](https://github.com/jonasotoaguilar/warranty-system/commit/c994c8310e9a0f8b4b996b6588a6635fd58ca90f))
* **ui:** resolver error de hidratación y layout responsivo en historial ([7c12802](https://github.com/jonasotoaguilar/warranty-system/commit/7c1280233128fb4a55e2a8601c27ab6d61bae5ca))
* update logout url ([9616860](https://github.com/jonasotoaguilar/warranty-system/commit/9616860357a8059e1f1785f7a24638cf12d08de7))
* update logout url to standard authentik outpost path ([11b6e42](https://github.com/jonasotoaguilar/warranty-system/commit/11b6e42051a9108fc067fe78b12aed01dddf61f4))
* update page searchParams to async ([4013366](https://github.com/jonasotoaguilar/warranty-system/commit/4013366d8e59958e9ad37a64f57dd5b5976c821b))
* use authentik invalidation flow for reliable logout ([ab2a95b](https://github.com/jonasotoaguilar/warranty-system/commit/ab2a95b30e66f556d6cc8e12a8d737c5d429d2bc))
* use sign_out endpoint to avoid akprox 404 ([652db12](https://github.com/jonasotoaguilar/warranty-system/commit/652db127601094ddc20e7bb6c6dba3bb13c9ec86))
* **warranty-modal:** remove default locations and handle empty location state ([51c8fc9](https://github.com/jonasotoaguilar/warranty-system/commit/51c8fc983c235b6aa474acd17f756e80c09422ed))
* **warranty-modal:** use native browser validation for phone format ([4fccab3](https://github.com/jonasotoaguilar/warranty-system/commit/4fccab3355a314a55404c8b19288e94d3874c17e))
* **workflows:** secret ghcr ([b308699](https://github.com/jonasotoaguilar/warranty-system/commit/b3086991b346f3460677796a175049576a7fe5f9))

## 2.0.0 (2026-01-05)


### ⚠ BREAKING CHANGES

* **auth:** migrate to authentik

### Features

* **a11y:** replace role='group' with fieldset for status filters ([522d7e6](https://github.com/jonasotoaguilar/warranty-system/commit/522d7e6a13f449625d6a4d918772c6ee24711082))
* add character limits to warranty and location fields ([9eec88b](https://github.com/jonasotoaguilar/warranty-system/commit/9eec88b3f040dd38ac6ee7ba15936c64b3ba7f9f))
* add location filter to warranty dashboard ([33c0095](https://github.com/jonasotoaguilar/warranty-system/commit/33c00959eb6cd6b245d4f30dc179e675b35ee525))
* add table Location ([e035c63](https://github.com/jonasotoaguilar/warranty-system/commit/e035c635402586a58c802a8fad31a0b6a9cedc1f))
* **api:** implement storage and backend routes ([87e3cff](https://github.com/jonasotoaguilar/warranty-system/commit/87e3cffbface2790538d91acd9c6c328aa6ff967))
* **auth:** enhance register and login views with premium design and password validation ([ad05350](https://github.com/jonasotoaguilar/warranty-system/commit/ad0535083cd04baedd6b568f59bf19c72a993205))
* **auth:** Implement user authentication with Supabase ([1bc950e](https://github.com/jonasotoaguilar/warranty-system/commit/1bc950eb32c7d5aad24d40b73ff722adf6373e6f))
* **auth:** improve login ([8bffa74](https://github.com/jonasotoaguilar/warranty-system/commit/8bffa749abd7860dd2b7927e9285e51c102d8015))
* **auth:** improve login view with real-time validation, responsive design, and spanish error messages ([b0c071f](https://github.com/jonasotoaguilar/warranty-system/commit/b0c071f8a1546de8b1b344cf4a0a7d3870853b5a))
* **auth:** migrar autenticación y configuración base a Appwrite ([1e62d77](https://github.com/jonasotoaguilar/warranty-system/commit/1e62d77b7101a7e84022a4ccb28a2dc19e374860))
* **auth:** migrate to authentik ([323a0dd](https://github.com/jonasotoaguilar/warranty-system/commit/323a0ddab78858709c3f94f4d1e0b351c323130c))
* **dashboard:** hide inactive locations from search filter ([e0aa91f](https://github.com/jonasotoaguilar/warranty-system/commit/e0aa91f6a65d8cbae9defdc7e6a635bcd123440f))
* **data:** adaptar almacenamiento y scripts de esquema para Appwrite ([d0dcc01](https://github.com/jonasotoaguilar/warranty-system/commit/d0dcc0136841f466f4c2490ed60d379cd038b29b))
* **data:** Implement dockerfile ([4099f58](https://github.com/jonasotoaguilar/warranty-system/commit/4099f584b3c54d05a2bc76f11f105c3b33e8f9bd))
* **data:** migrate supabase ([32482f1](https://github.com/jonasotoaguilar/warranty-system/commit/32482f1d959d2557ef6288d3e7d9e98aee2ac268))
* **db:** migrate to sqlite ([e2b2935](https://github.com/jonasotoaguilar/warranty-system/commit/e2b2935424bae1c2e8905c3a07eb76b2ffaa39d0))
* enhance location management with active/inactive states and warranty history check ([00c6516](https://github.com/jonasotoaguilar/warranty-system/commit/00c6516a5eb45c7002aba1f56a9391febbc2735f))
* **logs:** implement location movement history with advanced filtering and pagination ([10605ca](https://github.com/jonasotoaguilar/warranty-system/commit/10605ca11445cf7894bdd6a0e32d20c620d26401))
* **logs:** improve date and location filters design ([fe689e7](https://github.com/jonasotoaguilar/warranty-system/commit/fe689e77863afb71c95269c9730a3008c4dcbe6c))
* **logs:** improve date and location filters design ([619bcac](https://github.com/jonasotoaguilar/warranty-system/commit/619bcac23a87ea18283f8b8c28d6a8e25d808672))
* **pagination:** implement pagination controls and storage logic ([4a6d84e](https://github.com/jonasotoaguilar/warranty-system/commit/4a6d84ef843b18960d8cb8d5b3f161077adf1816))
* **search:** add RUT search support with multiple formats ([d3a203d](https://github.com/jonasotoaguilar/warranty-system/commit/d3a203dec01631b7018fb2db5e74a17917b16efc))
* **ui:** add core ui components and theme styles ([ba01cd2](https://github.com/jonasotoaguilar/warranty-system/commit/ba01cd203e344b3b304a5cb33798adb1ddb0d56c))
* **ui:** add Textarea component and currency formatting utilities ([de2f73c](https://github.com/jonasotoaguilar/warranty-system/commit/de2f73cd7fb5d672639c0cc63c120336f93a8134))
* **ui:** enhance accessibility in management views ([894f549](https://github.com/jonasotoaguilar/warranty-system/commit/894f54960af8791ba9b551e4e94972e5eb30acc1))
* **ui:** implement custom ConfirmationDialog ([ee8b659](https://github.com/jonasotoaguilar/warranty-system/commit/ee8b65972304d807d9fb75ffd178fe9464e17c45))
* **ui:** implement movements registry ([990e03a](https://github.com/jonasotoaguilar/warranty-system/commit/990e03a81c4b3629ad38938345722381ad573ca5))
* **ui:** improve semantic html and a11y on dashboard ([d4a8699](https://github.com/jonasotoaguilar/warranty-system/commit/d4a86992f4a1599ab57883a5049394d1066f34c5))
* **warranties:** add full management dashboard with validation and rules ([5af0837](https://github.com/jonasotoaguilar/warranty-system/commit/5af08374ab1382df49773ffe13b1103f36cc82aa))


### Bug Fixes

* **auth:** proxy authentik ([ec9feed](https://github.com/jonasotoaguilar/warranty-system/commit/ec9feed68b9298ee99d018fd72e4a28f20ffd228))
* **build:** resolve prerender errors by adding Suspense ([12db511](https://github.com/jonasotoaguilar/warranty-system/commit/12db5117b36c6123b70773805cfdd9512ec4aea6))
* **core:** adapt implementation to Next.js 16 async APIs ([bd062de](https://github.com/jonasotoaguilar/warranty-system/commit/bd062dee430523ffeb28b93f2f5db7ab844de8d1))
* force absolute redirect for global logout ([f9be40a](https://github.com/jonasotoaguilar/warranty-system/commit/f9be40a41e83c00a222c03e3d9ff1e1587b39d74))
* implement server-side logout redirect ([12b7653](https://github.com/jonasotoaguilar/warranty-system/commit/12b7653c44270b4dee0235250945e6d66198bf51))
* improve logout redirect transparency and logging ([8dd6388](https://github.com/jonasotoaguilar/warranty-system/commit/8dd6388f142904f3b6234a851f39f486671c1d00))
* **layout:** add suppressHydrationWarning to html tag to fix hydration mismatch ([8e16b37](https://github.com/jonasotoaguilar/warranty-system/commit/8e16b374ea4c3d7de9a8dbfe85d0ab7050ebee83))
* **locations:** prevent deletion of locations with history and sync UI ([f1afe39](https://github.com/jonasotoaguilar/warranty-system/commit/f1afe39766acd2e7010b5d26e2aad2d7d09e6be1))
* **locations:** remove async from onConfirm to match expected void return ([d7f79ad](https://github.com/jonasotoaguilar/warranty-system/commit/d7f79ad5fb1714eb27ced077e16dbfb4b0c91efe))
* logout ([154632e](https://github.com/jonasotoaguilar/warranty-system/commit/154632e2a102a05f40deea43128dbf525eb163f1))
* **prisma:** solve type error in seed-dummy script ([a0cf447](https://github.com/jonasotoaguilar/warranty-system/commit/a0cf447e7a98e0aa396eb9f6206e7d194f390f33))
* remove delete button for completed warranties ([f8951fb](https://github.com/jonasotoaguilar/warranty-system/commit/f8951fb96bde465857d2a09a3c3f3d3f18976bf0))
* restore action buttons functionality and simplify deactivate button UI ([78be823](https://github.com/jonasotoaguilar/warranty-system/commit/78be823f8bdc4bcae49b36582330c354eecd6c02))
* rout.js logout ([8036f0d](https://github.com/jonasotoaguilar/warranty-system/commit/8036f0d958020a35e292484b8098991259e3da47))
* **search:** support all RUT formats by generating search variants ([eb74700](https://github.com/jonasotoaguilar/warranty-system/commit/eb74700db64a66657ee77a1c5abf29bcfabda73f))
* **ui:** enforce Chilean phone number format ([10eaf5e](https://github.com/jonasotoaguilar/warranty-system/commit/10eaf5e505b1593835ad0870ed75c7016f794dee))
* **ui:** make dialogs responsive with height limits and internal scrolling ([c994c83](https://github.com/jonasotoaguilar/warranty-system/commit/c994c8310e9a0f8b4b996b6588a6635fd58ca90f))
* **ui:** resolver error de hidratación y layout responsivo en historial ([7c12802](https://github.com/jonasotoaguilar/warranty-system/commit/7c1280233128fb4a55e2a8601c27ab6d61bae5ca))
* update logout url ([9616860](https://github.com/jonasotoaguilar/warranty-system/commit/9616860357a8059e1f1785f7a24638cf12d08de7))
* update logout url to standard authentik outpost path ([11b6e42](https://github.com/jonasotoaguilar/warranty-system/commit/11b6e42051a9108fc067fe78b12aed01dddf61f4))
* update page searchParams to async ([4013366](https://github.com/jonasotoaguilar/warranty-system/commit/4013366d8e59958e9ad37a64f57dd5b5976c821b))
* use authentik invalidation flow for reliable logout ([ab2a95b](https://github.com/jonasotoaguilar/warranty-system/commit/ab2a95b30e66f556d6cc8e12a8d737c5d429d2bc))
* use sign_out endpoint to avoid akprox 404 ([652db12](https://github.com/jonasotoaguilar/warranty-system/commit/652db127601094ddc20e7bb6c6dba3bb13c9ec86))
* **warranty-modal:** remove default locations and handle empty location state ([51c8fc9](https://github.com/jonasotoaguilar/warranty-system/commit/51c8fc983c235b6aa474acd17f756e80c09422ed))
* **warranty-modal:** use native browser validation for phone format ([4fccab3](https://github.com/jonasotoaguilar/warranty-system/commit/4fccab3355a314a55404c8b19288e94d3874c17e))
* **workflows:** secret ghcr ([b308699](https://github.com/jonasotoaguilar/warranty-system/commit/b3086991b346f3460677796a175049576a7fe5f9))

## 1.2.0 (2025-12-18)


### Features

* **api:** implement storage and backend routes ([87e3cff](https://github.com/jonasotoaguilar/warranty-system/commit/87e3cffbface2790538d91acd9c6c328aa6ff967))
* **auth:** Implement user authentication with Supabase ([1bc950e](https://github.com/jonasotoaguilar/warranty-system/commit/1bc950eb32c7d5aad24d40b73ff722adf6373e6f))
* **data:** Implement dockerfile ([4099f58](https://github.com/jonasotoaguilar/warranty-system/commit/4099f584b3c54d05a2bc76f11f105c3b33e8f9bd))
* **data:** migrate supabase ([32482f1](https://github.com/jonasotoaguilar/warranty-system/commit/32482f1d959d2557ef6288d3e7d9e98aee2ac268))
* **db:** migrate to sqlite ([e2b2935](https://github.com/jonasotoaguilar/warranty-system/commit/e2b2935424bae1c2e8905c3a07eb76b2ffaa39d0))
* **pagination:** implement pagination controls and storage logic ([4a6d84e](https://github.com/jonasotoaguilar/warranty-system/commit/4a6d84ef843b18960d8cb8d5b3f161077adf1816))
* **ui:** add core ui components and theme styles ([ba01cd2](https://github.com/jonasotoaguilar/warranty-system/commit/ba01cd203e344b3b304a5cb33798adb1ddb0d56c))
* **ui:** implement movements registry ([990e03a](https://github.com/jonasotoaguilar/warranty-system/commit/990e03a81c4b3629ad38938345722381ad573ca5))
* **warranties:** add full management dashboard with validation and rules ([5af0837](https://github.com/jonasotoaguilar/warranty-system/commit/5af08374ab1382df49773ffe13b1103f36cc82aa))


### Bug Fixes

* **core:** adapt implementation to Next.js 16 async APIs ([bd062de](https://github.com/jonasotoaguilar/warranty-system/commit/bd062dee430523ffeb28b93f2f5db7ab844de8d1))
* **ui:** enforce Chilean phone number format ([10eaf5e](https://github.com/jonasotoaguilar/warranty-system/commit/10eaf5e505b1593835ad0870ed75c7016f794dee))
* update page searchParams to async ([4013366](https://github.com/jonasotoaguilar/warranty-system/commit/4013366d8e59958e9ad37a64f57dd5b5976c821b))
* **workflows:** secret ghcr ([b308699](https://github.com/jonasotoaguilar/warranty-system/commit/b3086991b346f3460677796a175049576a7fe5f9))

## 1.1.0 (2025-12-18)


### Features

* **api:** implement storage and backend routes ([87e3cff](https://github.com/JonaSotoAguilar/warranty-system/commit/87e3cffbface2790538d91acd9c6c328aa6ff967))
* **auth:** Implement user authentication with Supabase ([1bc950e](https://github.com/JonaSotoAguilar/warranty-system/commit/1bc950eb32c7d5aad24d40b73ff722adf6373e6f))
* **data:** Implement dockerfile ([4099f58](https://github.com/JonaSotoAguilar/warranty-system/commit/4099f584b3c54d05a2bc76f11f105c3b33e8f9bd))
* **data:** migrate supabase ([32482f1](https://github.com/JonaSotoAguilar/warranty-system/commit/32482f1d959d2557ef6288d3e7d9e98aee2ac268))
* **db:** migrate to sqlite ([e2b2935](https://github.com/JonaSotoAguilar/warranty-system/commit/e2b2935424bae1c2e8905c3a07eb76b2ffaa39d0))
* **pagination:** implement pagination controls and storage logic ([4a6d84e](https://github.com/JonaSotoAguilar/warranty-system/commit/4a6d84ef843b18960d8cb8d5b3f161077adf1816))
* **ui:** add core ui components and theme styles ([ba01cd2](https://github.com/JonaSotoAguilar/warranty-system/commit/ba01cd203e344b3b304a5cb33798adb1ddb0d56c))
* **ui:** implement movements registry ([990e03a](https://github.com/JonaSotoAguilar/warranty-system/commit/990e03a81c4b3629ad38938345722381ad573ca5))
* **warranties:** add full management dashboard with validation and rules ([5af0837](https://github.com/JonaSotoAguilar/warranty-system/commit/5af08374ab1382df49773ffe13b1103f36cc82aa))


### Bug Fixes

* **core:** adapt implementation to Next.js 16 async APIs ([bd062de](https://github.com/JonaSotoAguilar/warranty-system/commit/bd062dee430523ffeb28b93f2f5db7ab844de8d1))
* **ui:** enforce Chilean phone number format ([10eaf5e](https://github.com/JonaSotoAguilar/warranty-system/commit/10eaf5e505b1593835ad0870ed75c7016f794dee))
* update page searchParams to async ([4013366](https://github.com/JonaSotoAguilar/warranty-system/commit/4013366d8e59958e9ad37a64f57dd5b5976c821b))
