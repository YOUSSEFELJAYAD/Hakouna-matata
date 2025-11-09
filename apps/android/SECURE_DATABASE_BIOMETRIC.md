# Secure Database & Biometric Authentication - Android

## Quick Start

This Android app demonstrates enterprise-grade local database security and biometric authentication.

## Features

### 1. Encrypted Local Database

- **SQLCipher** encryption for entire database
- **Room** ORM for clean database operations
- Device-specific encryption keys
- Automatic key generation and management

### 2. Biometric Authentication

- **Fingerprint** authentication
- **Face** recognition
- **Device PIN/Pattern** fallback
- Authentication attempt tracking

### 3. Secure Data Storage

- Encrypted notes with biometric protection
- Secure user sessions
- Event logging with encryption
- Audit trail for security events

## Architecture

```
app/
├── data/
│   ├── local/
│   │   ├── dao/               # Database access objects
│   │   ├── entity/            # Database entities
│   │   └── AppDatabase.kt     # Encrypted database
│   └── repository/            # Data repositories
├── security/
│   ├── SecurityUtils.kt       # Security utilities
│   └── BiometricManager.kt    # Biometric auth manager
├── presentation/              # UI layer
│   └── SecureNoteActivity.kt  # Example activity
└── di/                        # Dependency injection
    └── DatabaseModule.kt      # Database DI module
```

## Dependencies

```gradle
// Room Database with encryption
implementation("androidx.room:room-runtime:2.6.1")
implementation("androidx.room:room-ktx:2.6.1")
kapt("androidx.room:room-compiler:2.6.1")
implementation("net.zetetic:android-database-sqlcipher:4.5.4")

// Biometric Authentication
implementation("androidx.biometric:biometric:1.2.0-alpha05")

// Security
implementation("androidx.security:security-crypto:1.1.0-alpha06")
```

## Usage Examples

### 1. Initialize Database

```kotlin
// Automatic initialization via Hilt
@Inject
lateinit var database: AppDatabase

// Manual initialization
val passphrase = AppDatabase.generateSecurePassphrase(context)
val database = AppDatabase.getInstance(context, passphrase)
```

### 2. Save Encrypted Note

```kotlin
@Inject
lateinit var repository: SecureNoteRepository

// Save note with encryption
viewModelScope.launch {
    val noteId = repository.saveNote(
        title = "My Secure Note",
        content = "This content is encrypted",
        requiresBiometric = true,
        encryptionKey = "secure-encryption-key"
    )
}
```

### 3. Biometric Authentication

```kotlin
val biometricManager = BiometricManager(context)

// Check if biometric is available
when (biometricManager.isBiometricAvailable()) {
    BiometricAvailability.AVAILABLE -> {
        // Authenticate
        biometricManager.authenticate(
            activity = this,
            title = "Authenticate",
            subtitle = "Verify your identity",
            onSuccess = { result ->
                // Access granted
                openSecureContent()
            },
            onError = { errorCode, message ->
                // Handle error
                showError(message)
            },
            onFailed = {
                // Authentication failed
                showRetryOption()
            }
        )
    }
    BiometricAvailability.NONE_ENROLLED -> {
        // Guide user to enroll biometric
        showBiometricEnrollmentPrompt()
    }
    else -> {
        // Biometric not available
        useFallbackAuthentication()
    }
}
```

### 4. Access Biometric-Protected Note

```kotlin
// Get note
val note = repository.getNoteById(noteId)

if (note?.requiresBiometric == true) {
    // Require biometric authentication
    biometricManager.authenticate(
        activity = this,
        title = "Unlock Note",
        subtitle = "Authenticate to view this note",
        onSuccess = {
            // Decrypt and display content
            val decrypted = decryptContent(note.content)
            displayNote(decrypted)
        },
        onError = { _, error ->
            showError("Authentication failed: $error")
        }
    )
} else {
    // Display note directly
    displayNote(note.content)
}
```

### 5. Observe Notes with Flow

