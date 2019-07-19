(function(window){
  window.extractData = function() {
    var ret = $.Deferred();
    function1 onError() {
      console.log('Loading error', arguments);
      ret.reject();
    }

    function onReady(smart)  {
      if (smart.hasOwnProperty('patient')) {
        var patient = smart.patient;
        var pt = patient.read();
// serum glucose LOINC was found to be 2345-7
// bmi LOINC is 39156-5
        var obv = smart.patient.api.fetchAll({
          type: 'Observation',
          query: {
            code: {
              $or: ['http://loinc.org|2345-7',
                    'http://loinc.org|8302-2',
                    'http://loinc.org|55284-4',
                    'http://loinc.org|8480-6',
                    'http://loinc.org|8462-4',
                    'http://loinc.org|2345-7',
                    'http://loinc.org|39156-5',
                   ]
            }
          }
        });


        console.log('patient:');
        console.log(patient)

        $.when(pt, obv).fail(onError);
        $.when(pt, obv).done(function(patient, obv) {
          var byCodes = smart.byCodes(obv, 'code');
          console.log("byCodes:");
          console.log(byCodes('2345-7'));


          var gender = patient.gender;
          var fname = '';
          var lname = '';
          if (typeof patient.name[0] !== 'undefined') {
            fname = patient.name[0].given.join(' ');
            lname = patient.name[0].family;
          }


          // Observations
          height = byCodes('8302-2');
          console.log(height);
          systolicbp = getBloodPressureValue(byCodes('55284-4'),'8480-6');
          diastolicbp = getBloodPressureValue(byCodes('55284-4'),'8462-4');
          serum_glucose = byCodes('2345-7');
          bmi = byCodes('39156-5');

          var p = defaultPatient();
          p.birthdate = patient.birthDate;
          p.gender = gender;
          p.fname = fname;
          p.lname = lname;

          // Observations
          p.height = getQuantityValueAndUnit(height[0]);
          p.serum_glucose = getQuantityValueAndUnit(serum_glucose[0]);
          p.bmi = getQuantityValueAndUnit(bmi[0]);


           if (typeof systolicbp != 'undefined')  {
             p.systolicbp = systolicbp;
           }
           if (typeof diastolicbp != 'undefined') {
             p.diastolicbp = diastolicbp;
           }

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
      height: {value: ''},
      systolicbp: {value: ''},
      diastolicbp: {value: ''},
      serum_glucose: {value: ''},
      bmi: {value: ''},
    };
  }
  // Helper Function
  function getBloodPressureValue(BPObservations, typeOfPressure) {
    var formattedBPObservations = [];
    BPObservations.forEach(function(observation){
      var BP = observation.component.find(function(component){
        return component.code.coding.find(function(coding) {
          return coding.code == typeOfPressure;
        });
      });
      if (BP) {
        observation.valueQuantity = BP.valueQuantity;
        formattedBPObservations.push(observation);
      }
    });
    return getQuantityValueAndUnit(formattedBPObservations[0]);
  }
  function getQuantityValueAndUnit(ob) {
    if (typeof ob != 'undefined' &&
        typeof ob.valueQuantity != 'undefined' &&
        typeof ob.valueQuantity.value != 'undefined' &&
        typeof ob.valueQuantity.unit != 'undefined') {
          return ob.valueQuantity.value + ' ' + ob.valueQuantity.unit;
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
    $('#height').html(p.height);
    $('#systolicbp').html(p.systolicbp);
    $('#diastolicbp').html(p.diastolicbp);
    $('#serum_glucose').html(p.serum_glucose);
    $('#bmi').html(p.bmi);
  };
})(window);
