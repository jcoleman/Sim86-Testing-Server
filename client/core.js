Sim = {};
Sim.UI = {};
Sim.UI.Templates = {};

hex = function(number, zeroExtend) {
  if (number === null || number === undefined) {
    return '';
  }
  
  var hs = (number || 0).toString(16);
  if (!zeroExtend && hs.length < 4) {
    hs = ('0'.times(4 - hs.length)) + hs;
  }
  return '0x' + hs;
};
