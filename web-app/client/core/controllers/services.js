/*
 * Services Controller
 */

define([], function () {

  var ERROR_TXT = 'Instance count out of bounds.';

  var Controller = Em.Controller.extend({

    load: function () {
      var self = this;
      self.set('systemServices', []);
      self.set('userServices', []);

      self.resetServices();
      this.interval = setInterval(function () {
        self.resetServices();
      }, C.POLLING_INTERVAL)

    },

    resetServices: function () {
      var self = this;
      var systemServices = [];
      var userServices = [];

      self.HTTP.rest('system/services', function (services) {
        services.map(function(service) {
          var imgSrc = service.status === 'OK' ? 'complete' : 'loading';
          var logSrc = service.status === 'OK' ? 'complete' : 'loading';
          systemServices.push(C.Service.create({
            modelId: service.name,
            description: service.description,
            id: service.name,
            name: service.name,
            description: service.description,
            status: service.status,
            min: service.min,
            max: service.max,
            isIncreaseEnabled: service.requested < service.max,
            isDecreaseEnabled: service.requested > service.min,
            logs: service.logs,
            requested: service.requested,
            provisioned: service.provisioned,
            statusOk: !!(service.status === 'OK'),
            statusNotOk: !!(service.status === 'NOTOK'),
            logsStatusOk: !!(service.logs === 'OK'),
            logsStatusNotOk: !!(service.logs === 'NOTOK'),
            metricEndpoint: C.Util.getMetricEndpoint(service.name),
            metricName: C.Util.getMetricName(service.name),
            imgClass: imgSrc,
            logClass: logSrc,
            isSystem: true,
            isUser:   false,
          }));
        });
        self.set('systemServices', systemServices);

        // Bind all the tooltips after UI has rendered after call has returned.
        setTimeout(function () {
          $("[data-toggle='tooltip']").tooltip();
        }, 1000);
      });

      self.HTTP.rest('apps', function (apps) {
        apps.forEach(function(app) {
          var appUrl = 'apps/' + app.name + '/services';
          self.HTTP.rest(appUrl, function (services) {
            services.map(function(service) {
              var imgSrc = service.status === 'OK' ? 'complete' : 'loading';
              var logSrc = service.status === 'OK' ? 'complete' : 'loading';
              userServices.push(C.Service.create({
                modelId: service.name,
                description: service.description,
                id: service.name,
                name: service.name,
                description: service.description,
                status: service.status,
                min: service.min,
                max: service.max,
                isIncreaseEnabled: service.requested < service.max,
                isDecreaseEnabled: service.requested > service.min,
                logs: service.logs,
                requested: service.requested,
                provisioned: service.provisioned,
                statusOk: !!(service.status === 'OK'),
                statusNotOk: !!(service.status === 'NOTOK'),
                logsStatusOk: !!(service.logs === 'OK'),
                logsStatusNotOk: !!(service.logs === 'NOTOK'),
                metricEndpoint: C.Util.getMetricEndpoint(service.name),
                metricName: C.Util.getMetricName(service.name),
                imgClass: imgSrc,
                logClass: logSrc,
                isSystem: true,
                isUser:   true,
              }));
            });
            self.set('userServices', userServices);

            // Bind all the tooltips after UI has rendered after call has returned.
            setTimeout(function () {
              $("[data-toggle='tooltip']").tooltip();
            }, 1000);
          });
        });
      });


    },

    increaseInstance: function (serviceName, instanceCount) {
      var self = this;
      C.Modal.show(
        "Increase instances",
        "Increase instances for " + serviceName + "?",
        function () {

          var payload = {data: {instances: ++instanceCount}};
          var services = self.get('services');
          for (var i = 0; i < services.length; i++) {
            var service = services[i];
            if (service.name === serviceName) {
              if (instanceCount > service.max || instanceCount < service.min) {
                C.Util.showWarning(ERROR_TXT);
                return;
              }
            }
          }
          self.executeInstanceCall(serviceName, payload);
        });
    },

    decreaseInstance: function (serviceName, instanceCount) {
      var self = this;
      C.Modal.show(
        "Decrease instances",
        "Decrease instances for " + serviceName + "?",
        function () {

          var payload = {data: {instances: --instanceCount}};
          var services = self.get('services');
          for (var i = 0; i < services.length; i++) {
            var service = services[i];
            if (service.name === serviceName) {
              if (instanceCount > service.max || instanceCount < service.min) {
                C.Util.showWarning(ERROR_TXT);
                return;
              }
            }
          }
          self.executeInstanceCall(serviceName, payload);
        });  
    },

    executeInstanceCall: function(serviceName, payload) {
      var self = this;
      this.HTTP.put('rest/system/services/' + serviceName + '/instances', payload,
        function(resp, status) {
        if (status === 'error') {
          C.Util.showWarning(resp);
        } else {
          self.resetServices();
        }
      });
    },

    unload: function () {
      clearInterval(this.interval);
    }

  });

  Controller.reopenClass({
    type: 'Services',
    kind: 'Controller'
  });

  return Controller;

});
