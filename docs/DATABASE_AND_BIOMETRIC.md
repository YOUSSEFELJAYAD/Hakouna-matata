# Local Database & Biometric Authentication Guide

## Overview

This document covers the secure local database implementation and biometric authentication features across Android and iOS platforms.

## Table of Contents

1. [Android Implementation](#android-implementation)
2. [iOS Implementation](#ios-implementation)
3. [Security Features](#security-features)
4. [Usage Examples](#usage-examples)
5. [Best Practices](#best-practices)

---

## Android Implementation

### Technologies Used

- **Room Database** - SQLite abstraction layer
- **SQLCipher** - Database encryption
- **BiometricPrompt** - Fingerprint/Face authentication
- **Dagger Hilt** - Dependency injection
- **Kotlin Coroutines** - Asynchronous operations
- **Flow** - Reactive data streams

### Database Structure

#### Entities

1. **SecureNoteEntity**
   - Stores encrypted notes
   - Supports biometric protection
   - Fields: id, title, content, isEncrypted, requiresBiometric, createdAt, updatedAt

2. **UserSessionEntity**
   - Stores secure user sessions
   - Fields: userId, email, accessToken, refreshToken, expiresAt, lastActivity, isBiometricEnabled

3. **SecureEventEntity**
   - Stores encrypted event logs
   - Fields: id, eventType, eventData, timestamp, userId, isSynced, requiresBiometricAccess

4. **BiometricAuthLogEntity**
   - Logs biometric authentication attempts
   - Fields: id, authType, success, timestamp, failureReason

### Database Encryption

```kotlin
// Location: apps/android/app/src/main/java/com/hakounamatata/data/local/AppDatabase.kt

val passphrase = AppDatabase.generateSecurePassphrase(context)
val database = AppDatabase.getInstance(context, passphrase)
```

**Features:**
- SQLCipher encryption for entire database
- Passphrase derived from device-specific identifier
- Secure key generation using SHA-256

### Biometric Authentication

```kotlin
// Location: apps/android/app/src/main/java/com/hakounamatata/security/BiometricManager.kt

val biometricManager = BiometricManager(context)

// Check availability
when (biometricManager.isBiometricAvailable()) {
    BiometricAvailability.AVAILABLE -> {
        // Biometric available
    }
    BiometricAvailability.NONE_ENROLLED -> {
        // No biometric enrolled
    }
    // ... other cases
}

// Authenticate
biometricManager.authenticate(
    activity = this,
    title = "Authenticate",
    subtitle = "Verify your identity",
    description = "Use your biometric credential",
    onSuccess = { result ->
        // Authentication successful
    },
    onError = { errorCode, errString ->
        // Authentication error
    },
    onFailed = {
        // Authentication failed
    }
)
```

**Supported Biometric Types:**
- Fingerprint
- Face recognition
- Iris (on supported devices)

### Example: Secure Note Storage

```kotlin
// Create encrypted note
viewModelScope.launch {
    repository.saveNote(
        title = "My Secure Note",
        content = "This is encrypted content",
        requiresBiometric = true,
        encryptionKey = "secure-key"
    )
}

// Retrieve notes (with biometric protection)
repository.getAllNotes().collect { notes ->
    notes.forEach { note ->
        if (note.requiresBiometric) {
            // Require biometric authentication
            biometricManager.authenticate(
                activity = this,
                onSuccess = {
                    // Display note content
                },
                onError = { _, error ->
                    // Handle error
                }
            )
        } else {
            // Display note directly
        }
    }
}
```

### DAOs (Data Access Objects)

#### SecureNoteDao

```kotlin
@Dao
interface SecureNoteDao {
    @Query("SELECT * FROM secure_notes ORDER BY updated_at DESC")
    fun getAllNotes(): Flow<List<SecureNoteEntity>>

    @Query("SELECT * FROM secure_notes WHERE requires_biometric = 1")
    fun getBiometricProtectedNotes(): Flow<List<SecureNoteEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertNote(note: SecureNoteEntity): Long

    @Delete
    suspend fun deleteNote(note: SecureNoteEntity)
}
```

### Repository Pattern

```kotlin
@Singleton
class SecureNoteRepository @Inject constructor(
    private val secureNoteDao: SecureNoteDao
) {
    fun getAllNotes(): Flow<List<SecureNoteEntity>> {
        return secureNoteDao.getAllNotes()
    }

    suspend fun saveNote(
        title: String,
        content: String,
        requiresBiometric: Boolean,
        encryptionKey: String? = null
    ): Long {
        val encryptedContent = if (encryptionKey != null) {
            String(SecurityUtils.encryptAES(content, encryptionKey))
        } else {
            content
        }

        val note = SecureNoteEntity(
            title = title,
            content = encryptedContent,
            isEncrypted = encryptionKey != null,
            requiresBiometric = requiresBiometric
        )

        return secureNoteDao.insertNote(note)
    }
}
```

### Dependency Injection

```kotlin
@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {
    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): AppDatabase {
        val passphrase = AppDatabase.generateSecurePassphrase(context)
        return AppDatabase.getInstance(context, passphrase)
    }

    @Provides
    @Singleton
    fun provideSecureNoteDao(database: AppDatabase): SecureNoteDao {
        return database.secureNoteDao()
    }
}
```

---

## iOS Implementation

### Technologies Used

- **CoreData** - Data persistence framework
- **CryptoKit** - Encryption and cryptography
- **LocalAuthentication** - Biometric authentication
- **Keychain** - Secure credential storage

### Database Structure (CoreData)

#### SecureNote Entity

```swift
@objc(SecureNote)
public class SecureNote: NSManagedObject {
    @NSManaged public var id: UUID
    @NSManaged public var title: String
    @NSManaged public var content: String
    @NSManaged public var isEncrypted: Bool
    @NSManaged public var requiresBiometric: Bool
    @NSManaged public var createdAt: Date
    @NSManaged public var updatedAt: Date
}
```

### Database Encryption

```swift
// Location: apps/ios/Core/Database/SecureDatabase.swift

let database = SecureDatabase.shared

// Create encrypted note
database.createSecureNote(
    title: "My Secure Note",
    content: "This is encrypted content",
    requiresBiometric: true
)

// Fetch notes
let notes = database.fetchAllNotes()
let biometricNotes = database.fetchBiometricProtectedNotes()
```

**Features:**
- CoreData with NSPersistentStore encryption
- AES-GCM encryption for content
- Keychain integration for encryption keys
- Automatic key generation and storage

### Biometric Authentication

```swift
// Location: apps/ios/Core/Security/BiometricManager.swift

let biometricManager = BiometricManager.shared

// Check availability
let (available, biometricType, error) = biometricManager.isBiometricAvailable()

if available {
    print("Biometric type: \(biometricType)")
    // faceID, touchID, or none
}

// Authenticate
biometricManager.authenticate(
    reason: "Authenticate to access secure content"
) { success, error in
    if success {
        // Authentication successful
    } else {
        // Handle error
    }
}

// Authenticate with fallback to passcode
biometricManager.authenticateWithFallback(
    reason: "Verify your identity"
) { success, error in
    // Handle result
}
```

**Supported Biometric Types:**
- Face ID (iPhone X and later)
- Touch ID (iPhone 5s to iPhone 8, iPad)

### Example: Secure Data Access

```swift
// Authenticate and execute action
biometricManager.authenticateAndExecute(
    reason: "Access secure note",
    action: {
        // User authenticated - show secure content
        let content = database.decryptContent(note.content)
        showContent(content)
    },
    onFailure: { error in
        // Authentication failed
        showError(error)
    }
)
```

### Keychain Manager

```swift
// Save secure data
let success = KeychainManager.shared.saveSecureData(
    key: "user_token",
    data: tokenData
)

// Retrieve secure data
if let data = KeychainManager.shared.getSecureData(key: "user_token") {
    // Use secure data
}

// Delete secure data
KeychainManager.shared.deleteSecureData(key: "user_token")
```

---

## Security Features

### Database Encryption

#### Android (SQLCipher)

- **Algorithm:** AES-256-CBC
- **Key Derivation:** SHA-256 hash of device identifier
- **Passphrase Length:** 256 bits (32 bytes)
- **Database File:** Fully encrypted at rest

#### iOS (CoreData + CryptoKit)

- **Algorithm:** AES-256-GCM
- **Key Storage:** Keychain with device-only accessibility
- **Key Generation:** SecRandomCopyBytes (CSPRNG)
- **Content Encryption:** Per-field encryption

### Biometric Security

#### Android

- **BiometricPrompt API** - Android 9.0+ (API 28+)
- **Authenticators:**
  - BIOMETRIC_STRONG - Class 3 biometrics
  - DEVICE_CREDENTIAL - PIN/Pattern/Password fallback
- **Crypto Support** - CryptoObject for encryption operations

#### iOS

- **LocalAuthentication Framework**
- **LAPolicy:**
  - deviceOwnerAuthenticationWithBiometrics - Biometric only
  - deviceOwnerAuthentication - Biometric + Passcode
- **Keychain Integration** - Biometric-protected key storage

### Data Protection

1. **Encryption at Rest**
   - Database files encrypted
   - Secure key storage
   - Device-bound encryption

2. **Encryption in Transit**
   - TLS/HTTPS for network communication
   - Certificate pinning (Android)

3. **Access Control**
   - Biometric authentication required
   - Session timeout
   - Failed attempt tracking

4. **Secure Storage**
   - Android: EncryptedSharedPreferences + SQLCipher
   - iOS: Keychain + CoreData encryption

---

## Usage Examples

### Android Example: Secure Event Logging

```kotlin
// Create biometric-protected event
viewModelScope.launch {
    val event = SecureEventEntity(
        eventType = "PAYMENT_TRANSACTION",
        eventData = encryptedPaymentData,
        userId = currentUserId,
        requiresBiometricAccess = true
    )

    secureEventDao.insertEvent(event)
}

// Access event with biometric authentication
fun viewEvent(eventId: Long) {
    biometricManager.authenticate(
        activity = this,
        title = "View Transaction",
        subtitle = "Authenticate to view payment details",
        onSuccess = {
            viewModelScope.launch {
                val event = secureEventDao.getEventById(eventId)
                // Display event data
            }
        },
        onError = { code, message ->
            showError(message)
        }
    )
}
```

### iOS Example: Secure User Session

```swift
// Save secure session
class SessionManager {
    func saveSession(token: String, userId: String) {
        BiometricManager.shared.authenticateAndExecute(
            reason: "Secure your session",
            action: {
                let sessionData = "\(userId):\(token)".data(using: .utf8)!
                KeychainManager.shared.saveSecureData(
                    key: "user_session",
                    data: sessionData
                )
            },
            onFailure: { error in
                print("Failed to save session: \(error)")
            }
        )
    }

    func getSession() -> (userId: String, token: String)? {
        guard let data = KeychainManager.shared.getSecureData(key: "user_session"),
              let sessionString = String(data: data, encoding: .utf8) else {
            return nil
        }

        let components = sessionString.split(separator: ":")
        guard components.count == 2 else { return nil }

        return (String(components[0]), String(components[1]))
    }
}
```

---

## Best Practices

### Database

1. **Always encrypt sensitive data**
   ```kotlin
   // Good
   val encrypted = SecurityUtils.encryptAES(sensitiveData, key)

   // Bad - storing plain text
   val note = SecureNoteEntity(content = sensitiveData)
   ```

2. **Use proper key management**
   - Never hardcode encryption keys
   - Derive keys from secure sources
   - Rotate keys periodically

3. **Implement proper cleanup**
   ```kotlin
   // Clear expired sessions
   suspend fun cleanupSessions() {
       userSessionDao.deleteExpiredSessions()
   }
   ```

### Biometric Authentication

1. **Check availability before using**
   ```kotlin
   when (biometricManager.isBiometricAvailable()) {
       BiometricAvailability.AVAILABLE -> {
           // Proceed with biometric
       }
       BiometricAvailability.NONE_ENROLLED -> {
           // Guide user to enroll biometric
       }
       else -> {
           // Fall back to alternative authentication
       }
   }
   ```

2. **Provide fallback options**
   - Allow PIN/password as backup
   - Don't lock users out completely

3. **Handle failures gracefully**
   ```kotlin
   biometricManager.authenticate(
       activity = this,
       onError = { code, message ->
           when (code) {
               BiometricPrompt.ERROR_USER_CANCELED -> {
                   // User cancelled - allow retry
               }
               BiometricPrompt.ERROR_LOCKOUT -> {
                   // Too many attempts - wait period
               }
               else -> {
                   // Other errors
               }
           }
       }
   )
   ```

4. **Track authentication attempts**
   ```kotlin
   suspend fun logAuthAttempt(success: Boolean, type: String) {
       biometricAuthLogDao.insertAuthLog(
           BiometricAuthLogEntity(
               authType = type,
               success = success,
               timestamp = System.currentTimeMillis()
           )
       )

       // Check for suspicious activity
       val recentFailures = biometricAuthLogDao
           .getFailedAttemptsCount(since = System.currentTimeMillis() - 3600000)

       if (recentFailures > 5) {
           // Trigger security alert
       }
   }
   ```

### Security Checklist

- [ ] Database encrypted with strong cipher (AES-256)
- [ ] Encryption keys stored securely (Keychain/EncryptedSharedPreferences)
- [ ] Biometric authentication implemented correctly
- [ ] Fallback authentication available
- [ ] Failed authentication attempts tracked
- [ ] Sensitive data never logged
- [ ] Proper error handling
- [ ] Session timeout implemented
- [ ] Regular security audits

---

## Performance Considerations

### Android

1. **Database Operations**
   - Use suspend functions for DB operations
   - Leverage Flow for reactive updates
   - Implement pagination for large datasets

2. **Encryption Overhead**
   - Encrypt only sensitive fields
   - Cache decrypted data in memory (with caution)
   - Use background threads for encryption

### iOS

1. **CoreData**
   - Use NSFetchedResultsController for UITableView
   - Implement batch operations
   - Configure proper fetch batch size

2. **Biometric Delays**
   - Show loading indicators
   - Implement timeout handling
   - Provide skip option where appropriate

---

## Troubleshooting

### Android Common Issues

1. **Database decryption fails**
   - Solution: Ensure passphrase consistency
   - Check SQLCipher version compatibility

2. **Biometric not available**
   - Solution: Check device capabilities
   - Verify app permissions in AndroidManifest

3. **EncryptedSharedPreferences errors**
   - Solution: Clear app data
   - Regenerate master key

### iOS Common Issues

1. **Keychain access denied**
   - Solution: Check entitlements
   - Verify access group configuration

2. **Face ID not working**
   - Solution: Check Info.plist for usage description
   - Verify device supports Face ID

3. **CoreData migration issues**
   - Solution: Implement proper migration strategy
   - Backup data before updates

---

## Additional Resources

- [Android BiometricPrompt Documentation](https://developer.android.com/jetpack/androidx/releases/biometric)
- [SQLCipher for Android](https://www.zetetic.net/sqlcipher/sqlcipher-for-android/)
- [iOS LocalAuthentication Framework](https://developer.apple.com/documentation/localauthentication)
- [CoreData Encryption Guide](https://developer.apple.com/documentation/coredata)

---

**Security Notice:** Always follow platform-specific security guidelines and keep libraries updated to the latest versions.
