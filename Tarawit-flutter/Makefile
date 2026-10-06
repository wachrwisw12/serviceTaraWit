.PHONY: get run-dev run-dev-ios run-prod build-android build-android-prod build-ios build-ios-prod

get:
	flutter pub get

# Android emulator: API_BASE_URL 10.0.2.2 (host machine)
run-dev:
	flutter run --dart-define-from-file=env/dev.json

# iOS Simulator: API_BASE_URL localhost
run-dev-ios:
	flutter run --dart-define-from-file=env/dev_ios.json

run-prod:
	flutter run --release --dart-define-from-file=env/prod.json

build-android:
	flutter build apk --debug --dart-define-from-file=env/dev.json

build-android-prod:
	flutter build appbundle --release --dart-define-from-file=env/prod.json

build-ios:
	flutter build ios --debug --dart-define-from-file=env/dev_ios.json

build-ios-prod:
	flutter build ipa --release --dart-define-from-file=env/prod.json
