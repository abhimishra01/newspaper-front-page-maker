// Occasion presets. Text uses {name} and {n}; the page fills them from the Name and number boxes.
// Rules: kind and light only. No crime, politics, health, disasters or real people.
// Paper names are playful so they do not match a real newspaper.

export const FIELDS = [
  { id: 'paper', label: 'Newspaper name', line: true },
  { id: 'motto', label: 'Line under the name', line: true },
  { id: 'earLeft', label: 'Left box (first line is the label)' },
  { id: 'earRight', label: 'Right box (first line is the label)' },
  { id: 'volume', label: 'Volume and number', line: true },
  { id: 'date', label: 'Date line', line: true },
  { id: 'price', label: 'Price', line: true },
  { id: 'kicker', label: 'Word above the headline', line: true },
  { id: 'headline', label: 'Headline' },
  { id: 'deck', label: 'Subheadline' },
  { id: 'byline', label: 'Byline', line: true },
  { id: 'body', label: 'Main story' },
  { id: 'caption', label: 'Photo caption' },
  { id: 'sideHead', label: 'Second story headline' },
  { id: 'sideBody', label: 'Second story' },
  { id: 'sideCaption', label: 'Second photo caption' },
  { id: 'teasers', label: 'Inside strip (one item per line)' },
  { id: 'notice', label: 'Fictional label', line: true },
];
export const FIELD_IDS = FIELDS.map((f) => f.id);

const NOTICE = 'Novelty print. Fictional.';

