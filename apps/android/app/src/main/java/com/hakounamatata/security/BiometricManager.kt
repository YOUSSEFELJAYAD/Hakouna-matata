package com.hakounamatata.security

import android.content.Context
import androidx.biometric.BiometricManager as AndroidBiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import javax.crypto.Cipher

/**
 * Biometric Authentication Manager
 * Handles fingerprint, face, and iris authentication
 */
class BiometricManager(private val context: Context) {

    private val biometricManager = AndroidBiometricManager.from(context)

    /**
     * Check if biometric authentication is available
     */
    fun isBiometricAvailable(): BiometricAvailability {
        return when (biometricManager.canAuthenticate(
            AndroidBiometricManager.Authenticators.BIOMETRIC_STRONG
        )) {
            AndroidBiometricManager.BIOMETRIC_SUCCESS ->
                BiometricAvailability.AVAILABLE

            AndroidBiometricManager.BIOMETRIC_ERROR_NO_HARDWARE ->
                BiometricAvailability.NO_HARDWARE

            AndroidBiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE ->
                BiometricAvailability.HARDWARE_UNAVAILABLE

            AndroidBiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED ->
                BiometricAvailability.NONE_ENROLLED

            AndroidBiometricManager.BIOMETRIC_ERROR_SECURITY_UPDATE_REQUIRED ->
                BiometricAvailability.SECURITY_UPDATE_REQUIRED

            AndroidBiometricManager.BIOMETRIC_ERROR_UNSUPPORTED ->
                BiometricAvailability.UNSUPPORTED

            AndroidBiometricManager.BIOMETRIC_STATUS_UNKNOWN ->
                BiometricAvailability.UNKNOWN

            else -> BiometricAvailability.UNKNOWN
        }
    }

    /**
     * Show biometric prompt for authentication
     */
    fun authenticate(
        activity: FragmentActivity,
        title: String = "Biometric Authentication",
        subtitle: String = "Authenticate to continue",
        description: String = "Use your biometric credential to proceed",
        negativeButtonText: String = "Cancel",
        onSuccess: (BiometricPrompt.AuthenticationResult) -> Unit,
        onError: (Int, CharSequence) -> Unit,
        onFailed: () -> Unit
    ) {
        val executor = ContextCompat.getMainExecutor(context)

        val callback = object : BiometricPrompt.AuthenticationCallback() {
            override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                super.onAuthenticationError(errorCode, errString)
                onError(errorCode, errString)
            }

            override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                super.onAuthenticationSucceeded(result)
                onSuccess(result)
            }

            override fun onAuthenticationFailed() {
                super.onAuthenticationFailed()
                onFailed()
            }
        }

        val biometricPrompt = BiometricPrompt(activity, executor, callback)

        val promptInfo = BiometricPrompt.PromptInfo.Builder()
            .setTitle(title)
            .setSubtitle(subtitle)
            .setDescription(description)
            .setNegativeButtonText(negativeButtonText)
            .setAllowedAuthenticators(
                AndroidBiometricManager.Authenticators.BIOMETRIC_STRONG or
                        AndroidBiometricManager.Authenticators.DEVICE_CREDENTIAL
            )
            .build()

        biometricPrompt.authenticate(promptInfo)
    }

    /**
     * Authenticate with crypto object for encryption/decryption
     */
    fun authenticateWithCrypto(
        activity: FragmentActivity,
        cipher: Cipher,
        title: String = "Biometric Authentication",
        subtitle: String = "Authenticate to access secure data",
        description: String = "Use your biometric credential",
        negativeButtonText: String = "Cancel",
        onSuccess: (BiometricPrompt.AuthenticationResult) -> Unit,
        onError: (Int, CharSequence) -> Unit,
        onFailed: () -> Unit
    ) {
        val executor = ContextCompat.getMainExecutor(context)

        val callback = object : BiometricPrompt.AuthenticationCallback() {
            override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                super.onAuthenticationError(errorCode, errString)
                onError(errorCode, errString)
            }

            override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                super.onAuthenticationSucceeded(result)
                onSuccess(result)
            }

            override fun onAuthenticationFailed() {
                super.onAuthenticationFailed()
                onFailed()
            }
        }

        val biometricPrompt = BiometricPrompt(activity, executor, callback)

        val promptInfo = BiometricPrompt.PromptInfo.Builder()
            .setTitle(title)
            .setSubtitle(subtitle)
            .setDescription(description)
            .setNegativeButtonText(negativeButtonText)
            .setAllowedAuthenticators(AndroidBiometricManager.Authenticators.BIOMETRIC_STRONG)
            .build()

        val cryptoObject = BiometricPrompt.CryptoObject(cipher)
        biometricPrompt.authenticate(promptInfo, cryptoObject)
    }

    /**
     * Get biometric type that's available
     */
    fun getBiometricType(): BiometricType {
        // This is a simplified version
        // In a real app, you'd need to check device capabilities
        return when {
            context.packageManager.hasSystemFeature("android.hardware.fingerprint") ->
                BiometricType.FINGERPRINT
            context.packageManager.hasSystemFeature("android.hardware.biometrics.face") ->
                BiometricType.FACE
            context.packageManager.hasSystemFeature("android.hardware.biometrics.iris") ->
                BiometricType.IRIS
            else -> BiometricType.UNKNOWN
        }
    }
}

/**
 * Biometric availability status
 */
enum class BiometricAvailability {
    AVAILABLE,
    NO_HARDWARE,
    HARDWARE_UNAVAILABLE,
    NONE_ENROLLED,
    SECURITY_UPDATE_REQUIRED,
    UNSUPPORTED,
    UNKNOWN
}

/**
 * Biometric authentication types
 */
enum class BiometricType {
    FINGERPRINT,
    FACE,
    IRIS,
    UNKNOWN
}

/**
 * Biometric authentication result
 */
sealed class BiometricResult {
    data class Success(val cryptoObject: BiometricPrompt.CryptoObject?) : BiometricResult()
    data class Error(val errorCode: Int, val errorMessage: String) : BiometricResult()
    object Failed : BiometricResult()
    object Cancelled : BiometricResult()
}
