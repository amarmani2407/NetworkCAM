package com.localcam.streamer

import com.localcam.streamer.security.IpFilter
import org.junit.Assert.*
import org.junit.Test

class IpFilterTest {

    @Test
    fun testPrivateRfc1918IpsAllowed() {
        assertTrue("192.168.1.50 should be allowed", IpFilter.isAllowedIp("192.168.1.50"))
        assertTrue("10.0.0.1 should be allowed", IpFilter.isAllowedIp("10.0.0.1"))
        assertTrue("172.16.0.10 should be allowed", IpFilter.isAllowedIp("172.16.0.10"))
        assertTrue("172.31.255.255 should be allowed", IpFilter.isAllowedIp("172.31.255.255"))
        assertTrue("127.0.0.1 should be allowed", IpFilter.isAllowedIp("127.0.0.1"))
    }

    @Test
    fun testPublicIpsRejectedByDefault() {
        assertFalse("8.8.8.8 (Google DNS) should be rejected", IpFilter.isAllowedIp("8.8.8.8"))
        assertFalse("1.1.1.1 (Cloudflare) should be rejected", IpFilter.isAllowedIp("1.1.1.1"))
        assertFalse("142.250.190.46 should be rejected", IpFilter.isAllowedIp("142.250.190.46"))
        assertFalse("172.32.0.1 should be rejected (out of RFC1918)", IpFilter.isAllowedIp("172.32.0.1"))
    }

    @Test
    fun testPublicIpAcceptedWhenOverrideTrue() {
        assertTrue(
            "Public IP allowed when explicit override is set",
            IpFilter.isAllowedIp("8.8.8.8", allowPublicOverride = true)
        )
    }

    @Test
    fun testMalformedIpsRejected() {
        assertFalse(IpFilter.isAllowedIp("invalid-ip"))
        assertFalse(IpFilter.isAllowedIp(""))
        assertFalse(IpFilter.isAllowedIp("999.999.999.999"))
    }
}
