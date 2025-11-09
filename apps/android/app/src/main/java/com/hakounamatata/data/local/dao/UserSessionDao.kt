package com.hakounamatata.data.local.dao

import androidx.room.*
import com.hakounamatata.data.local.entity.UserSessionEntity
import kotlinx.coroutines.flow.Flow

/**
 * DAO for User Sessions
 * Manages secure user session storage
 */
@Dao
interface UserSessionDao {

    @Query("SELECT * FROM user_sessions WHERE userId = :userId")
    suspend fun getSession(userId: String): UserSessionEntity?

    @Query("SELECT * FROM user_sessions ORDER BY last_activity DESC LIMIT 1")
    fun getCurrentSession(): Flow<UserSessionEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSession(session: UserSessionEntity)

    @Update
    suspend fun updateSession(session: UserSessionEntity)

    @Query("UPDATE user_sessions SET last_activity = :timestamp WHERE userId = :userId")
    suspend fun updateLastActivity(userId: String, timestamp: Long = System.currentTimeMillis())

    @Query("DELETE FROM user_sessions WHERE userId = :userId")
    suspend fun deleteSession(userId: String)

    @Query("DELETE FROM user_sessions")
    suspend fun deleteAllSessions()

    @Query("DELETE FROM user_sessions WHERE expires_at < :currentTime")
    suspend fun deleteExpiredSessions(currentTime: Long = System.currentTimeMillis())

    @Query("SELECT COUNT(*) FROM user_sessions")
    suspend fun getSessionCount(): Int
}
