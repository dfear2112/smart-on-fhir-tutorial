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
        var his = smart.patient.api.fetchAll({
          type: 'FamilyMemberHistory'});

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

          var con = smart.patient.api.fetchAll({
            type: 'Condition',
            query: {
              code: {
                $or: ['http://snomed.info/sct|44054006'
                     ]
              }
            }
          });


        //History
        $.when(pt, his).fail(onError);
        $.when(pt, his).done(function(patient, his) {
          var byCodes = smart.byCodes(his, 'code');
          console.log("Family Member History:");
          console.log(his);

          //Observations
        $.when(pt, obv).fail(onError);
        $.when(pt, obv).done(function(patient, obv) {
            var byCodes = smart.byCodes(obv, 'code');
            var gender = patient.gender;
            var fname = '';
            var lname = '';
            if (typeof patient.name[0] !== 'undefined') {
              fname = patient.name[0].given.join(' ');
              lname = patient.name[0].family;
            }
            systolicbp = getBloodPressureValue(byCodes('55284-4'),'8480-6');
            diastolicbp = getBloodPressureValue(byCodes('55284-4'),'8462-4');
            serum_glucose = byCodes('2345-7');
            bmi = byCodes('39156-5');


            //Conditions
        $.when(pt, con).fail(onError);
        $.when(pt, con).done(function(patient, con) {
              var byCodes = smart.byCodes(con, 'code');
              console.log("byCodes:");
              console.log(con);

              condition = byCodes('44054006');
              console.log("condition_variable: ");
              console.log(condition)

              console.log('p:');
              console.log(p);
          ret.resolve(p);
        });
      } else {
        onError();
      }
    }
    //creating default patient
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

    //Conditions and Onset
    p.condition = getCondition(con[0]);
    p.onset = getOnset(con[0]);

    //Family Member History
    p.motherfamilymemberhistory = getMotherandCondition(his[0]);
    p.mothercondition = getMotherCondition(his[0]);

    p.father= getFather(his[1]);
    p.fathercondition = getFatherCondition(his[1]);
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
      onset: {value:''},
      bmi: {value:''},
      systolicbp: {value: ''},
      diastolicbp: {value: ''},
      serum_glucose: {value: ''},
      motherfamilymemberhistory: {value: ''},
      mothercondition: {value: ''},
      father: {value: ''},
      fathercondition: {value: ''},

    };
  }
  // Helper Functions

  function getMotherandCondition(fa) {
    if (typeof fa != 'undefined' &&
        typeof fa.relationship.coding[0].display != 'undefined') {
          return fa.relationship.coding[0].display;
    } else {
      return undefined;
    }
  }

  function getMotherCondition (mo) {
    if (typeof mo != 'undefined' &&
        typeof mo.condition[0].code.text != 'undefined'){
          return mo.condition[0].code.text;
        } else {
          return undefined;
        }
  }

  function getFather (dad) {
    if (typeof dad != 'undefined' &&
        typeof dad.relationship.coding[0].display != 'undefined'){
          return dad.relationship.coding[0].display ;
        } else {
          return undefined;
        }
  }

 function getFatherCondition (dc){
  if (typeof dc != 'undefined' &&
      typeof dc.condition != 'undefined' &&
      typeof dc.condition[0].code != 'undefined' &&
      typeof dc.condition[0].code.text != 'undefined'){
        return dc.condition[0].code.text;
      } else {
        return undefined;
      }
  }
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
  window.drawVisualization = function(p) {
    $('#holder').show();
    $('#loading').hide();
    $('#fname').html(p.fname);
    $('#lname').html(p.lname);
    $('#gender').html(p.gender);
    $('#birthdate').html(p.birthdate);
    $('#condition').html(c.condition);
    $('#onset').html(c.onset);
    $('#systolicbp').html(p.systolicbp);
    $('#diastolicbp').html(p.diastolicbp);
    $('#serum_glucose').html(p.serum_glucose);
    $('#bmi').html(p.bmi);
    $('#motherfamilymemberhistory').html(p.motherfamilymemberhistory);
    $('#mothercondition').html(p.mothercondition);
    $('#father').html(p.father);
    $('#fathercondition').html(p.fathercondition);
  };
})(window);