export const PRESETS = {
  birthday: {
    label: 'Birthday', name: 'Sam', n: '40', numLabel: 'Age',
    paper: 'The Birthday Bugle',
    motto: 'Loud news for a big day',
    earLeft: 'Weather\nSunny, with a 100% chance of cake',
    earRight: 'Special edition\nOne copy, made with love',
    volume: 'Vol. {n}, No. 1',
    price: 'Price: one hug',
    kicker: 'Extra! Extra!',
    headline: '{name} Turns {n}, Town Declares a Holiday',
    deck: 'Candles counted, cake confirmed, and friends agree this is the best year yet',
    byline: 'By the Party Desk',
    body: 'Friends and family gathered today to mark a very big day: {name} is now {n}. Witnesses report loud singing, slightly off key, and more candles than the cake could safely hold.\nLocal experts were asked how {name} looks so good at {n}. "We have no idea," said one guest, reaching for a second slice. "It must be all the kindness."\nThe party is expected to go late. Neighbors have been warned about the music. A spokesperson for the family confirmed that gifts are still welcome, and that hugs count as gifts.\nAt press time, {name} was seen making a wish. Its content remains top secret.',
    caption: '{name}, seen here moments before the cake arrived',
    sideHead: 'Study Finds {name} Still Young at Heart',
    sideBody: 'A new study by the people who love {name} most has found that age is just a number. The team checked dance moves, jokes and laugh volume. All three were found to be "better than ever." The study will be repeated next year, with cake.',
    sideCaption: 'A rare photo from the archives',
    teasers: 'Inside today\nThe cake report, page 2\nGifts we loved, page 4\nBest dance moves, page 6',
    notice: NOTICE,
  },
  anniversary: {
    label: 'Anniversary', name: 'Sam and Alex', n: '25', numLabel: 'Years',
    paper: 'The Anniversary Herald',
    motto: 'Still the best story in town',
    earLeft: 'Forecast\nWarm, with love all week',
    earRight: 'Collector\'s edition\nFor two readers only',
    volume: 'Vol. {n}, No. 1',
    price: 'Price: one dance',
    kicker: 'Special report',
    headline: '{name} Celebrate {n} Years Together',
    deck: 'Couple still laughs at the same old jokes, sources confirm',
    byline: 'By the Family News Team',
    body: 'It is official: {name} have reached {n} years together. Friends say the secret is simple. They still hold hands, they still share dessert, and they still argue about the thermostat.\nThe couple first met long ago, and the story has grown better with every telling. Family members report that the details change a little each year, and that nobody minds.\nA party is planned with good food, old photos and a toast or two. Guests are asked to bring their best memory of the pair. Tissues will be provided.\nWhen asked for comment, {name} smiled and said, "Here is to the next {n}."',
    caption: '{name}, still the best team in town',
    sideHead: 'Experts Rate the Couple: Ten Out of Ten',
    sideBody: 'A panel of children, grandchildren and close friends met this week to rate the couple. Scores were high in every area, from kindness to cooking. One judge gave extra points for "excellent hugs." The panel was not able to find a single weak spot.',
    sideCaption: 'The happy couple, years ago',
    teasers: 'In this edition\nHow they met, page 2\nThe wedding photos, page 3\nAdvice for the next generation, page 5',
    notice: NOTICE,
  },
  retirement: {
    label: 'Retirement', name: 'Pat', n: '30', numLabel: 'Years of work',
    paper: 'The Retirement Review',
    motto: 'No alarm clocks since today',
    earLeft: 'Weather\nClear skies, every weekday',
    earRight: 'Farewell edition\nKeep this copy',
    volume: 'Vol. {n}, Final issue',
    price: 'Price: free time',
    kicker: 'Big news',
    headline: '{name} Retires After {n} Great Years',
    deck: 'The office plants, the good stapler and the corner desk will need new homes',
    byline: 'By the Break Room Reporter',
    body: 'After {n} years of hard work, {name} has officially clocked out. Coworkers gathered to say goodbye, share stories and finish the last of the good coffee.\n"{name} always had the answer," said one teammate. "We still do not know where the spare keys are kept, but we will figure it out."\nPlans for retirement include long walks, late breakfasts and more time with family. A source close to {name} says the golf clubs have already been cleaned.\nThe team wishes {name} the very best. The desk will never be as tidy again.',
    caption: '{name} on the last day, smiling for the camera',
    sideHead: 'Team Asks: Who Will Fix the Printer Now?',
    sideBody: 'With {name} retiring, the team faces a hard question. Who will know how to fix the printer? Who will remember every birthday? A meeting has been planned to discuss it. Early reports say there will be cake at the meeting.',
    sideCaption: 'The famous desk, now available',
    teasers: 'Inside\nBest moments, page 2\nNotes from the team, page 3\nRetirement plans, page 7',
    notice: NOTICE,
  },
  graduation: {
    label: 'Graduation', name: 'Jordan', n: '2026', numLabel: 'Class year',
    paper: 'The Graduate Gazette',
    motto: 'Caps off to the class of {n}',
    earLeft: 'Forecast\nBright future ahead',
    earRight: 'Graduation edition\nFrame this copy',
    volume: 'Vol. 1, No. {n}',
    price: 'Price: one diploma',
    kicker: 'Extra! Extra!',
    headline: '{name} Graduates! Class of {n} Celebrates',
    deck: 'Years of study, late nights and many snacks lead to a very big day',
    byline: 'By the Campus Desk',
    body: 'Today {name} crossed the stage and became a proud member of the class of {n}. Family and friends cheered loud enough to be heard in the parking lot.\nTeachers describe {name} as hard working, curious and always ready with a good question. Classmates add that {name} also knew the best place for lunch.\nThe road was not always easy. There were early mornings, long papers and at least one all-night study session. All of it paid off today.\nWhat comes next? {name} says the plan is big, the dreams are bigger, and the first step is a long nap.',
    caption: '{name}, ready for what comes next',
    sideHead: 'Proud Family Runs Out of Tissues',
    sideBody: 'Supplies of tissues ran low today as the family of {name} watched the ceremony. One relative said, "I was fine until they said the name." Extra boxes have been ordered for the party later this week.',
    sideCaption: 'The first day of school, many years ago',
    teasers: 'Inside\nThe big speech, page 2\nWhat is next, page 4\nParty details, page 6',
    notice: NOTICE,
  },
  baby: {
    label: 'New baby', name: 'Baby Riley', n: '', numLabel: '',
    paper: 'The Cradle Courier',
    motto: 'Small reader, big news',
    earLeft: 'Weather\nCozy, with light naps',
    earRight: 'First edition\nFor the baby book',
    volume: 'Vol. 1, No. 1',
    price: 'Price: one lullaby',
    kicker: 'It is here!',
    headline: 'Welcome, {name}! Family Grows by One',
    deck: 'Tiny new arrival takes over the house in record time',
    byline: 'By the Nursery News Desk',
    body: 'The family is proud to announce the arrival of {name}. Early reports describe the new arrival as small, loud and very, very cute.\nThe parents are tired but happy. Sources say the house now runs on a new schedule, set entirely by {name}. Naps are short. Cuddles are long.\nGrandparents have already bought more outfits than one baby can wear. Aunts and uncles are planning their first visits.\nPlease join us in welcoming {name} to the world. Visitors are asked to bring snacks for the parents.',
    caption: '{name}, the newest member of the family',
    sideHead: 'Parents Learn a New Word: Sleep',
    sideBody: 'The new parents have reported a strong interest in a word they used to take for granted. Experts expect sleep to return in a few months. Until then, coffee is welcome at the front door.',
    sideCaption: 'The proud big sibling',
    teasers: 'Inside\nFirst photos, page 2\nName meaning, page 3\nVisiting hours, page 5',
    notice: NOTICE,
  },
  office: {
    label: 'Office joke', name: 'Chris', n: '', numLabel: '',
    paper: 'The Break Room Bulletin',
    motto: 'Fresh coffee, fresher news',
    earLeft: 'Weather\nCool, with a chance of meetings',
    earRight: 'Desk edition\nPlease do not staple',
    volume: 'Vol. 9, No. 5',
    price: 'Price: one donut',
    kicker: 'Breaking',
    headline: '{name} Fixes the Printer on the First Try',
    deck: 'Coworkers stunned as the paper tray works and nobody has to call for help',
    byline: 'By the Office Desk',
    body: 'In a moment that will be remembered for years, {name} walked up to the office printer, pressed one button and fixed it. On the first try.\n"I have never seen anything like it," said a coworker who had been waiting for 20 minutes. "The paper just came out. In the right order."\nManagers are now asking {name} to look at the coffee machine and the conference room screen. {name} has not answered these requests.\nThe printer, when asked for comment, made a small humming sound and jammed again.',
    caption: '{name}, moments after the fix',
    sideHead: 'Mystery of the Missing Stapler Solved',
    sideBody: 'After three long weeks, the red stapler has been found in the break room, next to the cookie jar. Nobody knows how it got there. The team has agreed to stop asking questions and enjoy the cookies.',
    sideCaption: 'The stapler, safe at last',
    teasers: 'Inside\nMeeting of the week, page 2\nLunch reviews, page 3\nDesk plant news, page 5',
    notice: NOTICE,
  },
  blank: {
    label: 'Blank', name: '', n: '', numLabel: '',
    paper: 'The Daily Page',
    motto: 'Your words, your front page',
    earLeft: 'Weather\nWrite your forecast here',
    earRight: 'Edition\nWrite a short note here',
    volume: 'Vol. 1, No. 1',
    price: 'Price: free',
    kicker: 'Extra',
    headline: 'Write Your Headline Here',
    deck: 'Tap any text on the page to change it',
    byline: 'By Your Name',
    body: 'Tap this story to write your own. Each line break starts a new paragraph.\nYou can change every word on this page: the newspaper name, the date, the price, the small boxes beside the name and the strip at the bottom.',
    caption: 'Write a photo caption here',
    sideHead: 'A Second Story Goes Here',
    sideBody: 'Tap here to write a short second story.',
    sideCaption: 'Second photo caption',
    teasers: 'Inside\nItem one\nItem two\nItem three',
    notice: NOTICE,
  },
};
export const PRESET_IDS = Object.keys(PRESETS);

