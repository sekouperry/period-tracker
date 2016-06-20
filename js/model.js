/* global moment */
(function(window) {
  'use strict';

  var datePattern = 'YYYY-MM-DD';
  // this regexp is not strict as the date validation will be performed by moment.js
  var dateRegExp = new RegExp(/^\d{4}-\d{2}-\d{2}$/);
  var averageIntervals = 3;

  var Model = function(name) {
    var _namespace = name;
    var _today = moment().format(datePattern);
    var _list = [];
    var _intervals = [];
    var _average = 0;
    var _next = '';
    var _countdown = 0;

    Object.defineProperty(this, 'list', {
      get: function() {
        return _list;
      }
    });

    Object.defineProperty(this, 'intervals', {
      get: function() {
        return _intervals;
      }
    });

    Object.defineProperty(this, 'average', {
      get: function() {
        return _average;
      }
    });

    Object.defineProperty(this, 'next', {
      get: function() {
        return _next;
      }
    });

    Object.defineProperty(this, 'countdown', {
      get: function() {
        return _countdown;
      }
    });

    /**
     * Sort dates in descending order
     */
    var sortDesc = function() {
      _list.sort(function(a, b) {
        if (a.date < b.date) {
          return 1;
        }
        if (a.date > b.date) {
          return -1;
        }
        return 0;
      });
    };

    /**
     * Check if date is valid
     * @returns {boolean}
     */
    var isValidDate = function(date) {
      // check if the pattern is ok
      if (!dateRegExp.test(date)) {
        return false;
      }
      // check if the date is actually valid
      return moment(date, datePattern).isValid();
    };

    /**
     * Find occurance by id
     * @param {string} id - id of the occurance to find
     * @returns {number} -1 if not found, otherwise index number of the element
     */
    var findById = function(id) {
      var index = -1;
      for (var i = 0; i < _list.length; i++) {
        if (id === _list[i].id) {
          index = i;
          break;
        }
      }
      return index;
    };

    /**
     * Find occurance by date
     * @param {string} date - string in YYYY-DD-MM format
     * @returns {number} -1 if not found, otherwise index number of the element
     */
    var findByDate = function(date) {
      var index = -1;
      for (var i = 0; i < _list.length; i++) {
        if (date === _list[i].date) {
          index = i;
          break;
        }
      }
      return index;
    };

    /**
     * Add single occurance
     * @param {string} date - string in YYYY-DD-MM format
     * @returns {number} -1 if not successful, otherwise the added element
     */
    var add = function(date) {
      if (!isValidDate(date)) {
        return -1;
      }
      if (findByDate(date) !== -1) {
        return -1;
      }
      var now = moment();
      var id = now.valueOf() + '';
      var newItem = {
        id: id,
        date: date,
        created: now.format(),
        updated: now.format()
      };
      _list.unshift(newItem);
      sortDesc();
      return newItem;
    };

    /**
     * Change single occurance
     * @param {string} id - id of the occurance to edit
     * @param {string} date - string in YYYY-DD-MM format
     * @returns {number|object} -1 if not successful, otherwise the updated element
     */
    var edit = function(id, date) {
      if (!isValidDate(date)) {
        return -1;
      }
      var indexById = findById(id);
      if (indexById === -1) {
        return -1;
      }
      if (findByDate(date) !== -1) {
        return -1;
      }
      var el = _list[indexById];
      el.date = date;
      el.updated = moment().format();
      sortDesc();
      return el;
    };

    /**
     * Remove single occurance
     * @param {string} id - id of the occurance to remove
     * @returns {number|object} -1 if not successful, otherwise the removed element
     */
    var remove = function(id) {
      var index = findById(id);
      if (index === -1) {
        return -1;
      }
      var removed = _list.splice(index, 1);
      return removed[0];
    };

    /**
     * Remove all occurances
     * @returns {number|object} -1 if data was already empty, otherwise the removed elements
     */
    var drop = function() {
      var removed = -1;
      if (_list.length > 0) {
        removed = _list.splice(0);
      }
      return removed;
    };

    /**
     * Modify occurances
     * @param {string} how - How to change
     * @param {string} id - id of the occurance
     * @param {string} date - string in YYYY-DD-MM format
     * @returns {number|object} -1 if not successful, otherwise the affected elements
     */
    var modify = function(how, id, date) {
      var mod = -1;
      if (how === 'add') {
        mod = add(date);
      }
      if (how === 'edit') {
        mod = edit(id, date);
      }
      if (how === 'remove') {
        mod = remove(id);
      }
      if (how === 'drop') {
        mod = drop();
      }
      if (mod !== -1) {
        calcAll();
        if (save()) {
          return mod;
        }
        return -1;
      }
      return -1;
    };

    /**
     * Calculate interval in days between occurances
     */
    var calcIntervals = function() {
      _intervals = [];
      for (var i = 1; i < _list.length; i++) {
        _intervals.push( moment.range(_list[i].date, _list[i - 1].date).diff('days') );
      }
    };

    /**
     * Calculate average interval in days between occurances
     */
    var calcAverage = function() {
      var arr = _intervals.slice(0, averageIntervals);
      if (!arr.length) {
        _average = 0;
        return;
      }
      var sum = 0;
      for (var i = 0; i < arr.length; i++) {
        sum += arr[i];
      }
      _average = Math.round(sum / arr.length);
    };

    /**
     * Calculate next occurance
     */
    var calcNext = function() {
      var last = _today;
      var lastItem = _list[0];
      if (lastItem) {
        last = lastItem.date;
      }
      _next = moment(last).add(_average, 'days').format(datePattern);
    };

    /**
     * Caldulate how many days left until next occurance
     */
    var calcCountdown = function() {
      _countdown = moment.range(_today, _next).diff('days');
    };

    /**
     * Do all calculations
     */
    var calcAll = function() {
      calcIntervals();
      calcAverage();
      calcNext();
      calcCountdown();
    };

    /**
     * Load from localStorage
     * @returns {boolean} True if load was successful
     */
    var load = function() {
      try {
        _list = JSON.parse(localStorage.getItem(_namespace)) || [];
        return true;
      } catch (e) {
        console.log(e);
        return false;
      }
    };

    /**
     * Save to localStorage
     * @returns {boolean} True if save was successful
     */
    var save = function() {
      try {
        localStorage.setItem(_namespace, JSON.stringify(_list));
        return true;
      } catch (e) {
        console.log(e);
        return false;
      }
    };

    /**
     * Init data
     * @returns {array}
     */
    this.init = function() {
      load();
      calcAll();
    };

    /**
     * Add single occurance
     * @param {string} date - string in YYYY-DD-MM format
     * @returns {number} -1 if not successful, otherwise index number of the affected element
     */
    this.add = function(date) {
      return modify('add', null, date);
    };

    /**
     * Edit single occurance
     * @param {string} id - id of the occurance to edit
     * @param {string} date - string in YYYY-DD-MM format
     * @returns {number|object} -1 if not successful, otherwise object with index numbers of the added and removed elements
     */
    this.edit = function(id, date) {
      return modify('edit', id, date);
    };

    /**
     * Delete single occurance
     * @param {string} id - id of the occurance to remove
     * @returns {number} -1 if not successful, otherwise index number of the affected element
     */
    this.remove = function(id) {
      return modify('remove', id);
    };

    /**
     * Delete all occurances
     * @returns {number} -1 if data was already empty, otherwise number of the removed elements
     */
    this.drop = function() {
      return modify('drop');
    };
  };

  // export to window
  window.app = window.app || {};
  window.app.Model = Model;
})(window);