package com.localcam.streamer.ui.screens

import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.res.stringResource
import com.localcam.streamer.R

@Composable
fun PrivacyNoticeDialog(onDismiss: () -> Unit) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(stringResource(R.string.privacy_title)) },
        text = { Text(stringResource(R.string.privacy_body)) },
        confirmButton = {
            Button(onClick = onDismiss) {
                Text("I Understand & Accept")
            }
        }
    )
}
