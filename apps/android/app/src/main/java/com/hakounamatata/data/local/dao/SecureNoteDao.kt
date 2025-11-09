package com.hakounamatata.data.local.dao

import androidx.room.*
import com.hakounamatata.data.local.entity.SecureNoteEntity
import kotlinx.coroutines.flow.Flow

/**
 * DAO for Secure Notes
 * Provides CRUD operations for encrypted notes
 */
@Dao
interface SecureNoteDao {

    @Query("SELECT * FROM secure_notes ORDER BY updated_at DESC")
    fun getAllNotes(): Flow<List<SecureNoteEntity>>

    @Query("SELECT * FROM secure_notes WHERE id = :noteId")
    suspend fun getNoteById(noteId: Long): SecureNoteEntity?

    @Query("SELECT * FROM secure_notes WHERE requires_biometric = 1")
    fun getBiometricProtectedNotes(): Flow<List<SecureNoteEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertNote(note: SecureNoteEntity): Long

    @Update
    suspend fun updateNote(note: SecureNoteEntity)

    @Delete
    suspend fun deleteNote(note: SecureNoteEntity)

    @Query("DELETE FROM secure_notes WHERE id = :noteId")
    suspend fun deleteNoteById(noteId: Long)

    @Query("DELETE FROM secure_notes")
    suspend fun deleteAllNotes()

    @Query("SELECT COUNT(*) FROM secure_notes")
    suspend fun getNotesCount(): Int

    @Query("SELECT * FROM secure_notes WHERE title LIKE '%' || :query || '%' OR content LIKE '%' || :query || '%'")
    fun searchNotes(query: String): Flow<List<SecureNoteEntity>>
}
