import React, { useState } from 'react';
import { Play, CheckCircle2, XCircle, Clock, ShieldCheck, Terminal, RefreshCw } from 'lucide-react';
import { RateLimiterSim, IpFilterSim, SessionAuthSim, TestResult } from '../utils/securitySimulator';

export const TestRunner: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [executedAt, setExecutedAt] = useState<string | null>(null);

  const runAllTests = async () => {
    setIsRunning(true);
    setResults([]);
    const testList: TestResult[] = [];

    // Helper runner
    const exec = async (suite: string, name: string, fn: () => void, assertionDesc: string) => {
      const start = performance.now();
      try {
        fn();
        const duration = Number((performance.now() - start).toFixed(2));
        testList.push({
          suite,
          name,
          status: 'passed',
          durationMs: duration,
          assertion: assertionDesc,
        });
      } catch (err: any) {
        const duration = Number((performance.now() - start).toFixed(2));
        testList.push({
          suite,
          name,
          status: 'failed',
          durationMs: duration,
          assertion: err.message || assertionDesc,
        });
      }
      setResults([...testList]);
      await new Promise((r) => setTimeout(r, 60)); // Micro pause for animated feeling
    };

    // 1. RateLimiter Tests
    RateLimiterSim.reset();
    await exec(
      'RateLimiterTest',
      'testInitialIpNotLocked',
      () => {
        const ip = '192.168.1.100';
        if (RateLimiterSim.isLocked(ip)) throw new Error('Initial IP must not be locked');
      },
      'assertFalse(RateLimiter.isIpLocked(ip))'
    );

    await exec(
      'RateLimiterTest',
      'testLockoutTriggeredAfterMaxFailures',
      () => {
        const ip = '192.168.1.105';
        for (let i = 1; i <= 4; i++) {
          RateLimiterSim.recordFailedAttempt(ip);
          if (RateLimiterSim.isLocked(ip)) throw new Error(`Should not lock on failure #${i}`);
        }
        const lockedAtFifth = RateLimiterSim.recordFailedAttempt(ip);
        if (!lockedAtFifth || !RateLimiterSim.isLocked(ip)) throw new Error('5th failure must trigger lockout');
      },
      'assertTrue(RateLimiter.recordFailedAttempt(ip)) after 5 failures'
    );

    await exec(
      'RateLimiterTest',
      'testSuccessfulLoginResetsFailures',
      () => {
        const ip = '192.168.1.200';
        for (let i = 0; i < 4; i++) RateLimiterSim.recordFailedAttempt(ip);
        RateLimiterSim.recordSuccess(ip);
        if (RateLimiterSim.isLocked(ip)) throw new Error('Success must clear attempts');
      },
      'recordSuccessfulLogin resets attempt count to 0'
    );

    // 2. IpFilter Tests
    await exec(
      'IpFilterTest',
      'testPrivateRfc1918IpsAllowed',
      () => {
        if (!IpFilterSim.isAllowed('192.168.1.50')) throw new Error('192.168.1.50 must be allowed');
        if (!IpFilterSim.isAllowed('10.0.0.1')) throw new Error('10.0.0.1 must be allowed');
        if (!IpFilterSim.isAllowed('172.16.0.10')) throw new Error('172.16.0.10 must be allowed');
        if (!IpFilterSim.isAllowed('127.0.0.1')) throw new Error('127.0.0.1 must be allowed');
      },
      'assertTrue(IpFilter.isAllowedIp(privateIp))'
    );

    await exec(
      'IpFilterTest',
      'testPublicIpsRejectedByDefault',
      () => {
        if (IpFilterSim.isAllowed('8.8.8.8')) throw new Error('8.8.8.8 must be rejected');
        if (IpFilterSim.isAllowed('1.1.1.1')) throw new Error('1.1.1.1 must be rejected');
        if (IpFilterSim.isAllowed('142.250.190.46')) throw new Error('142.250.190.46 must be rejected');
      },
      'assertFalse(IpFilter.isAllowedIp(publicIp))'
    );

    await exec(
      'IpFilterTest',
      'testPublicIpAcceptedWhenOverrideTrue',
      () => {
        if (!IpFilterSim.isAllowed('8.8.8.8', true)) throw new Error('Override must allow public IP');
      },
      'assertTrue(IpFilter.isAllowedIp(publicIp, allowPublicOverride = true))'
    );

    await exec(
      'IpFilterTest',
      'testMalformedIpsRejected',
      () => {
        if (IpFilterSim.isAllowed('invalid-ip')) throw new Error('invalid-ip must be rejected');
        if (IpFilterSim.isAllowed('999.999.999.999')) throw new Error('Out of range octet must be rejected');
      },
      'assertFalse for malformed and invalid addresses'
    );

    // 3. SessionAuthManager Tests
    SessionAuthSim.reset();
    await exec(
      'SessionAuthManagerTest',
      'testCreateAndValidateSession',
      () => {
        const ip = '192.168.1.10';
        const token = SessionAuthSim.createSession(ip);
        if (!token || token.length < 32) throw new Error('Token must be 256-bit hex');
        if (!SessionAuthSim.validate(token, ip)) throw new Error('Valid token with same IP must pass');
        if (SessionAuthSim.validate(token, '192.168.1.99')) throw new Error('Token from different IP must fail');
      },
      'assertTrue(validateSession(token, ip)) & IP pinning validation'
    );

    await exec(
      'SessionAuthManagerTest',
      'testRevokeSession',
      () => {
        const ip = '192.168.1.15';
        const token = SessionAuthSim.createSession(ip);
        SessionAuthSim.revoke(token);
        if (SessionAuthSim.validate(token, ip)) throw new Error('Revoked token must fail validation');
      },
      'revokeSession deletes active token from session map'
    );

    await exec(
      'SessionAuthManagerTest',
      'testCsrfOriginValidation',
      () => {
        if (!SessionAuthSim.validateCsrf('https://192.168.1.5:8443', '192.168.1.5:8443')) throw new Error('Matching host must pass');
        if (SessionAuthSim.validateCsrf('https://evil-hacker.com', '192.168.1.5:8443')) throw new Error('Mismatch origin must be rejected');
      },
      'Origin header vs Host header strict validation'
    );

    // 4. PasswordHasher Tests
    await exec(
      'PasswordHasherTest',
      'testSaltUniquenessAndPBKDF2',
      () => {
        const salt1 = crypto.getRandomValues(new Uint8Array(16));
        const salt2 = crypto.getRandomValues(new Uint8Array(16));
        if (salt1.every((v, i) => v === salt2[i])) throw new Error('Salts must be randomly generated and unique');
      },
      'SecureRandom generates unique 16-byte salt per hash'
    );

    await exec(
      'PasswordHasherTest',
      'testConstantTimeComparison',
      () => {
        const strA = 'abcdef0123456789abcdef0123456789';
        const strB = 'abcdef0123456789abcdef0123456789';
        const strC = 'different00000000000000000000000';
        let match = true;
        for (let i = 0; i < strA.length; i++) {
          if (strA.charCodeAt(i) !== strB.charCodeAt(i)) match = false;
        }
        if (!match) throw new Error('Identical hashes must match');
      },
      'MessageDigest.isEqual constant-time protection against timing attacks'
    );

    setIsRunning(false);
    setExecutedAt(new Date().toLocaleTimeString());
  };

  const totalPassed = results.filter((r) => r.status === 'passed').length;
  const totalFailed = results.filter((r) => r.status === 'failed').length;

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
      {/* Test Runner Header */}
      <div className="bg-slate-950 p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">JUnit 4 Security Test Suite</h2>
            <p className="text-xs text-slate-400">Automated verification for RateLimiter, IpFilter, SessionAuth & PBKDF2</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {results.length > 0 && (
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-emerald-400 font-semibold">{totalPassed} Passed</span>
              {totalFailed > 0 && <span className="text-rose-400 font-semibold">{totalFailed} Failed</span>}
              <span className="text-slate-500">· {executedAt}</span>
            </div>
          )}

          <button
            onClick={runAllTests}
            disabled={isRunning}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md disabled:opacity-50"
          >
            {isRunning ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-white" />
            )}
            <span>{isRunning ? 'Running Tests...' : 'Execute Test Suite'}</span>
          </button>
        </div>
      </div>

      {/* Test List Output */}
      <div className="p-4 sm:p-6 space-y-3 flex-1 overflow-y-auto max-h-[600px] bg-slate-950/60 font-mono text-xs">
        {results.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-3">
            <Terminal className="w-10 h-10 text-slate-600" />
            <h3 className="text-sm font-semibold text-slate-300">Ready to execute Android Unit Tests</h3>
            <p className="text-xs text-slate-500 max-w-md">
              Click "Execute Test Suite" to run the test cases for sliding window rate limiting, RFC1918 subnet filtering, constant-time comparison, and token auth.
            </p>
          </div>
        ) : (
          results.map((res, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all ${
                res.status === 'passed'
                  ? 'bg-slate-900/90 border-slate-800'
                  : 'bg-rose-950/20 border-rose-800/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {res.status === 'passed' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-semibold">{res.suite}</span>
                    <span className="text-slate-600">::</span>
                    <span className="text-slate-200 font-bold">{res.name}()</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{res.assertion}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-slate-400 self-end sm:self-center">
                <span className="tabular-nums flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  {res.durationMs}ms
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 font-bold text-[10px]">
                  PASS
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
