/* exported Basket */
'use strict';

// Simple Javascript client for Mozilla Basket newsletters

var Basket = {

  basketUrl: 'https://basket.mozilla.org/news/subscribe/',
  newsletterId: 'firefox-os',
  callback: null,
  xhr: null,
  itemId: 'newsletter_email',
  // https://github.com/mozilla/basket-client/blob/master/basket/errors.py
  errors: {
    NETWORK_FAILURE: 1,
    INVALID_EMAIL: 2,
    UNKNOWN_EMAIL: 3,
    UNKNOWN_TOKEN: 4,
    USAGE_ERROR: 5,
    EMAIL_PROVIDER_AUTH_FAILURE: 6,
    AUTH_ERROR: 7,
    SSL_REQUIRED: 8,
    INVALID_NEWSLETTER: 9,
    INVALID_LANGUAGE: 10,
    EMAIL_NOT_CHANGED: 11,
    CHANGE_REQUEST_NOT_FOUND: 12,
    UNKNOWN_ERROR: 99
  },

  responseHandler: function b_responseHandler() {
    if (this.xhr.readyState === 4) {
      if (this.xhr.status === 200) {
        if (typeof this.callback === 'function') {
          this.callback(null, JSON.parse(this.xhr.responseText));
        }
      } else {
        if (typeof this.callback === 'function') {
          if (this.xhr.responseText) {
            this.callback(JSON.parse(this.xhr.responseText));
          } else {
            this.callback('Unknown error');
          }
        }
      }
    }
  },

  timeoutHandler: function b_timeoutHandler() {
    this.callback('Timeout');
  },

  /**
   * Send data to Mozilla Basket.
   *
   * @param {String} [email] email we want to add to the newsletter.
   *
   * @param {Function} [callback] first argument is error, second
   *                            is result of operation or null
   *                            in the error case.
   */
  send: function b_send(email, callback) {
    var self = this;
    var params = 'email=' + encodeURIComponent(email) +
                 '&newsletters=' + self.newsletterId;
    self.callback = callback;
    self.xhr = new XMLHttpRequest({mozSystem: true});
    self.xhr.onreadystatechange = self.responseHandler.bind(self);
    self.xhr.open('POST', self.basketUrl, true);
    self.xhr.setRequestHeader('Content-type',
                              'application/x-www-form-urlencoded');
    self.xhr.setRequestHeader('Connection', 'close');
    self.xhr.timeout = 5000;  // 5 seconds
    self.xhr.ontimeout = self.timeoutHandler.bind(self);
    self.getLanguage(function do_send(language) {
      if (language) {
        params += '&lang=' + language;
      }
      self.xhr.setRequestHeader('Content-length', params.length);
      self.xhr.send(params);
    });
  },

  store: function b_store(email, callback) {
    window.asyncStorage.setItem(this.itemId, email, function stored() {
      if (callback) {
        callback();
      }
    });
  },

  getLanguage: function b_getLanguage(callback) {
    var settings = window.navigator.mozSettings;
    if (!settings || !settings.createLock) {
      callback();
      return;
    }

    var s_name = 'language.current';
    var req = settings.createLock().get(s_name);

    req.onsuccess = function _onsuccess() {
      callback(req.result[s_name]);
    };

    req.onerror = function _onerror() {
      console.error('Error getting setting: ' + s_name);
      callback();
    };
  }

};

