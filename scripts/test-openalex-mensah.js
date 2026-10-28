const https = require('https');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'AfriJournalBot/1.0 (mailto:admin@afrijournalindexing.org)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function testOpenAlexMensah() {
  console.log("Searching OpenAlex for George A. Mensah...");
  try {
    const search = await fetchJson("https://api.openalex.org/authors?search=George+A.+Mensah&per-page=1&api_key=eP5PAl4g8tOWuRjhyo7hMY");
    const author = search.results?.[0];
    console.log("Author found:", author?.display_name, "ID:", author?.id, "Works:", author?.works_count, "Citations:", author?.cited_by_count);

    if (author?.id) {
      const works = await fetchJson(`https://api.openalex.org/works?filter=author.id:${author.id.replace('https://openalex.org/', '')}&sort=cited_by_count:desc&per-page=10&api_key=eP5PAl4g8tOWuRjhyo7hMY`);
      console.log(`Fetched ${works.results?.length || 0} top works for Mensah:`);
      works.results?.forEach((w, i) => {
        console.log(`[${i+1}] (${w.publication_year}) [${w.cited_by_count} cites] ${w.title}`);
        console.log(`    Venue: ${w.primary_location?.source?.display_name} | DOI: ${w.doi}`);
      });
    }
  } catch (e) {
    console.error("OpenAlex error:", e.message);
  }
}

testOpenAlexMensah();
