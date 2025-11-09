import Foundation
import LocalAuthentication

/**
 * Biometric Authentication Manager for iOS
 * Supports Face ID and Touch ID
 *
 * Features:
 * - Face ID authentication
 * - Touch ID authentication
 * - Biometric availability checking
 * - Fallback to device passcode
 */
class BiometricManager {

    static let shared = BiometricManager()

    private init() {}

    private let context = LAContext()

    // MARK: - Biometric Availability

    /// Check if biometric authentication is available
    func isBiometricAvailable() -> (available: Bool, biometricType: BiometricType, error: String?) {
        var error: NSError?

        guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) else {
            let errorMessage = error?.localizedDescription ?? "Biometric authentication not available"
            return (false, .none, errorMessage)
        }

        let biometricType: BiometricType
        switch context.biometryType {
        case .faceID:
            biometricType = .faceID
        case .touchID:
            biometricType = .touchID
        case .none:
            biometricType = .none
        @unknown default:
            biometricType = .unknown
        }

        return (true, biometricType, nil)
    }

    // MARK: - Authentication

    /// Authenticate with biometrics
    func authenticate(
        reason: String = "Authenticate to access secure content",
        completion: @escaping (Bool, String?) -> Void
    ) {
        let context = LAContext()
        var error: NSError?

        // Check if biometric authentication is available
        guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) else {
            completion(false, error?.localizedDescription ?? "Biometric authentication not available")
            return
        }

        // Perform authentication
        context.evaluatePolicy(
            .deviceOwnerAuthenticationWithBiometrics,
            localizedReason: reason
        ) { success, error in
            DispatchQueue.main.async {
                if success {
                    completion(true, nil)
                } else {
                    let errorMessage = error?.localizedDescription ?? "Authentication failed"
                    completion(false, errorMessage)
                }
            }
        }
    }

    /// Authenticate with biometrics or device passcode
    func authenticateWithFallback(
        reason: String = "Authenticate to access secure content",
        completion: @escaping (Bool, String?) -> Void
    ) {
        let context = LAContext()
        context.localizedFallbackTitle = "Use Passcode"

        var error: NSError?

        guard context.canEvaluatePolicy(.deviceOwnerAuthentication, error: &error) else {
            completion(false, error?.localizedDescription ?? "Authentication not available")
            return
        }

        context.evaluatePolicy(
            .deviceOwnerAuthentication,
            localizedReason: reason
        ) { success, error in
            DispatchQueue.main.async {
                if success {
                    completion(true, nil)
                } else {
                    let errorMessage = error?.localizedDescription ?? "Authentication failed"
                    completion(false, errorMessage)
                }
            }
        }
    }

    // MARK: - Secure Data Access

    /// Authenticate and execute action on success
    func authenticateAndExecute(
        reason: String = "Authenticate to continue",
        action: @escaping () -> Void,
        onFailure: @escaping (String) -> Void
    ) {
        authenticate(reason: reason) { success, error in
            if success {
                action()
            } else {
                onFailure(error ?? "Authentication failed")
            }
        }
    }

    /// Check if device has passcode set
    func isPasscodeSet() -> Bool {
        return LAContext().canEvaluatePolicy(.deviceOwnerAuthentication, error: nil)
    }

    /// Get biometric type string for UI
    func getBiometricTypeString() -> String {
        let (_, biometricType, _) = isBiometricAvailable()

        switch biometricType {
        case .faceID:
            return "Face ID"
        case .touchID:
            return "Touch ID"
        case .none:
            return "None"
        case .unknown:
            return "Unknown"
        }
    }
}

// MARK: - BiometricType Enum

enum BiometricType {
    case faceID
    case touchID
    case none
    case unknown
}

// MARK: - Keychain Manager

/**
 * Keychain Manager for secure key storage
 */
class KeychainManager {

    static let shared = KeychainManager()

    private init() {}

    private let service = "com.hakounamatata.app"

    func getEncryptionKey() -> Data? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: "database_encryption_key",
            kSecReturnData as String: true
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        if status == errSecSuccess {
            return result as? Data
        } else if status == errSecItemNotFound {
            // Generate and save new key
            return generateAndSaveEncryptionKey()
        }

        return nil
    }

    private func generateAndSaveEncryptionKey() -> Data? {
        // Generate 256-bit encryption key
        var key = Data(count: 32)
        let result = key.withUnsafeMutableBytes {
            SecRandomCopyBytes(kSecRandomDefault, 32, $0.baseAddress!)
        }

        guard result == errSecSuccess else {
            return nil
        }

        // Save to Keychain
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: "database_encryption_key",
            kSecValueData as String: key,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]

        let status = SecItemAdd(query as CFDictionary, nil)

        if status == errSecSuccess {
            return key
        }

        return nil
    }

    func saveSecureData(key: String, data: Data) -> Bool {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]

        SecItemDelete(query as CFDictionary)
        let status = SecItemAdd(query as CFDictionary, nil)

        return status == errSecSuccess
    }

    func getSecureData(key: String) -> Data? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        return status == errSecSuccess ? result as? Data : nil
    }

    func deleteSecureData(key: String) -> Bool {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key
        ]

        let status = SecItemDelete(query as CFDictionary)
        return status == errSecSuccess
    }
}
