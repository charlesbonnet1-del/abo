/**
 * Abo Analytics SDK - Browser
 * Tracking comportemental pour les agents IA d'Abo.
 *
 * Usage:
 *   <script src="https://votre-app.com/abo-analytics.js"></script>
 *   <script>
 *     AboAnalytics.init({ apiKey: 'abo_sk_...' });
 *     // Optionnel: identifier l'utilisateur
 *     AboAnalytics.identify({ email: 'user@example.com' });
 *   </script>
 */
(function (window) {
  'use strict';

  var API_ENDPOINT = '/api/sdk/events';
  var BATCH_INTERVAL = 5000; // 5 seconds
  var MAX_BATCH_SIZE = 50;
  var SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  var STORAGE_KEY = 'abo_analytics';
  var VISITOR_KEY = 'abo_visitor_id';

  var config = {
    apiKey: null,
    endpoint: null,
    autoTrack: true,
    trackPageViews: true,
    trackClicks: true,
    trackScroll: true,
    trackSessions: true,
    debug: false,
  };

  var state = {
    initialized: false,
    identity: {},
    visitorId: null,
    sessionId: null,
    sessionStart: null,
    queue: [],
    timer: null,
    maxScrollDepth: 0,
    lastActivity: null,
  };

  // ── Utilities ──

  function generateId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function getVisitorId() {
    try {
      var id = localStorage.getItem(VISITOR_KEY);
      if (!id) {
        id = 'v_' + generateId();
        localStorage.setItem(VISITOR_KEY, id);
      }
      return id;
    } catch (e) {
      return 'v_' + generateId();
    }
  }

  function getSessionId() {
    try {
      var stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
      var now = Date.now();

      if (stored.sessionId && stored.lastActivity && now - stored.lastActivity < SESSION_TIMEOUT) {
        state.sessionId = stored.sessionId;
        state.sessionStart = stored.sessionStart;
      } else {
        state.sessionId = 's_' + generateId();
        state.sessionStart = now;
        trackEvent('session_start', null, {});
      }

      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          sessionId: state.sessionId,
          sessionStart: state.sessionStart,
          lastActivity: now,
        })
      );

      return state.sessionId;
    } catch (e) {
      state.sessionId = 's_' + generateId();
      return state.sessionId;
    }
  }

  function updateActivity() {
    state.lastActivity = Date.now();
    try {
      var stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
      stored.lastActivity = state.lastActivity;
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    } catch (e) {
      // ignore
    }
  }

  function getDevice() {
    var ua = navigator.userAgent || '';
    var isMobile = /Mobi|Android|iPhone|iPad/i.test(ua);
    var isTablet = /iPad|Android(?!.*Mobi)/i.test(ua);

    var browser = 'Unknown';
    if (/Firefox/i.test(ua)) browser = 'Firefox';
    else if (/Edg/i.test(ua)) browser = 'Edge';
    else if (/Chrome/i.test(ua)) browser = 'Chrome';
    else if (/Safari/i.test(ua)) browser = 'Safari';
    else if (/Opera|OPR/i.test(ua)) browser = 'Opera';

    var os = 'Unknown';
    if (/Windows/i.test(ua)) os = 'Windows';
    else if (/Mac OS/i.test(ua)) os = 'macOS';
    else if (/Linux/i.test(ua)) os = 'Linux';
    else if (/Android/i.test(ua)) os = 'Android';
    else if (/iOS|iPhone|iPad/i.test(ua)) os = 'iOS';

    return {
      type: isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop',
      browser: browser,
      os: os,
      screenWidth: window.screen ? window.screen.width : null,
      screenHeight: window.screen ? window.screen.height : null,
    };
  }

  function log() {
    if (config.debug && console && console.log) {
      var args = Array.prototype.slice.call(arguments);
      args.unshift('[AboAnalytics]');
      console.log.apply(console, args);
    }
  }

  // ── Core tracking ──

  function trackEvent(type, name, data) {
    if (!state.initialized) {
      log('Not initialized, queueing event');
    }

    var event = {
      type: type,
      name: name || undefined,
      data: data || undefined,
      url: window.location.href,
      title: document.title,
      path: window.location.pathname,
      referrer: document.referrer || undefined,
      sessionId: state.sessionId,
      visitorId: state.visitorId,
      device: getDevice(),
      timestamp: new Date().toISOString(),
    };

    // Merge identity
    if (state.identity.email) event.email = state.identity.email;
    if (state.identity.stripeCustomerId) event.stripeCustomerId = state.identity.stripeCustomerId;
    if (state.identity.userId) event.userId = state.identity.userId;

    state.queue.push(event);
    log('Event queued:', type, name);

    if (state.queue.length >= MAX_BATCH_SIZE) {
      flush();
    }
  }

  function flush() {
    if (state.queue.length === 0 || !config.apiKey) return;

    var events = state.queue.splice(0, MAX_BATCH_SIZE);
    var endpoint = config.endpoint || API_ENDPOINT;

    log('Flushing', events.length, 'events to', endpoint);

    var payload = JSON.stringify({ events: events });

    // Use sendBeacon if available (for page unload), otherwise fetch
    if (typeof navigator.sendBeacon === 'function' && events.length <= 10) {
      var blob = new Blob([payload], { type: 'application/json' });
      var headers = new Headers({ 'x-abo-key': config.apiKey });
      // sendBeacon doesn't support custom headers, so we fallback to fetch
      sendViaFetch(endpoint, payload);
    } else {
      sendViaFetch(endpoint, payload);
    }
  }

  function sendViaFetch(endpoint, payload) {
    try {
      fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-abo-key': config.apiKey,
        },
        body: payload,
        keepalive: true,
      })
        .then(function (response) {
          if (!response.ok) {
            log('Failed to send events:', response.status);
          } else {
            log('Events sent successfully');
          }
        })
        .catch(function (err) {
          log('Error sending events:', err);
        });
    } catch (e) {
      log('Error sending events:', e);
    }
  }

  // ── Auto-tracking setup ──

  function setupAutoTracking() {
    // Page views
    if (config.trackPageViews) {
      trackEvent('page_view', null, {});

      // SPA navigation detection
      var origPushState = history.pushState;
      history.pushState = function () {
        origPushState.apply(history, arguments);
        setTimeout(function () {
          trackEvent('page_view', null, {});
        }, 0);
      };

      window.addEventListener('popstate', function () {
        setTimeout(function () {
          trackEvent('page_view', null, {});
        }, 0);
      });
    }

    // Click tracking
    if (config.trackClicks) {
      document.addEventListener(
        'click',
        function (e) {
          updateActivity();
          var target = e.target;
          // Walk up to find a meaningful element
          var el = target;
          var maxDepth = 5;
          while (el && maxDepth > 0) {
            if (el.tagName === 'A' || el.tagName === 'BUTTON' || el.getAttribute && el.getAttribute('data-abo-track')) {
              break;
            }
            el = el.parentElement;
            maxDepth--;
          }

          if (!el) return;

          var data = {
            tag: el.tagName,
            text: (el.textContent || '').trim().substring(0, 100),
          };

          if (el.tagName === 'A') {
            data.href = el.getAttribute('href');
          }

          if (el.id) data.id = el.id;
          if (el.className && typeof el.className === 'string') {
            data.classes = el.className.substring(0, 200);
          }

          // Custom tracking attribute
          var trackName = el.getAttribute && el.getAttribute('data-abo-track');
          if (trackName) {
            data.trackName = trackName;
          }

          trackEvent('click', trackName || null, data);
        },
        true
      );
    }

    // Scroll depth tracking
    if (config.trackScroll) {
      var scrollTimeout;
      window.addEventListener('scroll', function () {
        updateActivity();
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(function () {
          var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          var docHeight = Math.max(
            document.body.scrollHeight,
            document.documentElement.scrollHeight
          );
          var winHeight = window.innerHeight;
          var scrollPercent = Math.round((scrollTop / (docHeight - winHeight)) * 100);

          if (scrollPercent > state.maxScrollDepth) {
            state.maxScrollDepth = scrollPercent;
          }
        }, 200);
      });

      // Send scroll depth before page unload
      window.addEventListener('beforeunload', function () {
        if (state.maxScrollDepth > 0) {
          trackEvent('scroll', null, {
            maxDepth: state.maxScrollDepth,
            page: window.location.pathname,
          });
          flush();
        }
      });
    }

    // Session tracking
    if (config.trackSessions) {
      // Send session end on page unload
      window.addEventListener('beforeunload', function () {
        var duration = Date.now() - (state.sessionStart || Date.now());
        trackEvent('session_end', null, {
          duration: duration,
          pagesViewed: document.title,
        });
        flush();
      });

      // Visibility change detection
      document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible') {
          updateActivity();
          getSessionId(); // May start new session if timeout
        }
      });
    }
  }

  // ── Public API ──

  var AboAnalytics = {
    /**
     * Initialize the SDK
     * @param {Object} options
     * @param {string} options.apiKey - Your Abo SDK API key (required)
     * @param {string} [options.endpoint] - Custom API endpoint URL
     * @param {boolean} [options.autoTrack=true] - Enable auto-tracking
     * @param {boolean} [options.trackPageViews=true] - Track page views
     * @param {boolean} [options.trackClicks=true] - Track clicks
     * @param {boolean} [options.trackScroll=true] - Track scroll depth
     * @param {boolean} [options.trackSessions=true] - Track sessions
     * @param {boolean} [options.debug=false] - Enable debug logging
     */
    init: function (options) {
      if (!options || !options.apiKey) {
        console.error('[AboAnalytics] apiKey is required');
        return;
      }

      config.apiKey = options.apiKey;
      if (options.endpoint) config.endpoint = options.endpoint;
      if (options.autoTrack !== undefined) config.autoTrack = options.autoTrack;
      if (options.trackPageViews !== undefined) config.trackPageViews = options.trackPageViews;
      if (options.trackClicks !== undefined) config.trackClicks = options.trackClicks;
      if (options.trackScroll !== undefined) config.trackScroll = options.trackScroll;
      if (options.trackSessions !== undefined) config.trackSessions = options.trackSessions;
      if (options.debug !== undefined) config.debug = options.debug;

      state.initialized = true;
      state.visitorId = getVisitorId();
      getSessionId();

      // Start batch timer
      state.timer = setInterval(flush, BATCH_INTERVAL);

      // Auto-tracking
      if (config.autoTrack) {
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
          setupAutoTracking();
        } else {
          document.addEventListener('DOMContentLoaded', setupAutoTracking);
        }
      }

      log('Initialized with key:', config.apiKey.substring(0, 12) + '...');
    },

    /**
     * Identify the current user
     * @param {Object} identity
     * @param {string} [identity.email] - User email
     * @param {string} [identity.stripeCustomerId] - Stripe Customer ID
     * @param {string} [identity.userId] - Custom user ID
     */
    identify: function (identity) {
      if (!identity) return;
      if (identity.email) state.identity.email = identity.email;
      if (identity.stripeCustomerId) state.identity.stripeCustomerId = identity.stripeCustomerId;
      if (identity.userId) state.identity.userId = identity.userId;

      trackEvent('identify', null, {
        email: identity.email || undefined,
        stripeCustomerId: identity.stripeCustomerId || undefined,
        userId: identity.userId || undefined,
      });

      log('Identified:', state.identity);
    },

    /**
     * Track a custom event
     * @param {string} eventName - Event name
     * @param {Object} [data] - Event data
     */
    track: function (eventName, data) {
      trackEvent('custom', eventName, data || {});
    },

    /**
     * Track feature usage
     * @param {string} featureName - Feature name (should match Brand Lab features)
     * @param {Object} [data] - Additional data
     */
    feature: function (featureName, data) {
      trackEvent('feature_use', featureName, data || {});
    },

    /**
     * Flush pending events immediately
     */
    flush: function () {
      flush();
    },

    /**
     * Reset identity and visitor
     */
    reset: function () {
      state.identity = {};
      try {
        localStorage.removeItem(VISITOR_KEY);
      } catch (e) {
        // ignore
      }
      state.visitorId = getVisitorId();
      log('Reset');
    },
  };

  // Expose globally
  window.AboAnalytics = AboAnalytics;

  // Process any queued calls (for async loading)
  if (window.AboAnalyticsQueue && Array.isArray(window.AboAnalyticsQueue)) {
    window.AboAnalyticsQueue.forEach(function (call) {
      if (AboAnalytics[call[0]]) {
        AboAnalytics[call[0]].apply(AboAnalytics, call.slice(1));
      }
    });
  }
})(window);
