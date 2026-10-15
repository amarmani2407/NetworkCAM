package com.localcam.streamer.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.localcam.streamer.security.KeystoreManager
import com.localcam.streamer.ui.MainViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsBottomSheet(
    viewModel: MainViewModel,
    onDismiss: () -> Unit
) {
    var newPassword by remember { mutableStateOf("") }
    var passwordError by remember { mutableStateOf<String?>(null) }
    var audioEnabled by remember { mutableStateOf(KeystoreManager.isAudioEnabled()) }
    var allowPublicIps by remember { mutableStateOf(KeystoreManager.isAllowPublicIps()) }
    var port by remember { mutableStateOf(KeystoreManager.getServerPort().toString()) }

    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = "Security & Stream Settings",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )

            // Password Change
            OutlinedTextField(
                value = newPassword,
                onValueChange = {
                    newPassword = it
                    passwordError = null
                },
                label = { Text("Change Device Password (Min 10 chars)") },
                modifier = Modifier.fillMaxWidth(),
                isError = passwordError != null,
                supportingText = { passwordError?.let { Text(it) } }
            )

            Button(
                onClick = {
                    if (newPassword.length < 10) {
                        passwordError = "Password must be at least 10 characters"
                    } else {
                        viewModel.updatePassword(newPassword)
                        newPassword = ""
                        passwordError = "Password updated successfully!"
                    }
                },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Update Password")
            }

            Divider()

            // Server Port
            OutlinedTextField(
                value = port,
                onValueChange = { port = it },
                label = { Text("HTTPS Port (Default: 8443)") },
                modifier = Modifier.fillMaxWidth()
            )

            // Audio Stream Toggle
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text("Microphone Audio Stream", fontWeight = FontWeight.SemiBold)
                    Text(
                        "Stream live microphone PCM audio over WAV stream",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.outline
                    )
                }
                Switch(
                    checked = audioEnabled,
                    onCheckedChange = {
                        audioEnabled = it
                        KeystoreManager.setAudioEnabled(it)
                    }
                )
            }

            // Public IP Warning Toggle
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text("Allow Public Network IPs", fontWeight = FontWeight.SemiBold)
                    Text(
                        "WARNING: Allows connections from outside RFC1918 private subnets.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.error
                    )
                }
                Switch(
                    checked = allowPublicIps,
                    onCheckedChange = {
                        allowPublicIps = it
                        KeystoreManager.setAllowPublicIps(it)
                    }
                )
            }

            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}
