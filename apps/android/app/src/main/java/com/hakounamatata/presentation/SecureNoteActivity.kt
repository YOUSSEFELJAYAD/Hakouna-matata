package com.hakounamatata.presentation

import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.hakounamatata.data.local.entity.SecureNoteEntity
import com.hakounamatata.security.BiometricAvailability
import com.hakounamatata.security.BiometricManager
import dagger.hilt.android.AndroidEntryPoint

/**
 * Example Activity: Secure Notes with Biometric Protection
 *
 * Demonstrates:
 * 1. Secure database storage with encryption
 * 2. Biometric authentication for sensitive data
 * 3. Real-time data observation with Flow
 * 4. Clean Architecture pattern
 */
@AndroidEntryPoint
class SecureNoteActivity : ComponentActivity() {

    private lateinit var biometricManager: BiometricManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        biometricManager = BiometricManager(this)

        setContent {
            MaterialTheme {
                SecureNoteScreen(
                    biometricManager = biometricManager,
                    onBiometricRequired = { noteId ->
                        authenticateAndOpenNote(noteId)
                    }
                )
            }
        }
    }

    /**
     * Authenticate with biometrics before opening secured note
     */
    private fun authenticateAndOpenNote(noteId: Long) {
        when (biometricManager.isBiometricAvailable()) {
            BiometricAvailability.AVAILABLE -> {
                biometricManager.authenticate(
                    activity = this,
                    title = "Authenticate to View Note",
                    subtitle = "This note is protected",
                    description = "Use your biometric credential to access this secured note",
                    onSuccess = { result ->
                        // Authentication successful - open note
                        Toast.makeText(
                            this,
                            "Authentication successful! Opening note...",
                            Toast.LENGTH_SHORT
                        ).show()
                        // TODO: Navigate to note detail screen
                    },
                    onError = { errorCode, errString ->
                        Toast.makeText(
                            this,
                            "Authentication error: $errString",
                            Toast.LENGTH_SHORT
                        ).show()
                    },
                    onFailed = {
                        Toast.makeText(
                            this,
                            "Authentication failed",
                            Toast.LENGTH_SHORT
                        ).show()
                    }
                )
            }
            BiometricAvailability.NONE_ENROLLED -> {
                Toast.makeText(
                    this,
                    "No biometric enrolled. Please set up biometric authentication in settings.",
                    Toast.LENGTH_LONG
                ).show()
            }
            BiometricAvailability.NO_HARDWARE -> {
                Toast.makeText(
                    this,
                    "Biometric hardware not available",
                    Toast.LENGTH_SHORT
                ).show()
            }
            else -> {
                Toast.makeText(
                    this,
                    "Biometric authentication not available",
                    Toast.LENGTH_SHORT
                ).show()
            }
        }
    }
}

/**
 * Secure Note Screen Composable
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SecureNoteScreen(
    biometricManager: BiometricManager,
    onBiometricRequired: (Long) -> Unit,
    viewModel: SecureNoteViewModel = viewModel()
) {
    val notes by viewModel.notes.collectAsState(initial = emptyList())
    var showDialog by remember { mutableStateOf(false) }
    var noteTitle by remember { mutableStateOf("") }
    var noteContent by remember { mutableStateOf("") }
    var requiresBiometric by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Secure Notes") },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer
                )
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showDialog = true }
            ) {
                Text("+")
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
        ) {
            // Biometric status indicator
            BiometricStatusCard(biometricManager)

            Spacer(modifier = Modifier.height(16.dp))

            // Notes list
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(notes) { note ->
                    NoteCard(
                        note = note,
                        onClick = {
                            if (note.requiresBiometric) {
                                onBiometricRequired(note.id)
                            } else {
                                // Open note directly
                            }
                        },
                        onDelete = { viewModel.deleteNote(note.id) }
                    )
                }
            }
        }

        // Add note dialog
        if (showDialog) {
            AddNoteDialog(
                noteTitle = noteTitle,
                noteContent = noteContent,
                requiresBiometric = requiresBiometric,
                onTitleChange = { noteTitle = it },
                onContentChange = { noteContent = it },
                onBiometricChange = { requiresBiometric = it },
                onDismiss = {
                    showDialog = false
                    noteTitle = ""
                    noteContent = ""
                    requiresBiometric = false
                },
                onConfirm = {
                    viewModel.addNote(noteTitle, noteContent, requiresBiometric)
                    showDialog = false
                    noteTitle = ""
                    noteContent = ""
                    requiresBiometric = false
                }
            )
        }
    }
}

@Composable
fun BiometricStatusCard(biometricManager: BiometricManager) {
    val availability = biometricManager.isBiometricAvailable()
    val biometricType = biometricManager.getBiometricType()

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = if (availability == BiometricAvailability.AVAILABLE)
                MaterialTheme.colorScheme.primaryContainer
            else
                MaterialTheme.colorScheme.errorContainer
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = "Biometric Status",
                style = MaterialTheme.typography.titleMedium
            )
            Text(
                text = "Type: ${biometricType.name}",
                style = MaterialTheme.typography.bodyMedium
            )
            Text(
                text = "Status: ${availability.name}",
                style = MaterialTheme.typography.bodyMedium
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NoteCard(
    note: SecureNoteEntity,
    onClick: () -> Unit,
    onDelete: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        onClick = onClick
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = note.title,
                    style = MaterialTheme.typography.titleMedium
                )
                if (note.requiresBiometric) {
                    Text(
                        text = "🔒",
                        style = MaterialTheme.typography.titleMedium
                    )
                }
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = if (note.requiresBiometric) "Protected content" else note.content,
                style = MaterialTheme.typography.bodyMedium,
                maxLines = 2
            )
            Text(
                text = "Encrypted: ${note.isEncrypted}",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.secondary
            )
        }
    }
}

@Composable
fun AddNoteDialog(
    noteTitle: String,
    noteContent: String,
    requiresBiometric: Boolean,
    onTitleChange: (String) -> Unit,
    onContentChange: (String) -> Unit,
    onBiometricChange: (Boolean) -> Unit,
    onDismiss: () -> Unit,
    onConfirm: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Add Secure Note") },
        text = {
            Column {
                OutlinedTextField(
                    value = noteTitle,
                    onValueChange = onTitleChange,
                    label = { Text("Title") },
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(
                    value = noteContent,
                    onValueChange = onContentChange,
                    label = { Text("Content") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 3
                )
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("Require Biometric")
                    Switch(
                        checked = requiresBiometric,
                        onCheckedChange = onBiometricChange
                    )
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onConfirm) {
                Text("Add")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

/**
 * ViewModel for Secure Notes
 */
class SecureNoteViewModel @javax.inject.Inject constructor(
    private val repository: com.hakounamatata.data.repository.SecureNoteRepository
) : androidx.lifecycle.ViewModel() {

    val notes = repository.getAllNotes()

    fun addNote(title: String, content: String, requiresBiometric: Boolean) {
        androidx.lifecycle.viewModelScope.launch {
            repository.saveNote(
                title = title,
                content = content,
                requiresBiometric = requiresBiometric,
                encryptionKey = if (requiresBiometric) "secure-key" else null
            )
        }
    }

    fun deleteNote(noteId: Long) {
        androidx.lifecycle.viewModelScope.launch {
            repository.deleteNote(noteId)
        }
    }
}
