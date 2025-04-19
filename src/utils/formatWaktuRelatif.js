/**
 * Formats the given number of seconds into a relative time string of hours, minutes, and seconds.
 *
 * @param {number} detik - The number of seconds to be formatted
 * @return {string} The formatted relative time string
 */
function formatWaktuRelatif(detik) {
  var jam = Math.floor(detik / 3600);
  var sisaDetik = detik % 3600;
  var menit = Math.floor(sisaDetik / 60);
  var detikSisa = sisaDetik % 60;

  var waktuRelatif = "";

  if (jam > 0) {
    waktuRelatif += jam + " jam ";
  }

  if (menit > 0 || jam > 0) {
    waktuRelatif += menit + " menit ";
  }

  waktuRelatif += detikSisa + " detik";

  return waktuRelatif;
}

export default formatWaktuRelatif;
