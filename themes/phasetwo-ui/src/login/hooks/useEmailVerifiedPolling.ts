import { useEffect, useMemo, useState } from "react";
import { useRealmBasePath } from "./useDynamicCss";

/** Provider id of the realm resource in this repo's broker-email-linker module. */
const STATUS_PATH = "petsapp-verify-email/status";
const POLL_INTERVAL_MS = 4000;
const MAX_CONSECUTIVE_ERRORS = 3;

/**
 * Reads the client id and tab id that identify which authentication session the
 * status endpoint should answer for. loginAction carries both on every page of
 * the flow; window.location is the fallback.
 */
function readFlowParams(
    loginAction: string | undefined,
): { clientId: string; tabId: string } | undefined {
    for (const source of [loginAction, window.location.search]) {
        if (!source) continue;

        const queryStart = source.indexOf("?");
        const query = (
            queryStart >= 0 ? source.slice(queryStart + 1) : source
        ).replace(/&amp;/g, "&");

        const params = new URLSearchParams(query);
        const clientId = params.get("client_id");
        const tabId = params.get("tab_id");

        if (clientId && tabId) return { clientId, tabId };
    }

    return undefined;
}

/**
 * Polls the realm status endpoint while the user waits for the verification
 * email, and reloads once the address has been confirmed.
 *
 * The reload is what completes the login: re-requesting the required action URL
 * makes Keycloak's VerifyEmail action see the verified user, call success(), and
 * redirect to the client. Polling only exists so that navigation happens once,
 * at the end, instead of every few seconds.
 *
 * Returns whether verification has been observed, so the page can say so during
 * the moment between the successful poll and the redirect.
 */
export function useEmailVerifiedPolling(kcContext: {
    realm: { name: string };
    url: {
        resourcesPath?: string;
        loginAction?: string;
    };
}): boolean {
    const basePath = useRealmBasePath(kcContext);
    const { loginAction } = kcContext.url;

    const statusUrl = useMemo(() => {
        const flowParams = readFlowParams(loginAction);
        if (!flowParams) return undefined;

        const query = new URLSearchParams({
            client_id: flowParams.clientId,
            tab_id: flowParams.tabId,
        });

        return `${basePath}/${STATUS_PATH}?${query}`;
    }, [basePath, loginAction]);

    const [verified, setVerified] = useState(false);

    useEffect(() => {
        if (!statusUrl) return;

        let stopped = false;
        let consecutiveErrors = 0;
        let timeoutId: number | undefined;

        const stop = () => {
            stopped = true;
            window.clearTimeout(timeoutId);
        };

        const poll = async () => {
            let emailVerified: boolean;

            try {
                const response = await fetch(statusUrl, {
                    credentials: "same-origin",
                    headers: { Accept: "application/json" },
                });

                // 404 means the authentication session is gone or this tab could
                // not be resolved. Retrying cannot change that, so give up and
                // leave the user with the resend link.
                if (response.status === 404) return stop();

                if (!response.ok) throw new Error(`HTTP ${response.status}`);

                emailVerified = (await response.json()).emailVerified === true;
                consecutiveErrors = 0;
            } catch {
                // Tolerate a blip, but stop before turning a sustained outage
                // into an indefinite request loop.
                if (++consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) return stop();
                schedule();
                return;
            }

            if (stopped) return;

            if (emailVerified) {
                stop();
                setVerified(true);
                window.location.reload();
                return;
            }

            schedule();
        };

        const schedule = () => {
            if (stopped) return;
            timeoutId = window.setTimeout(() => void poll(), POLL_INTERVAL_MS);
        };

        // Browsers throttle timers in hidden tabs to roughly one minute, and the
        // user is expected to be away in their mail client, so poll immediately
        // on return rather than waiting out a throttled interval.
        const onVisibilityChange = () => {
            if (stopped || document.visibilityState !== "visible") return;
            window.clearTimeout(timeoutId);
            void poll();
        };

        document.addEventListener("visibilitychange", onVisibilityChange);
        schedule();

        return () => {
            stop();
            document.removeEventListener("visibilitychange", onVisibilityChange);
        };
    }, [statusUrl]);

    return verified;
}
