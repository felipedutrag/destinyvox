async function main() {
  const res = await fetch('https://www.redditstatic.com/ads/pixel.js');
  const text = await res.text();
  console.log('Script size:', text.length);

  // Search for track handler
  const trackIdx = text.indexOf('rdt(');
  console.log('rdt index:', trackIdx);

  // Search for strings in array E
  // Find all occurrences of valid standard events in pixel.js
  const regex = /"PageVisit"|"ViewContent"|"Search"|"AddToCart"|"AddToWishlist"|"Purchase"|"Lead"|"SignUp"|"Custom"/g;
  let matches = [];
  let m;
  while ((m = regex.exec(text)) !== null) {
    matches.push({ event: m[0], pos: m.index, snippet: text.substring(m.index - 50, m.index + 100) });
  }
  console.log('Standard events in script:', matches.length);
  matches.forEach(m => console.log(m.event, m.snippet));
}
main();
