(function(window){
  window.extractData = function() {
    var ret = $.Deferred();
    function onError() {
      console.log('Loading error', arguments);
      ret.reject();
    }

    function onReady(smart)  {
      if (smart.hasOwnProperty('patient')) {
        var patient = smart.patient;
        var pt = patient.read();
//SMOMED 44054006 codes for Type 2 Diabetes
        var con = smart.patient.api.fetchAll({
          type: 'Condition',
          query: {
            code: {
              $or: ['http://snomed.info/sct|44054006'
                   ]
            }
          }
        });

        console.log('patient:');
        console.log(patient)

        $.when(pt, con).fail(onError);
        $.when(pt, con).done(function(patient, con) {
          var byCodes = smart.byCodes(con, 'code');
          console.log("byCodes:");
          console.log(con);


          condition = byCodes('44054006');
          console.log("condition_variable: ");
          console.log(condition)


          var c = defaultConditions();

          //Conditions
          c.condition = getCondition(con[0]);

          //I need to confirm that this means
          c.onset = getOnset(con[0]);

          console.log('c:');
          console.log(c);
          ret.resolve(c);
        });
      } else {
        onError();
      }
    }
    FHIR.oauth2.ready(onReady, onError);
    return ret.promise();
  };
  function defaultConditions(){
    return {
      condition: {value: ''},
      onset: {value: ''},
    };
  }
  // Helper Function

  function getCondition(co) {
    if (typeof co != 'undefined' &&
        typeof co.code.text != 'undefined') {
          return co.code.text;
    } else {
      return undefined;
    }
  }

  function getOnset(co) {
    if (typeof co != 'undefined' &&
        typeof co.onsetDateTime != 'undefined') {
            return co.onsetDateTime;
        } else {
          return undefined;
        }
      }

  window.drawVisualization = function(c) {
    $('#holder').show();
    $('#loading').hide();
    $('#condition').html(c.condition);
    $('#onset').html(c.onset);
  };
})(window);
