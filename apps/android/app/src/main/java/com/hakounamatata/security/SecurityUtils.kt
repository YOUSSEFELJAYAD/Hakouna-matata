package com.hakounamatata.security

import android.content.Context
import android.os.Build
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import java.io.File
import java.security.MessageDigest
import javax.crypto.Cipher
import javax.crypto.spec.SecretKeySpec

/**
 * Security Utilities for Android
 * Provides root detection, secure storage, and encryption utilities
 */
object SecurityUtils {

    /**
     * Check if device is rooted
     * @return true if device appears to be rooted
     */
    fun isDeviceRooted(): Boolean {
        return checkRootMethod1() || checkRootMethod2() || checkRootMethod3()
    }

    /**
     * Check for root - Method 1: Check for su binary
     */
    private fun checkRootMethod1(): Boolean {
        val paths = arrayOf(
            "/system/app/Superuser.apk",
            "/sbin/su",
            "/system/bin/su",
            "/system/xbin/su",
            "/data/local/xbin/su",
            "/data/local/bin/su",
            "/system/sd/xbin/su",
            "/system/bin/failsafe/su",
            "/data/local/su",
            "/su/bin/su"
        )
        
        for (path in paths) {
            if (File(path).exists()) {
                return true
            }
        }
        return false
    }

    /**
     * Check for root - Method 2: Check for Superuser.apk
     */
    private fun checkRootMethod2(): Boolean {
        return try {
            Runtime.getRuntime().exec("su")
            true
        } catch (e: Exception) {
            false
        }
    }

    /**
     * Check for root - Method 3: Check build tags
     */
    private fun checkRootMethod3(): Boolean {
        val buildTags = Build.TAGS
        return buildTags != null && buildTags.contains("test-keys")
    }

    /**
     * Check if device is running in an emulator
     * @return true if device appears to be an emulator
     */
    fun isEmulator(): Boolean {
        return (Build.FINGERPRINT.startsWith("generic")
                || Build.FINGERPRINT.startsWith("unknown")
                || Build.MODEL.contains("google_sdk")
                || Build.MODEL.contains("Emulator")
                || Build.MODEL.contains("Android SDK built for x86")
                || Build.MANUFACTURER.contains("Genymotion")
                || (Build.BRAND.startsWith("generic") && Build.DEVICE.startsWith("generic"))
                || "google_sdk" == Build.PRODUCT)
    }

    /**
     * Get or create encrypted shared preferences
     * @param context Application context
     * @return Encrypted SharedPreferences instance
     */
    fun getEncryptedPreferences(context: Context) = try {
        val masterKey = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()

        EncryptedSharedPreferences.create(
            context,
            "hakouna_secure_prefs",
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    } catch (e: Exception) {
        throw SecurityException("Failed to create encrypted preferences", e)
    }

    /**
     * Hash a string using SHA-256
     * @param input String to hash
     * @return Hashed string in hex format
     */
    fun sha256(input: String): String {
        val bytes = MessageDigest
            .getInstance("SHA-256")
            .digest(input.toByteArray())
        return bytes.joinToString("") { "%02x".format(it) }
    }

    /**
     * Encrypt data using AES
     * @param data Data to encrypt
     * @param key Encryption key
     * @return Encrypted data
     */
    fun encryptAES(data: String, key: String): ByteArray {
        val cipher = Cipher.getInstance("AES/ECB/PKCS5Padding")
        val secretKey = SecretKeySpec(key.toByteArray().copyOf(16), "AES")
        cipher.init(Cipher.ENCRYPT_MODE, secretKey)
        return cipher.doFinal(data.toByteArray())
    }

    /**
     * Decrypt data using AES
     * @param encryptedData Encrypted data
     * @param key Decryption key
     * @return Decrypted string
     */
    fun decryptAES(encryptedData: ByteArray, key: String): String {
        val cipher = Cipher.getInstance("AES/ECB/PKCS5Padding")
        val secretKey = SecretKeySpec(key.toByteArray().copyOf(16), "AES")
        cipher.init(Cipher.DECRYPT_MODE, secretKey)
        return String(cipher.doFinal(encryptedData))
    }

    /**
     * Validate app signature to prevent repackaging
     * @param context Application context
     * @param expectedSignature Expected signature hash
     * @return true if signature matches
     */
    fun validateAppSignature(context: Context, expectedSignature: String): Boolean {
        return try {
            val packageInfo = context.packageManager.getPackageInfo(
                context.packageName,
                android.content.pm.PackageManager.GET_SIGNATURES
            )
            val signature = packageInfo.signatures[0].toByteArray()
            val currentSignature = sha256(String(signature))
            currentSignature == expectedSignature
        } catch (e: Exception) {
            false
        }
    }

    /**
     * Check if device has screen lock enabled
     * @param context Application context
     * @return true if screen lock is enabled
     */
    fun hasSecureScreenLock(context: Context): Boolean {
        val keyguardManager = context.getSystemService(Context.KEYGUARD_SERVICE) 
            as android.app.KeyguardManager
        return keyguardManager.isDeviceSecure
    }

    /**
     * Generate a random secure token
     * @param length Token length
     * @return Random token
     */
    fun generateSecureToken(length: Int = 32): String {
        val allowedChars = ('A'..'Z') + ('a'..'z') + ('0'..'9')
        return (1..length)
            .map { allowedChars.random() }
            .joinToString("")
    }
}
