/**
 * Polls the component data while the page is open.
 *
 * The component provides a refresh() method returning a promise. It is
 * called again intervalMs after the previous call has settled, so slow
 * responses never pile up, and a refresh asked for while another one is
 * running joins the running one. Polling pauses while the browser tab is
 * hidden and refreshes at once when the tab is shown again. A `now`
 * timestamp is kept up to date for "N min ago" labels. Every timer is
 * cleared when the component is unmounted.
 *
 * Timer handles are kept as plain (non-reactive) instance properties.
 *
 * @param {Number} intervalMs - Delay between two refreshes, ms.
 * @returns {Object} Vue mixin.
 */
export function autoRefreshMixin(intervalMs) {
  const CLOCK_INTERVAL_MS = 10 * 1000

  return {
    data() {
      return {
        autoRefreshEnabled: true,
        now: Date.now(),
      }
    },
    mounted() {
      this.autoRefreshTimerId = null
      this.autoRefreshInFlight = null
      this.autoRefreshStopped = false
      this.clockTimerId = setInterval(() => {
        this.now = Date.now()
      }, CLOCK_INTERVAL_MS)
      document.addEventListener(
        'visibilitychange',
        this.onAutoRefreshVisibilityChange
      )
      this.refreshNow()
    },
    beforeUnmount() {
      this.autoRefreshStopped = true
      this.cancelAutoRefresh()
      clearInterval(this.clockTimerId)
      this.clockTimerId = null
      document.removeEventListener(
        'visibilitychange',
        this.onAutoRefreshVisibilityChange
      )
    },
    watch: {
      autoRefreshEnabled(enabled) {
        if (enabled) {
          this.refreshNow()
        } else {
          this.cancelAutoRefresh()
        }
      },
    },
    methods: {
      /* Refreshes at once and restarts the countdown. */
      refreshNow() {
        if (this.autoRefreshInFlight) {
          return this.autoRefreshInFlight
        }
        this.cancelAutoRefresh()
        this.now = Date.now()
        this.autoRefreshInFlight = Promise.resolve()
          .then(() => this.refresh())
          .catch(() => {})
          .finally(() => {
            this.autoRefreshInFlight = null
            this.now = Date.now()
            this.scheduleAutoRefresh()
          })
        return this.autoRefreshInFlight
      },
      scheduleAutoRefresh() {
        this.cancelAutoRefresh()
        if (
          this.autoRefreshStopped ||
          !this.autoRefreshEnabled ||
          document.hidden
        ) {
          return
        }
        this.autoRefreshTimerId = setTimeout(() => {
          this.autoRefreshTimerId = null
          this.refreshNow()
        }, intervalMs)
      },
      cancelAutoRefresh() {
        if (this.autoRefreshTimerId) {
          clearTimeout(this.autoRefreshTimerId)
          this.autoRefreshTimerId = null
        }
      },
      onAutoRefreshVisibilityChange() {
        if (document.hidden) {
          this.cancelAutoRefresh()
        } else if (this.autoRefreshEnabled) {
          this.refreshNow()
        }
      },
    },
  }
}
