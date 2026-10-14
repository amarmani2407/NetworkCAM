package com.localcam.streamer.security

import java.net.InetAddress

object IpFilter {

    /**
     * Checks if an IP is within private/local network ranges:
     * - RFC1918: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
     * - Loopback: 127.0.0.0/8, ::1
     * - Link-local: 169.254.0.0/16, fe80::/10
     */
    fun isAllowedIp(ipAddressString: String, allowPublicOverride: Boolean = false): Boolean {
        if (allowPublicOverride) return true
        if (ipAddressString.isBlank()) return false

        return try {
            val address = InetAddress.getByName(ipAddressString)
            isPrivateOrLocal(address)
        } catch (e: Exception) {
            false
        }
    }

    fun isPrivateOrLocal(address: InetAddress): Boolean {
        if (address.isLoopbackAddress) return true
        if (address.isLinkLocalAddress) return true
        if (address.isSiteLocalAddress) return true

        // Explicit check for IPv4 RFC1918 in case siteLocal has platform quirks
        val bytes = address.address
        if (bytes.size == 4) {
            val b0 = bytes[0].toInt() and 0xFF
            val b1 = bytes[1].toInt() and 0xFF

            // 10.0.0.0/8
            if (b0 == 10) return true

            // 172.16.0.0/12 (172.16.x.x - 172.31.x.x)
            if (b0 == 172 && (b1 in 16..31)) return true

            // 192.168.0.0/16
            if (b0 == 192 && b1 == 168) return true

            // 127.0.0.0/8
            if (b0 == 127) return true

            // 169.254.0.0/16 (Link Local)
            if (b0 == 169 && b1 == 254) return true
        }

        return false
    }
}