// "Surprise me": other kind headline and subheadline pairs for each occasion.
export const SURPRISE = {
  birthday: [
    ['Scientists Confirm {name} Gets Better Every Year', 'New data shows a steady rise in charm, wit and cake intake'],
    ['{name} Hits {n}, Cake Industry Celebrates', 'Bakers report record demand for candles this week'],
    ['Local Legend {name} Reaches Level {n}', 'Friends say the new level unlocks naps and better snacks'],
    ['Breaking: {name} Is {n} and Still the Coolest', 'Survey of close friends finds the result was never in doubt'],
    ['{name} Celebrates {n} Years of Being Awesome', 'Party planned, playlist ready, dance floor cleared'],
    ['Town Bakes Its Biggest Cake Yet for {name}', 'Candle count reaches {n}; smoke alarm politely ignored'],
  ],
  anniversary: [
    ['{name}: {n} Years and Still Holding Hands', 'Friends say the pair is cuter now than on day one'],
    ['Love Story of {name} Reaches Chapter {n}', 'Readers agree it is the best story in town'],
    ['{name} Mark {n} Years of Sharing Dessert', 'Experts confirm the last bite is still split fairly'],
    ['Breaking: {name} Still Laugh at Each Other\'s Jokes', 'Even the old ones, a close source reports'],
  ],
  retirement: [
    ['{name} Trades Meetings for Mornings Off', 'Calendar now booked with naps, walks and long lunches'],
    ['After {n} Years, {name} Logs Off for Good', 'Team promises to water the desk plant every day'],
    ['Office Loses Its Best Storyteller as {name} Retires', 'The coffee breaks will never be the same'],
    ['{name} Begins Full-Time Career in Relaxing', 'First day on the new job described as a big success'],
  ],
  graduation: [
    ['Class of {n}: {name} Did It!', 'Diploma in hand, the future looks very bright'],
    ['{name} Earns Diploma, Family Earns Bragging Rights', 'Phone storage now full of ceremony photos'],
    ['Hats Fly High as {name} Graduates', 'Several caps still missing; search continues'],
    ['{name} Closes the Books and Opens a New Chapter', 'Next stop: the big world, after a short nap'],
  ],
  baby: [
    ['{name} Arrives and Wins Every Heart', 'Tiny fingers, tiny toes, very big fan club'],
    ['Family Welcomes Its New Boss, {name}', 'First orders: milk, cuddles and a nap, in that order'],
    ['Small Wonder {name} Takes Over the House', 'Parents agree the new schedule is not open for talks'],
    ['Hello, World! {name} Makes a Grand Entrance', 'Grandparents report the best day in years'],
  ],
  office: [
    ['{name} Reaches Inbox Zero, Office Stunned', 'Coworkers ask for the secret; {name} only smiles'],
    ['{name} Brings Donuts, Morale Hits Record High', 'Meeting attendance up 300 percent, sources say'],
    ['{name} Ends Meeting Five Minutes Early', 'Team calls it the best day of the quarter'],
    ['{name} Remembers Everyone\'s Coffee Order', 'Experts call it a rare and wonderful talent'],
  ],
  blank: [
    ['Write Your Own Headline Here', 'Then tap the subheadline to change it too'],
    ['Big News Goes Here', 'Tap any text on the page to change it'],
  ],
};

