package com.hakounamatata.data.repository

import com.hakounamatata.data.local.dao.SecureNoteDao
import com.hakounamatata.data.local.entity.SecureNoteEntity
import com.hakounamatata.security.SecurityUtils
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Repository for Secure Notes
 * Handles data operations with encryption
 */
@Singleton
class SecureNoteRepository @Inject constructor(
    private val secureNoteDao: SecureNoteDao
) {

    /**
     * Get all notes
     */
    fun getAllNotes(): Flow<List<SecureNoteEntity>> {
        return secureNoteDao.getAllNotes()
    }

    /**
     * Get note by ID
     */
    suspend fun getNoteById(noteId: Long): SecureNoteEntity? {
        return secureNoteDao.getNoteById(noteId)
    }

    /**
     * Get biometric-protected notes
     */
    fun getBiometricProtectedNotes(): Flow<List<SecureNoteEntity>> {
        return secureNoteDao.getBiometricProtectedNotes()
    }

    /**
     * Save note with encryption
     */
    suspend fun saveNote(
        title: String,
        content: String,
        requiresBiometric: Boolean = false,
        encryptionKey: String? = null
    ): Long {
        val encryptedContent = if (encryptionKey != null) {
            // Encrypt content
            String(SecurityUtils.encryptAES(content, encryptionKey))
        } else {
            content
        }

        val note = SecureNoteEntity(
            title = title,
            content = encryptedContent,
            isEncrypted = encryptionKey != null,
            requiresBiometric = requiresBiometric,
            createdAt = System.currentTimeMillis(),
            updatedAt = System.currentTimeMillis()
        )

        return secureNoteDao.insertNote(note)
    }

    /**
     * Update note
     */
    suspend fun updateNote(
        noteId: Long,
        title: String,
        content: String,
        encryptionKey: String? = null
    ) {
        val existingNote = secureNoteDao.getNoteById(noteId) ?: return

        val encryptedContent = if (encryptionKey != null && existingNote.isEncrypted) {
            String(SecurityUtils.encryptAES(content, encryptionKey))
        } else {
            content
        }

        val updatedNote = existingNote.copy(
            title = title,
            content = encryptedContent,
            updatedAt = System.currentTimeMillis()
        )

        secureNoteDao.updateNote(updatedNote)
    }

    /**
     * Delete note
     */
    suspend fun deleteNote(noteId: Long) {
        secureNoteDao.deleteNoteById(noteId)
    }

    /**
     * Search notes
     */
    fun searchNotes(query: String): Flow<List<SecureNoteEntity>> {
        return secureNoteDao.searchNotes(query)
    }

    /**
     * Get notes count
     */
    suspend fun getNotesCount(): Int {
        return secureNoteDao.getNotesCount()
    }

    /**
     * Delete all notes
     */
    suspend fun deleteAllNotes() {
        secureNoteDao.deleteAllNotes()
    }
}
