(function (window) {
  'use strict';

  // Constructor function (ES5)
  function DDWDispatchTimer(opts) {
    opts = opts || {};

    // Holiday list (local dates) - keep/update as needed
    this.holidays = opts.holidays || [
      new Date(2025, 3, 18), new Date(2025, 3, 21), new Date(2025, 4, 5),
      new Date(2025, 4, 26), new Date(2025, 7, 25), new Date(2025, 11, 24),
      new Date(2025, 11, 25), new Date(2025, 11, 26), new Date(2025, 11, 31),
      new Date(2026, 0, 1), new Date(2026, 3, 3), new Date(2026, 3, 6),
      new Date(2026, 4, 4), new Date(2026, 4, 25), new Date(2026, 7, 31),
      new Date(2026, 11, 24), new Date(2026, 11, 25), new Date(2026, 11, 28)
    ];

    // Flat customer-facing lead time window
    this.courierMin = typeof opts.courierMin === 'number' ? opts.courierMin : 4;
    this.courierMax = typeof opts.courierMax === 'number' ? opts.courierMax : 6;

    // DOM ids / selectors
    this.selectors = {
      countdown: opts.countdownId || 'express-timer',
      estimateShort: opts.estimateId || 'standard-delivery-estimate',
      dispatchDate: opts.dispatchDateId || 'dispatch-date',
      timerDeliveryEstimate: opts.timerDeliveryEstimateId || 'timer-delivery-estimate',
      estimateAccordion: opts.estimateAccordionId || 'ddw-estimate-accordion',
      trackedNote: opts.trackedNoteId || 'ddw-tracked-note'
    };

    // Whether to automatically show a tracked-note when lead-time >= threshold (business days)
    this.trackedThreshold = typeof opts.trackedThreshold === 'number' ? opts.trackedThreshold : 2;

    // Interval handles
    this._interval = null;
  }

  // ---------- helpers ----------
  DDWDispatchTimer.prototype._isSameDate = function(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  };

  DDWDispatchTimer.prototype._isHoliday = function(date) {
    var self = this;
    for (var i = 0; i < self.holidays.length; i++) {
      if (self._isSameDate(self.holidays[i], date)) return true;
    }
    return false;
  };

  DDWDispatchTimer.prototype._isBusinessDay = function(date) {
    var dow = date.getDay(); // 0 Sun .. 6 Sat
    return dow > 0 && dow < 6 && !this._isHoliday(date);
  };

  DDWDispatchTimer.prototype._nextBusinessDay = function(date) {
    var nd = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    nd.setDate(nd.getDate() + 1);
    while (!this._isBusinessDay(nd)) {
      nd.setDate(nd.getDate() + 1);
    }
    return nd;
  };

  DDWDispatchTimer.prototype._toDateOnly = function(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  };

  DDWDispatchTimer.prototype._ensureBusinessDay = function(date) {
    var d = this._toDateOnly(date);
    while (!this._isBusinessDay(d)) {
      d.setDate(d.getDate() + 1);
    }
    return d;
  };

  // Add n business days to a date (n >= 0)
  DDWDispatchTimer.prototype._addBusinessDays = function(date, n) {
    var result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    while (n > 0) {
      result.setDate(result.getDate() + 1);
      if (this._isBusinessDay(result)) n--;
    }
    return result;
  };

  // Format friendly UK date, e.g. "Wed 6 Mar"
  DDWDispatchTimer.prototype._formatNice = function(date) {
    try {
      return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    } catch (e) {
      // fallback
      return date.getDate() + '/' + (date.getMonth()+1) + '/' + date.getFullYear();
    }
  };

  // Format countdown with seconds
  DDWDispatchTimer.prototype._formatCountdown = function(ms) {
    if (ms <= 0) return '00s';
    var s = Math.floor(ms / 1000);
    var days = Math.floor(s / 86400);
    s = s % 86400;
    var hh = Math.floor(s / 3600);
    s = s % 3600;
    var mm = Math.floor(s / 60);
    var ss = s % 60;
    function pad(n){ return (n < 10 ? '0' : '') + n; }

    if (days > 0) return days + 'd ' + pad(hh) + 'h ' + pad(mm) + 'm ' + pad(ss) + 's';
    if (hh > 0) return hh + 'h ' + pad(mm) + 'm ' + pad(ss) + 's';
    return mm + 'm ' + pad(ss) + 's';
  };

  // ---------- core logic ----------
  // Daily customer-facing cutoff is 9:00 PM local time
  DDWDispatchTimer.prototype.getCurrentCutoff = function(now) {
    now = now || new Date();
    var cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 21, 0, 0, 0);

    if (now.getTime() < cutoff.getTime()) return cutoff;

    cutoff.setDate(cutoff.getDate() + 1);
    return cutoff;
  };

  DDWDispatchTimer.prototype.getOrderBaseDate = function(now) {
    now = now || new Date();
    var cutoffToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 21, 0, 0, 0);
    var base = this._toDateOnly(now);

    if (now.getTime() >= cutoffToday.getTime()) {
      base.setDate(base.getDate() + 1);
    }

    return this._ensureBusinessDay(base);
  };

  // ---------- DOM update ----------
  DDWDispatchTimer.prototype._updateDOM = function() {
    var now = new Date();
    var orderBaseDate = this.getOrderBaseDate(now);

    var deliveryStart = this._addBusinessDays(orderBaseDate, this.courierMin);
    var deliveryEnd = this._addBusinessDays(orderBaseDate, this.courierMax);

    var estimateText = this.courierMin + '–' + this.courierMax + ' working days';
    var estimateDatesText = this._formatNice(deliveryStart) + ' - ' + this._formatNice(deliveryEnd);

    // get cutoff for countdown
    var cutoff = this.getCurrentCutoff(now);
    var millis = cutoff.getTime() - now.getTime();

    // DOM elements (graceful)
    var countdownEl = document.getElementById(this.selectors.countdown) || document.getElementById('ddw-countdown');
    var estimateShortEl = document.getElementById(this.selectors.estimateShort) || document.getElementById('ddw-estimate');
    var timerDeliveryEstimateEl = document.getElementById(this.selectors.timerDeliveryEstimate);
    var estimateAccordionEl = document.getElementById(this.selectors.estimateAccordion);
    var trackedNoteEl = document.getElementById(this.selectors.trackedNote);

    if (countdownEl) countdownEl.textContent = this._formatCountdown(millis);
    if (estimateShortEl) estimateShortEl.textContent = estimateText;
    if (timerDeliveryEstimateEl) timerDeliveryEstimateEl.textContent = estimateDatesText;
    if (estimateAccordionEl) estimateAccordionEl.textContent = estimateText + ' (' + estimateDatesText + ')';
    if (trackedNoteEl) {
      if (this.courierMin >= this.trackedThreshold) {
        trackedNoteEl.style.display = '';
      } else {
        trackedNoteEl.style.display = 'none';
      }
    }
  };

  // Start the periodic updates
  DDWDispatchTimer.prototype.startTimer = function() {
    var self = this;
    // avoid double intervals
    if (self._interval) return;

    // initial attempt: if DOM not ready, wait and retry once
    function initOnce() {
      // If the primary elements aren't present, we still want to start but we will keep retrying
      // _updateDOM is safe to call even if elements are missing
      self._updateDOM();
      // refresh every second (countdown); coarse date updates also run each second but are cheap
      self._interval = setInterval(function() { self._updateDOM(); }, 1000);
    }

    // If DOM already ready
    if (document.readyState === 'interactive' || document.readyState === 'complete') {
      initOnce();
    } else {
      document.addEventListener('DOMContentLoaded', initOnce);
    }
  };

  // Stop timer (if needed)
  DDWDispatchTimer.prototype.stopTimer = function() {
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }
  };

  // ---------- attach to window ----------
  window.DDWDispatchTimer = DDWDispatchTimer;

  // create singleton if not present and auto-start
  try {
    if (!window.dispatchTimer) {
      window.dispatchTimer = new DDWDispatchTimer();
      // auto-start by default
      if (typeof window.dispatchTimer.startTimer === 'function') {
        window.dispatchTimer.startTimer();
      }
    }
  } catch (e) {
    // fail silently - we don't want to break page rendering
    /* eslint-disable no-console */
    if (window.console && window.console.error) window.console.error('DDWDispatchTimer init failed', e);
    /* eslint-enable no-console */
  }

}(window));

var dispatchTimerSingleton = window.dispatchTimer;

if (!dispatchTimerSingleton && typeof window.DDWDispatchTimer === 'function') {
  dispatchTimerSingleton = new window.DDWDispatchTimer();
  window.dispatchTimer = dispatchTimerSingleton;
}

export default dispatchTimerSingleton;