// Words that must never appear in presets or surprise lines (checked by npm test).
export const BLOCKED = ['kill', 'killed', 'dead', 'death', 'die', 'dies', 'murder', 'arrest', 'arrested', 'police', 'crime', 'criminal', 'shoot', 'shooting', 'gun', 'bomb', 'war', 'terror', 'president', 'election', 'vote', 'senator', 'covid', 'virus', 'cancer', 'disease', 'crash', 'flood', 'earthquake', 'hurricane', 'scandal', 'fraud', 'prison', 'jail', 'drugs', 'sex', 'nude', 'hate', 'fired', 'lawsuit', 'injured', 'hospital'];

/** Fill {name} and {n}. An empty name or number leaves a neat line (no double spaces). */
export function fill(text, name, n) {
  return String(text)
    .replace(/\{name\}/g, name || 'Someone')
    .replace(/\{n\}/g, n || '')
    .replace(/ {2,}/g, ' ')
    .replace(/ ([,.!?])/g, '$1')
    .trim();
}

/** All text fields for a preset with a name and number. Returns { fields, gen } (gen = what was generated). */
export function presetFields(id, name, n) {
  const p = PRESETS[id] || PRESETS.blank;
  const fields = {};
  for (const f of FIELD_IDS) fields[f] = f === 'date' ? '' : fill(p[f] ?? '', name, n);
  return { fields, gen: { ...fields } };
}

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * The name (or number) changed from `from` to `to`. Untouched fields are rebuilt from the preset;
 * fields the user edited get a whole-word swap of the old value.
 */
export function swapValue(fields, gen, presetId, name, n, from, to) {
  const fresh = presetFields(presetId, name, n).fields;
  const out = { ...fields };
  const nextGen = { ...gen };
  for (const f of FIELD_IDS) {
    if (f === 'date') continue;
    if (fields[f] === gen[f]) { out[f] = fresh[f]; nextGen[f] = fresh[f]; continue; }
    if (from && to !== undefined) {
      const re = new RegExp(`(^|[^\\p{L}\\p{N}])${esc(from)}(?=$|[^\\p{L}\\p{N}])`, 'gu');
      out[f] = fields[f].replace(re, (_, pre) => pre + to);
    }
  }
  return { fields: out, gen: nextGen };
}

/** Pick a surprise pair different from the current headline. `rand` is injectable for tests. */
export function surprise(presetId, name, n, currentHeadline, rand = Math.random) {
  const pool = (SURPRISE[presetId] || SURPRISE.blank).map(([h, d]) => [fill(h, name, n), fill(d, name, n)]);
  const choices = pool.filter(([h]) => h !== currentHeadline);
  const list = choices.length ? choices : pool;
  return list[Math.floor(rand() * list.length) % list.length];
}
