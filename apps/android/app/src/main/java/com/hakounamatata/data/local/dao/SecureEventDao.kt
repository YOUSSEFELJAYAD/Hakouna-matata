package com.hakounamatata.data.local.dao

import androidx.room.*
import com.hakounamatata.data.local.entity.SecureEventEntity
import com.hakounamatata.data.local.entity.BiometricAuthLogEntity
import kotlinx.coroutines.flow.Flow

/**
 * DAO for Secure Events
 * Manages encrypted event logging
 */
@Dao
interface SecureEventDao {

    @Query("SELECT * FROM secure_events ORDER BY timestamp DESC")
    fun getAllEvents(): Flow<List<SecureEventEntity>>

    @Query("SELECT * FROM secure_events WHERE id = :eventId")
    suspend fun getEventById(eventId: Long): SecureEventEntity?

    @Query("SELECT * FROM secure_events WHERE event_type = :eventType ORDER BY timestamp DESC")
    fun getEventsByType(eventType: String): Flow<List<SecureEventEntity>>

    @Query("SELECT * FROM secure_events WHERE is_synced = 0")
    suspend fun getUnsyncedEvents(): List<SecureEventEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertEvent(event: SecureEventEntity): Long

    @Update
    suspend fun updateEvent(event: SecureEventEntity)

    @Query("UPDATE secure_events SET is_synced = 1 WHERE id = :eventId")
    suspend fun markEventSynced(eventId: Long)

    @Query("DELETE FROM secure_events WHERE id = :eventId")
    suspend fun deleteEvent(eventId: Long)

    @Query("DELETE FROM secure_events WHERE timestamp < :timestamp")
    suspend fun deleteOldEvents(timestamp: Long)

    @Query("DELETE FROM secure_events")
    suspend fun deleteAllEvents()
}

/**
 * DAO for Biometric Auth Logs
 * Tracks biometric authentication attempts
 */
@Dao
interface BiometricAuthLogDao {

    @Query("SELECT * FROM biometric_auth_logs ORDER BY timestamp DESC LIMIT 50")
    fun getRecentAuthLogs(): Flow<List<BiometricAuthLogEntity>>

    @Query("SELECT * FROM biometric_auth_logs WHERE success = :success ORDER BY timestamp DESC")
    fun getAuthLogsByStatus(success: Boolean): Flow<List<BiometricAuthLogEntity>>

    @Insert
    suspend fun insertAuthLog(log: BiometricAuthLogEntity): Long

    @Query("DELETE FROM biometric_auth_logs WHERE timestamp < :timestamp")
    suspend fun deleteOldLogs(timestamp: Long)

    @Query("SELECT COUNT(*) FROM biometric_auth_logs WHERE success = 0 AND timestamp > :since")
    suspend fun getFailedAttemptsCount(since: Long): Int

    @Query("DELETE FROM biometric_auth_logs")
    suspend fun deleteAllLogs()
}
