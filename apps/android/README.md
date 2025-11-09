# Hakouna Matata Android App

Enterprise-grade Android application built with Jetpack Compose and modern Android development practices.

## Tech Stack

- **Jetpack Compose** - Modern declarative UI framework
- **Kotlin** - Primary programming language
- **Dagger Hilt** - Dependency injection
- **Retrofit** - Type-safe HTTP client
- **Coil** - Image loading library
- **Firebase** - Backend services (Auth, Firestore, Analytics, Crashlytics)
- **Orbit Compose** - UI components library
- **Navigation Component** - App navigation
- **Kotlin Serialization** - JSON parsing
- **DataStore** - Preferences storage
- **Security Crypto** - Encrypted shared preferences

## Architecture

The app follows **Clean Architecture** principles with MVVM pattern:

```
app/
├── data/           # Data layer (repositories, data sources)
├── domain/         # Domain layer (use cases, entities)
├── presentation/   # Presentation layer (UI, ViewModels)
├── di/             # Dependency injection modules
└── utils/          # Utility classes
```

### Layers

1. **Presentation Layer** - Jetpack Compose UI and ViewModels
2. **Domain Layer** - Business logic and use cases
3. **Data Layer** - Repositories and data sources

## Security Features

- **Encrypted SharedPreferences** using AndroidX Security library
- **Network Security** with certificate pinning
- **ProGuard/R8** code obfuscation in release builds
- **No cleartext traffic** allowed
- **Firebase App Check** for API security

## Build Variants

- **debug** - Development build with logging enabled
- **release** - Production build with minification and obfuscation

## Setup

1. Add `google-services.json` from Firebase Console to `app/` directory
2. Configure Firebase project settings
3. Build the project: `./gradlew assembleDebug`

## Running

```bash
./gradlew installDebug
```

## Testing

```bash
./gradlew test              # Unit tests
./gradlew connectedTest     # Instrumented tests
```

## Dependencies

See `app/build.gradle.kts` for full dependency list.

## License

MIT