```kotlin
// In ViewModel
val notes: Flow<List<SecureNoteEntity>> = repository.getAllNotes()

// In Activity/Fragment
viewModel.notes.collectAsState(initial = emptyList())

// Or with lifecycleScope
lifecycleScope.launch {
    viewModel.notes.collect { notes ->
        updateUI(notes)
    }
}
```

## Security Features

### Database Encryption

- **Algorithm:** AES-256-CBC via SQLCipher
- **Key Derivation:** SHA-256 hash of Android ID + salt
- **Passphrase:** 256-bit secure random
- **Protection:** Full database encryption at rest

### Biometric Security

- **Strong Authentication:** Class 3 biometric (BIOMETRIC_STRONG)
- **Fallback:** Device credential (PIN/Pattern/Password)
- **Crypto Support:** CryptoObject for encryption operations
- **Attempt Tracking:** Failed authentication logging

### Data Protection

1. **Encrypted Storage**
   - All sensitive data encrypted
   - Per-field encryption available
   - Secure key management

2. **Access Control**
   - Biometric authentication required
   - Session timeout
   - Failed attempt limits

3. **Audit Trail**
   - All access logged
   - Biometric attempts tracked
   - Suspicious activity detection

## Example Activity

See `SecureNoteActivity.kt` for a complete example demonstrating:

- Encrypted note creation
- Biometric-protected note access
- Real-time data observation with Flow
- Clean Architecture pattern
- Jetpack Compose UI

## Testing

### Test Biometric on Emulator

1. Open extended controls (⋯)
2. Go to Fingerprint section
3. Touch the sensor to simulate fingerprint

### Test Database Encryption

```kotlin
@Test
fun testDatabaseEncryption() {
    val passphrase = AppDatabase.generateSecurePassphrase(context)
    val db = AppDatabase.getInstance(context, passphrase)

    // Database should be encrypted
    val dbFile = context.getDatabasePath("hakouna_matata_db")
    val bytes = dbFile.readBytes()

    // Should not contain plain text
    assertFalse(String(bytes).contains("secure_notes"))
}
```

## Permissions Required

```xml
<uses-permission android:name="android.permission.USE_BIOMETRIC" />
<uses-feature
    android:name="android.hardware.fingerprint"
    android:required="false" />
```

## ProGuard Rules

```proguard
# Room
-keep class * extends androidx.room.RoomDatabase
-keep @androidx.room.Entity class *
-dontwarn androidx.room.paging.**

# SQLCipher
-keep class net.sqlcipher.** { *; }

# Biometric
-keep class androidx.biometric.** { *; }
```

## Security Best Practices

1. ✅ **Never hardcode encryption keys**
2. ✅ **Always check biometric availability**
3. ✅ **Provide fallback authentication**
4. ✅ **Track failed authentication attempts**
5. ✅ **Clear sensitive data from memory**
6. ✅ **Use SecureRandom for key generation**
7. ✅ **Implement session timeouts**
8. ✅ **Log security events**

## Troubleshooting

### Database Decryption Fails

**Problem:** App crashes with SQLCipher decryption error

**Solution:**
- Clear app data
- Ensure passphrase consistency
- Check SQLCipher version compatibility

### Biometric Not Working

**Problem:** Biometric prompt doesn't appear

**Solution:**
- Check if biometric is enrolled in device settings
- Verify USE_BIOMETRIC permission
- Test on physical device (emulator has limitations)

### Memory Leaks

**Problem:** Memory leak when using database

**Solution:**
- Always use applicationContext for database
- Close cursors and readers
- Use ViewModel to avoid activity leaks

## Additional Resources

- [Full Documentation](../../docs/DATABASE_AND_BIOMETRIC.md)
- [Security Implementation Guide](../../docs/SECURITY_IMPLEMENTATION.md)
- [Architecture Documentation](../../docs/ARCHITECTURE.md)

---

**Note:** This is a demonstration app. In production, implement additional security measures based on your threat model and compliance requirements.
