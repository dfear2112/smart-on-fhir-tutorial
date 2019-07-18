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


          var gender = patient.gender;
          var fname = '';
          var lname = '';
          if (typeof patient.name[0] !== 'undefined') {
            fname = patient.name[0].given.join(' ');
            lname = patient.name[0].family;
          }
          condition = byCodes('44054006');
          console.log("condition_variable: ");
          console.log(condition)


          var p = defaultPatient();
          p.birthdate = patient.birthDate;
          p.gender = gender;
          p.fname = fname;
          p.lname = lname;

          //Conditions
          p.condition = getCondition(con[0]);

          //I need to confirm that this means
          p.onset = getOnset(con[0]);

          console.log('p:');
          console.log(p);
          ret.resolve(p);
        });
      } else {
        onError();
      }
    }
    FHIR.oauth2.ready(onReady, onError);
    return ret.promise();
  };
  function defaultPatient(){
    return {
      fname: {value: ''},
      lname: {value: ''},
      gender: {value: ''},
      birthdate: {value: ''},
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
        typeof co.meta.onsetDateTime != 'undefined') {
            return co.meta.onsetDateTime;
        } else {
          return undefined;
        }
      }

  window.drawVisualization = function(p) {
    $('#holder').show();
    $('#loading').hide();
    $('#fname').html(p.fname);
    $('#lname').html(p.lname);
    $('#gender').html(p.gender);
    $('#birthdate').html(p.birthdate);
    $('#condition').html(p.condition);
    $('#onset').html(p.onset);
  };
})(window);
