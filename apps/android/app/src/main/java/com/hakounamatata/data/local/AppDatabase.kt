package com.hakounamatata.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.sqlite.db.SupportSQLiteDatabase
import com.hakounamatata.data.local.dao.*
import com.hakounamatata.data.local.entity.*
import com.hakounamatata.security.SecurityUtils
import net.sqlcipher.database.SQLiteDatabase
import net.sqlcipher.database.SupportFactory

/**
 * Encrypted Room Database
 * Uses SQLCipher for database encryption
 */
@Database(
    entities = [
        SecureNoteEntity::class,
        UserSessionEntity::class,
        SecureEventEntity::class,
        BiometricAuthLogEntity::class
    ],
    version = 1,
    exportSchema = true
)
abstract class AppDatabase : RoomDatabase() {

    abstract fun secureNoteDao(): SecureNoteDao
    abstract fun userSessionDao(): UserSessionDao
    abstract fun secureEventDao(): SecureEventDao
    abstract fun biometricAuthLogDao(): BiometricAuthLogDao

    companion object {
        private const val DATABASE_NAME = "hakouna_matata_db"

        @Volatile
        private var INSTANCE: AppDatabase? = null

        /**
         * Get encrypted database instance
         * @param context Application context
         * @param passphrase Database encryption passphrase
         */
        fun getInstance(context: Context, passphrase: CharArray): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: buildEncryptedDatabase(context, passphrase).also {
                    INSTANCE = it
                }
            }
        }

        /**
         * Build encrypted database using SQLCipher
         */
        private fun buildEncryptedDatabase(
            context: Context,
            passphrase: CharArray
        ): AppDatabase {
            // Create SQLCipher support factory
            val factory = SupportFactory(SQLiteDatabase.getBytes(passphrase))

            return Room.databaseBuilder(
                context.applicationContext,
                AppDatabase::class.java,
                DATABASE_NAME
            )
                .openHelperFactory(factory)
                .addCallback(object : Callback() {
                    override fun onCreate(db: SupportSQLiteDatabase) {
                        super.onCreate(db)
                        // Database created - perform any initialization
                    }

                    override fun onOpen(db: SupportSQLiteDatabase) {
                        super.onOpen(db)
                        // Enable foreign keys
                        db.execSQL("PRAGMA foreign_keys=ON")
                    }
                })
                .fallbackToDestructiveMigration() // For demo purposes
                .build()
        }

        /**
         * Generate secure database passphrase
         * In production, derive from user credentials or secure storage
         */
        fun generateSecurePassphrase(context: Context): CharArray {
            // Get device-specific identifier
            val deviceId = android.provider.Settings.Secure.getString(
                context.contentResolver,
                android.provider.Settings.Secure.ANDROID_ID
            )

            // Generate secure hash
            val hash = SecurityUtils.sha256(deviceId + "hakouna-matata-salt")

            return hash.toCharArray()
        }

        /**
         * Clear database instance
         */
        fun clearInstance() {
            INSTANCE = null
        }
    }
}
