package com.hakounamatata.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.ColumnInfo

/**
 * Secure Note Entity
 * Stores encrypted notes in local database
 */
@Entity(tableName = "secure_notes")
data class SecureNoteEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,

    @ColumnInfo(name = "title")
    val title: String,

    @ColumnInfo(name = "content")
    val content: String,

    @ColumnInfo(name = "is_encrypted")
    val isEncrypted: Boolean = true,

    @ColumnInfo(name = "created_at")
    val createdAt: Long = System.currentTimeMillis(),

    @ColumnInfo(name = "updated_at")
    val updatedAt: Long = System.currentTimeMillis(),

    @ColumnInfo(name = "requires_biometric")
    val requiresBiometric: Boolean = false,

    @ColumnInfo(name = "tags")
    val tags: String? = null
)

/**
 * User Session Entity
 * Stores secure user session data
 */
@Entity(tableName = "user_sessions")
data class UserSessionEntity(
    @PrimaryKey
    val userId: String,

    @ColumnInfo(name = "email")
    val email: String,

    @ColumnInfo(name = "access_token")
    val accessToken: String,

    @ColumnInfo(name = "refresh_token")
    val refreshToken: String,

    @ColumnInfo(name = "expires_at")
    val expiresAt: Long,

    @ColumnInfo(name = "last_activity")
    val lastActivity: Long = System.currentTimeMillis(),

    @ColumnInfo(name = "device_id")
    val deviceId: String,

    @ColumnInfo(name = "is_biometric_enabled")
    val isBiometricEnabled: Boolean = false
)

/**
 * Secure Event Entity
 * Stores encrypted event logs
 */
@Entity(tableName = "secure_events")
data class SecureEventEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,

    @ColumnInfo(name = "event_type")
    val eventType: String,

    @ColumnInfo(name = "event_data")
    val eventData: String,

    @ColumnInfo(name = "timestamp")
    val timestamp: Long = System.currentTimeMillis(),

    @ColumnInfo(name = "user_id")
    val userId: String?,

    @ColumnInfo(name = "is_synced")
    val isSynced: Boolean = false,

    @ColumnInfo(name = "requires_biometric_access")
    val requiresBiometricAccess: Boolean = false
)

/**
 * Biometric Auth Log Entity
 * Stores biometric authentication attempts
 */
@Entity(tableName = "biometric_auth_logs")
data class BiometricAuthLogEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,

    @ColumnInfo(name = "auth_type")
    val authType: String, // FINGERPRINT, FACE, IRIS

    @ColumnInfo(name = "success")
    val success: Boolean,

    @ColumnInfo(name = "timestamp")
    val timestamp: Long = System.currentTimeMillis(),

    @ColumnInfo(name = "failure_reason")
    val failureReason: String? = null,

    @ColumnInfo(name = "device_info")
    val deviceInfo: String? = null
)
