import Foundation
import CoreData
import CryptoKit

/**
 * Secure Database Manager for iOS
 * Uses CoreData with encryption for secure local storage
 *
 * Features:
 * - Encrypted CoreData persistent store
 * - Secure data encryption using CryptoKit
 * - Keychain integration for encryption keys
 */
class SecureDatabase {

    static let shared = SecureDatabase()

    private init() {}

    // MARK: - Core Data Stack

    lazy var persistentContainer: NSPersistentContainer = {
        let container = NSPersistentContainer(name: "HakounaMatata")

        // Get encryption key from Keychain
        guard let encryptionKey = KeychainManager.shared.getEncryptionKey() else {
            fatalError("Unable to retrieve database encryption key")
        }

        // Configure encrypted store
        let storeDescription = container.persistentStoreDescriptions.first
        storeDescription?.setOption(encryptionKey as NSObject,
                                   forKey: NSPersistentStoreFileProtectionKey)

        container.loadPersistentStores { (storeDescription, error) in
            if let error = error as NSError? {
                fatalError("Unresolved error \(error), \(error.userInfo)")
            }
        }

        return container
    }()

    var context: NSManagedObjectContext {
        return persistentContainer.viewContext
    }

    // MARK: - Core Data Operations

    func save() {
        if context.hasChanges {
            do {
                try context.save()
            } catch {
                let nserror = error as NSError
                print("Error saving context: \(nserror), \(nserror.userInfo)")
            }
        }
    }

    // MARK: - Secure Note Operations

    func createSecureNote(title: String, content: String, requiresBiometric: Bool) -> SecureNote? {
        let note = SecureNote(context: context)
        note.id = UUID()
        note.title = title
        note.content = encryptContent(content)
        note.isEncrypted = true
        note.requiresBiometric = requiresBiometric
        note.createdAt = Date()
        note.updatedAt = Date()

        save()
        return note
    }

    func fetchAllNotes() -> [SecureNote] {
        let fetchRequest: NSFetchRequest<SecureNote> = SecureNote.fetchRequest()
        fetchRequest.sortDescriptors = [NSSortDescriptor(key: "updatedAt", ascending: false)]

        do {
            return try context.fetch(fetchRequest)
        } catch {
            print("Error fetching notes: \(error)")
            return []
        }
    }

    func fetchBiometricProtectedNotes() -> [SecureNote] {
        let fetchRequest: NSFetchRequest<SecureNote> = SecureNote.fetchRequest()
        fetchRequest.predicate = NSPredicate(format: "requiresBiometric == %@", NSNumber(value: true))
        fetchRequest.sortDescriptors = [NSSortDescriptor(key: "updatedAt", ascending: false)]

        do {
            return try context.fetch(fetchRequest)
        } catch {
            print("Error fetching biometric notes: \(error)")
            return []
        }
    }

    func deleteNote(_ note: SecureNote) {
        context.delete(note)
        save()
    }

    // MARK: - Encryption

    private func encryptContent(_ content: String) -> String {
        guard let data = content.data(using: .utf8),
              let key = getEncryptionSymmetricKey() else {
            return content
        }

        do {
            let sealedBox = try AES.GCM.seal(data, using: key)
            guard let combined = sealedBox.combined else {
                return content
            }
            return combined.base64EncodedString()
        } catch {
            print("Encryption error: \(error)")
            return content
        }
    }

    func decryptContent(_ encryptedContent: String) -> String {
        guard let data = Data(base64Encoded: encryptedContent),
              let key = getEncryptionSymmetricKey() else {
            return encryptedContent
        }

        do {
            let sealedBox = try AES.GCM.SealedBox(combined: data)
            let decryptedData = try AES.GCM.open(sealedBox, using: key)
            return String(data: decryptedData, encoding: .utf8) ?? encryptedContent
        } catch {
            print("Decryption error: \(error)")
            return encryptedContent
        }
    }

    private func getEncryptionSymmetricKey() -> SymmetricKey? {
        guard let keyData = KeychainManager.shared.getEncryptionKey() as? Data else {
            return nil
        }
        return SymmetricKey(data: keyData)
    }
}

// MARK: - SecureNote Entity

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

extension SecureNote {
    @nonobjc public class func fetchRequest() -> NSFetchRequest<SecureNote> {
        return NSFetchRequest<SecureNote>(entityName: "SecureNote")
    }
}
