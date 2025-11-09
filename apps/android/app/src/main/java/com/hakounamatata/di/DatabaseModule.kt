package com.hakounamatata.di

import android.content.Context
import com.hakounamatata.data.local.AppDatabase
import com.hakounamatata.data.local.dao.*
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

/**
 * Dagger Hilt Module for Database Dependencies
 * Provides encrypted database and DAOs
 */
@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): AppDatabase {
        // Generate secure passphrase for database encryption
        val passphrase = AppDatabase.generateSecurePassphrase(context)
        return AppDatabase.getInstance(context, passphrase)
    }

    @Provides
    @Singleton
    fun provideSecureNoteDao(database: AppDatabase): SecureNoteDao {
        return database.secureNoteDao()
    }

    @Provides
    @Singleton
    fun provideUserSessionDao(database: AppDatabase): UserSessionDao {
        return database.userSessionDao()
    }

    @Provides
    @Singleton
    fun provideSecureEventDao(database: AppDatabase): SecureEventDao {
        return database.secureEventDao()
    }

    @Provides
    @Singleton
    fun provideBiometricAuthLogDao(database: AppDatabase): BiometricAuthLogDao {
        return database.biometricAuthLogDao()
    }
}

/**
 * Security Module for Biometric and Security Services
 */
@Module
@InstallIn(SingletonComponent::class)
object SecurityModule {

    @Provides
    @Singleton
    fun provideBiometricManager(@ApplicationContext context: Context): com.hakounamatata.security.BiometricManager {
        return com.hakounamatata.security.BiometricManager(context)
    }
}
