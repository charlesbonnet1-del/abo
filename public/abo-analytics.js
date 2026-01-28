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
  var IDB_NAME = 'abo_analytics_db';
  var IDB_STORE = 'failed_events';
  var MAX_RETRY_ATTEMPTS = 5;
  var BASE_RETRY_DELAY = 1000; // 1 second

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
    retryTimer: null,
    isOnline: navigator.onLine !== false,
    db: null,
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

  // ── IndexedDB for offline persistence ──

  function openDatabase() {
    return new Promise(function (resolve, reject) {
      if (!window.indexedDB) {
        log('IndexedDB not supported');
        resolve(null);
        return;
      }

      var request = indexedDB.open(IDB_NAME, 1);

      request.onerror = function () {
        log('IndexedDB open error');
        resolve(null);
      };

      request.onsuccess = function (event) {
        state.db = event.target.result;
        log('IndexedDB opened');
        resolve(state.db);
      };

      request.onupgradeneeded = function (event) {
        var db = event.target.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          var store = db.createObjectStore(IDB_STORE, { keyPath: 'id', autoIncrement: true });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  function saveToIndexedDB(events, retryCount) {
    if (!state.db) return Promise.resolve();

    return new Promise(function (resolve) {
      try {
        var transaction = state.db.transaction([IDB_STORE], 'readwrite');
        var store = transaction.objectStore(IDB_STORE);

        var record = {
          events: events,
          retryCount: retryCount || 0,
          timestamp: Date.now(),
        };

        store.add(record);

        transaction.oncomplete = function () {
          log('Events saved to IndexedDB for retry');
          resolve();
        };

        transaction.onerror = function () {
          log('Error saving to IndexedDB');
          resolve();
        };
      } catch (e) {
        log('IndexedDB save error:', e);
        resolve();
      }
    });
  }

  function loadFromIndexedDB() {
    if (!state.db) return Promise.resolve([]);

    return new Promise(function (resolve) {
      try {
        var transaction = state.db.transaction([IDB_STORE], 'readonly');
        var store = transaction.objectStore(IDB_STORE);
        var request = store.getAll();

        request.onsuccess = function () {
          resolve(request.result || []);
        };

        request.onerror = function () {
          resolve([]);
        };
      } catch (e) {
        resolve([]);
      }
    });
  }

  function deleteFromIndexedDB(id) {
    if (!state.db) return Promise.resolve();

    return new Promise(function (resolve) {
      try {
        var transaction = state.db.transaction([IDB_STORE], 'readwrite');
        var store = transaction.objectStore(IDB_STORE);
        store.delete(id);

        transaction.oncomplete = function () {
          resolve();
        };

        transaction.onerror = function () {
          resolve();
        };
      } catch (e) {
        resolve();
      }
    });
  }

  function updateRetryCount(id, retryCount) {
    if (!state.db) return Promise.resolve();

    return new Promise(function (resolve) {
      try {
        var transaction = state.db.transaction([IDB_STORE], 'readwrite');
        var store = transaction.objectStore(IDB_STORE);
        var request = store.get(id);

        request.onsuccess = function () {
          var record = request.result;
          if (record) {
            record.retryCount = retryCount;
            store.put(record);
          }
          resolve();
        };

        request.onerror = function () {
          resolve();
        };
      } catch (e) {
        resolve();
      }
    });
  }

  // ── Retry with exponential backoff ──

  function calculateBackoffDelay(retryCount) {
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
    return Math.min(BASE_RETRY_DELAY * Math.pow(2, retryCount), 30000);
  }

  function retryFailedEvents() {
    if (!state.isOnline) {
      log('Offline, skipping retry');
      return;
    }

    loadFromIndexedDB().then(function (records) {
      if (records.length === 0) return;

      log('Retrying', records.length, 'failed batches');

      records.forEach(function (record) {
        if (record.retryCount >= MAX_RETRY_ATTEMPTS) {
          log('Max retries reached, discarding batch');
          deleteFromIndexedDB(record.id);
          return;
        }

        var delay = calculateBackoffDelay(record.retryCount);
        log('Retrying batch in', delay, 'ms (attempt', record.retryCount + 1, ')');

        setTimeout(function () {
          sendWithRetry(record.events, record.retryCount + 1, record.id);
        }, delay);
      });
    });
  }

  function scheduleRetry() {
    if (state.retryTimer) return;

    state.retryTimer = setTimeout(function () {
      state.retryTimer = null;
      retryFailedEvents();
    }, 10000); // Check for retries every 10s
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

    if (!state.isOnline) {
      log('Offline, saving events to IndexedDB');
      saveToIndexedDB(events, 0);
      return;
    }

    sendWithRetry(events, 0, null);
  }

  function sendWithRetry(events, retryCount, existingRecordId) {
    var endpoint = config.endpoint || API_ENDPOINT;
    var payload = JSON.stringify({ events: events });

    log('Sending', events.length, 'events to', endpoint);

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
        if (response.ok) {
          log('Events sent successfully');
          // Remove from IndexedDB if this was a retry
          if (existingRecordId) {
            deleteFromIndexedDB(existingRecordId);
          }
        } else if (response.status >= 500) {
          // Server error, save for retry
          log('Server error', response.status, ', saving for retry');
          handleSendFailure(events, retryCount, existingRecordId);
        } else {
          // Client error (4xx), don't retry
          log('Client error', response.status, ', not retrying');
          if (existingRecordId) {
            deleteFromIndexedDB(existingRecordId);
          }
        }
      })
      .catch(function (err) {
        log('Network error:', err.message);
        handleSendFailure(events, retryCount, existingRecordId);
      });
  }

  function handleSendFailure(events, retryCount, existingRecordId) {
    if (retryCount >= MAX_RETRY_ATTEMPTS) {
      log('Max retries reached, discarding events');
      if (existingRecordId) {
        deleteFromIndexedDB(existingRecordId);
      }
      return;
    }

    if (existingRecordId) {
      // Update retry count in existing record
      updateRetryCount(existingRecordId, retryCount);
    } else {
      // Save new record
      saveToIndexedDB(events, retryCount);
    }

    scheduleRetry();
  }

  // ── Online/Offline handling ──

  function handleOnline() {
    log('Back online');
    state.isOnline = true;
    // Immediately try to send any pending events
    flush();
    retryFailedEvents();
  }

  function handleOffline() {
    log('Gone offline');
    state.isOnline = false;
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
            if (el.tagName === 'A' || el.tagName === 'BUTTON' || (el.getAttribute && el.getAttribute('data-abo-track'))) {
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

      // Initialize IndexedDB and retry failed events
      openDatabase().then(function () {
        retryFailedEvents();
      });

      // Listen for online/offline events
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

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

    /**
     * Get pending event count (for debugging)
     */
    getPendingCount: function () {
      return state.queue.length;
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
