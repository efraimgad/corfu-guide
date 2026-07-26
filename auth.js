        // --- Upgrade-session banner + modal (Step 1.2) -------------------
        // Shows a "save your data permanently" prompt only after actually
        // confirming (via database.js) that the current Supabase session is
        // anonymous - never assumed, and never shown again this browser
        // session once dismissed or once an email link has been sent.
        const UPGRADE_DISMISS_KEY = 'corfu-guide-upgrade-dismissed';
        let upgradeSessionTriggerEl = null;

        async function initUpgradeSessionBanner() {
            if (typeof isAnonymousSession !== 'function') return; // SDK not loaded/blocked
            if (sessionStorage.getItem(UPGRADE_DISMISS_KEY)) return;
            const banner = document.getElementById('upgrade-session-banner');
            if (!banner) return;
            try {
                const anonymous = await isAnonymousSession();
                banner.style.display = anonymous ? 'flex' : 'none';
            } catch (e) {
                // Offline or Supabase unreachable: leave it hidden rather
                // than guessing at the account's real auth state.
                banner.style.display = 'none';
            }
        }

        function dismissUpgradeSessionBanner() {
            const banner = document.getElementById('upgrade-session-banner');
            if (banner) banner.style.display = 'none';
            sessionStorage.setItem(UPGRADE_DISMISS_KEY, 'true');
        }

        function openUpgradeSessionModal() {
            upgradeSessionTriggerEl = document.activeElement;
            document.getElementById('upgrade-session-error').classList.add('hidden');
            document.getElementById('upgrade-session-success').classList.add('hidden');
            document.getElementById('upgrade-session-email').value = '';
            document.getElementById('upgrade-session-backdrop').classList.remove('hidden');
            document.body.classList.add('modal-open');
            document.getElementById('upgrade-session-email').focus();
        }

        function closeUpgradeSessionModal() {
            document.getElementById('upgrade-session-backdrop').classList.add('hidden');
            document.body.classList.remove('modal-open');
            if (upgradeSessionTriggerEl) upgradeSessionTriggerEl.focus();
        }

        async function submitUpgradeSession() {
            const emailInput = document.getElementById('upgrade-session-email');
            const errorEl = document.getElementById('upgrade-session-error');
            const successEl = document.getElementById('upgrade-session-success');
            const submitBtn = document.getElementById('upgrade-session-submit-btn');
            const email = emailInput.value.trim();

            errorEl.classList.add('hidden');
            if (!email || !email.includes('@')) {
                errorEl.textContent = 'נא להזין כתובת דוא"ל תקינה.';
                errorEl.classList.remove('hidden');
                return;
            }
            if (typeof upgradeSessionWithEmail !== 'function') {
                errorEl.textContent = 'השירות אינו זמין כרגע. נסו שוב מאוחר יותר.';
                errorEl.classList.remove('hidden');
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = 'שולח...';
            try {
                await upgradeSessionWithEmail(email);
                successEl.classList.remove('hidden');
                dismissUpgradeSessionBanner();
                setTimeout(closeUpgradeSessionModal, 2500);
            } catch (e) {
                errorEl.textContent = 'לא הצלחנו לשלוח את הקישור. בדקו את החיבור לאינטרנט ונסו שוב.';
                errorEl.classList.remove('hidden');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'שליחת קישור';
            }
        }
