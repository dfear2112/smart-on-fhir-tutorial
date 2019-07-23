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


          var con = smart.patient.api.fetchAll({
            type: 'Condition',
            query: {
              code: {
                $or: ['http://snomed.info/sct|44054006'
                     ]
              }
            }
          });

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

        var p = defaultPatient();

        //Observations
      $.when(pt, obv).fail(onError);
      $.when(pt, obv).done(function(patient, obv) {
          var byCodes = smart.byCodes(obv, 'code');
          console.log("byCodes:");
          console.log(byCodes('39156-5'));
          var gender = patient.gender;
          var fname = '';
          var lname = '';
          if (typeof patient.name[0] !== 'undefined') {
            fname = patient.name[0].given.join(' ');
            lname = patient.name[0].family;
          }
          //systolicbp = getBloodPressureValue(byCodes('55284-4'),'8480-6');
          //diastolicbp = getBloodPressureValue(byCodes('55284-4'),'8462-4');
          serum_glucose = byCodes('2345-7');
          bmi = byCodes('39156-5');

          p.birthdate = patient.birthDate;
          p.gender = gender;
          p.fname = fname;
          p.lname = lname;

          // Observations
          p.serum_glucose = getQuantityValueAndUnit(serum_glucose[0]);
          p.bmi = getQuantityValueAndUnit(bmi[0]);


           // if (typeof systolicbp != 'undefined')  {
           //   p.systolicbp = systolicbp;
           // }
           // if (typeof diastolicbp != 'undefined') {
           //   p.diastolicbp = diastolicbp;
           // }

           //gene Function

           p.genes = httpGet('https://api.monarchinitiative.org/api/association/find?subject_taxon=NCBITaxon%3A9606&object=HP%3A0004904&graphize=false&unselect_evidence=true&start=0&rows=25&map_identifiers=NCBIGene')+'\n';
           console.log('genes');
           console.log(p.genes);
           console.log('test:');
           console.log(p);
           ret.resolve(p);
          });

        //History
        $.when(pt, his).fail(onError);
        $.when(pt, his).done(function(patient, his) {
          var byCodes = smart.byCodes(his, 'code')
          //Family Member History

          p.motherfamilymemberhistory = getMotherandCondition(his[0]);
          p.mothercondition = getMotherCondition(his[0]);

          p.father= getFather(his[1]);
          p.fathercondition = getFatherCondition(his[1]);});


            //Conditions
        $.when(pt, con).fail(onError);
        $.when(pt, con).done(function(patient, con) {
              var byCodes = smart.byCodes(con, 'code');


              condition = byCodes('44054006');

              //Conditions and Onset
              p.condition = getCondition(con[0]);
              p.onset = getOnset(con[0]);

              console.log('p:');
              console.log(p);
              //ret.resolve(p);
            });

        };
       //else {
        //onError();
      //}
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
      onset: {value:''},
      bmi: {value:''},
      //systolicbp: {value: ''},
      //diastolicbp: {value: ''},
      serum_glucose: {value: ''},
      motherfamilymemberhistory: {value: ''},
      mothercondition: {value: ''},
      father: {value: ''},
      fathercondition: {value: ''},
      genes: {value: ''},

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
          return 'mother has history of' + ' ' + mo.condition[0].code.text;
        } else {
          return 'mother has no known history of disease';
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
        return 'father has no known history of disease';
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

      function httpGet(theUrl)
      {
          var xmlHttp = new XMLHttpRequest();
          xmlHttp.open( "GET", theUrl, false ); // false for synchronous request
          xmlHttp.send( null );
          var data = xmlHttp.responseText;
          var jsonResponse = JSON.parse(data);
          console.log("jsonResponse: ")
          console.log(jsonResponse.associations[0].subject.label);
          var i;
          var genes = '';
          var variants='';
          for (i =0; i < 25; i++) {
            var string_response=jsonResponse.associations[i].subject.label + '<br>';
            if (string_response.includes("[") or string_response.includes("]")){
              //skip
            }else{
              if (string_response.includes("NM_"){
                variants+=string_response;
              }else{
                genes +=string_response;
              }
            }
            //genes += jsonResponse.associations[i].subject.label + '<br>';

          };
          console.log("genes: ");
          console.log(genes);
          console.log("variants: ");
          console.log(variants);
          return genes;

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
    //$('#systolicbp').html(p.systolicbp);
    //$('#diastolicbp').html(p.diastolicbp);
    $('#serum_glucose').html(p.serum_glucose);
    $('#bmi').html(p.bmi);
    $('#motherfamilymemberhistory').html(p.motherfamilymemberhistory);
    $('#mothercondition').html(p.mothercondition);
    $('#father').html(p.father);
    $('#fathercondition').html(p.fathercondition);
    $('#genes').html(p.genes);
  };
})(window);
