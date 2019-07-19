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
        var his = smart.patient.api.fetchAll({
          type: 'FamilyMemberHistory'});

        console.log('patient:');
        console.log(patient)

        $.when(pt, his).fail(onError);
        $.when(pt, his).done(function(patient, his) {
          var byCodes = smart.byCodes(his, 'code');
          console.log("Family Member History:");
          console.log(his);


          var p = defaultPatient();


          //Conditions
          p.motherfamilymemberhistory = getMotherandCondition(his[0]);
          p.mothercondition = getMotherCondition(his[0]);

          p.father= getFather(his[1]);
          p.fathercondition = getFatherCondition(his[1]);

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
      motherfamilymemberhistory: {value: ''},
      mothercondition: {value: ''},
      father: {value: ''},
      fathercondition: {value: ''},

    };
  }
  // Helper Function

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
  }var his = smart.patient.api.fetchAll({
          type: 'FamilyMemberHistory'});
  window.drawVisualization = function(p) {
    $('#holder').show();
    $('#loading').hide();
    $('#motherfamilymemberhistory').html(p.motherfamilymemberhistory);
    $('#mothercondition').html(p.mothercondition);
    $('#father').html(p.father);
    $('#fathercondition').html(p.fathercondition);
  };
})(window);
