/* global app */
/* exported version */
const version = 0.2;
const namespace = 'periodTracker';

var defaultSettings = {
  startDayOkWeek: 1, // 0 Sunday, 1 Monday
  periodLength: 4
};

var Tracker = function(namespace) {
  this.settings = new app.Settings(namespace, defaultSettings);
  this.model = new app.Model(namespace);
  this.template = new app.Template(this.settings);
  this.view = new app.View(this.template);
  this.controller = new app.Controller(this.model, this.view);
};

var tracker = new Tracker(namespace);

var show = function() {
  tracker.controller.setSection(document.location.hash);
};

var load = function() {
  tracker.controller.setData();
  show();
};

window.addEventListener('load', load);
window.addEventListener('hashchange', show);