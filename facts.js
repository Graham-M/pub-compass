// Factoids for a pub: a headline (from its tags or its name) plus small "chips".
// Name trivia is about the *name*, never invented facts about a specific pub.

const SUFFIX = "( inn| tavern| hotel| pub| public house| bar)?";
const name = (core) => new RegExp(`^${core}${SUFFIX}$`);

/** [pattern on the normalised name, fact]. First match wins, so specific names go before general ones. */
export const NAME_TRIVIA = [
  [name("red lion"), "Britain's most common pub name. It's often traced to 1603, when James I is said to have ordered Scotland's heraldic red lion displayed on public buildings."],
  [name("royal oak"), "Named after the oak tree at Boscobel where Charles II hid from Parliamentarian soldiers after losing the Battle of Worcester in 1651."],
  [name("white hart"), "The white hart was Richard II's badge. In 1393 he made it compulsory for alehouses to display a sign, and plenty picked their king's emblem."],
  [name("rose and crown"), "The Tudor rose under a crown celebrates Henry VII uniting the houses of York and Lancaster after the Wars of the Roses."],
  [name("(the )?crown"), "One of Britain's most common pub names: a simple show of loyalty to the monarch."],
  [name("kings? head"), "Usually Henry VIII, but check the sign: which king it is varies from pub to pub."],
  [name("queens? head"), "Often Elizabeth I, though the sign can show whichever queen the landlord fancied."],
  [name("(the )?plough"), "A farming name. Plough Monday, the first Monday after Twelfth Night, traditionally marked the return to work in the fields after Christmas."],
  [name("coach and horses"), "A coaching-era name. From the 17th to the 19th century, inns on coach routes changed horses and fed weary passengers."],
  [name("(the )?(railway|station)( arms| hotel| tavern)?"), "Built for the Victorian railway boom, to catch thirsty passengers coming off the train."],
  [name("swan with two necks"), "Probably a mangling of 'two nicks': the Vintners' Company marks its Thames swans with two nicks on the beak at the annual swan upping."],
  [name("(black |white )?swan"), "Swans are royal birds: the Crown has claimed unmarked mute swans on open water since the Middle Ages."],
  [name("(the )?george( and dragon)?"), "Named for St George, England's patron saint. Dragon optional."],
  [name("green man"), "The Green Man is a face made of leaves, a folk figure carved into churches all over England and possibly older than Christianity here."],
  [name("cross keys"), "Crossed keys are the emblem of St Peter, keeper of the keys of heaven, often a sign of a pub's church connections."],
  [name("lamb and flag"), "The Lamb of God carrying a banner: a Christian emblem also used by the Knights Templar."],
  [name("nags? head"), "A nag is a small riding horse. Inns that hired them out may have advertised it on the sign."],
  [name("marqu(is|ess) of granby"), "John Manners, Marquess of Granby, was an 18th-century general said to have helped his old soldiers set up as publicans. They thanked him with the sign."],
  [name("duke of wellington"), "Honours the victor of Waterloo in 1815, who went on to be Prime Minister twice."],
  [name("prince of wales"), "Honours the heir to the throne. The title has gone to the monarch's eldest son since 1301."],
  [name("three horseshoes"), "A blacksmith's name: there was often a forge next door, so you could have a drink while your horse was shod."],
  [name("(fox|hare) and hounds"), "A hunting name. Pubs like this were often the meeting point for the local hunt."],
  [name("white horse"), "The white horse is on the arms of Kent, and was the emblem of the House of Hanover, which gave Britain its Georgian kings."],
  [name("(the )?wheatsheaf"), "A harvest symbol of plenty, and a nod to the grain that ends up in your glass."],
  [name("(the )?(ship|anchor)"), "A sailors' name, popular in ports and anywhere a landlord fancied a bit of the sea."],
  [name("chequers"), "One of the oldest pub signs. A chequered board once showed you could count or change money here, and similar boards have been found on taverns in Pompeii."],
  [name("rising sun"), "Possibly a nod to Edward IV's 'sun in splendour' badge: he saw three suns in the sky before winning the Battle of Mortimer's Cross in 1461."],
  [name("greyhound"), "The white greyhound was a Tudor emblem, supporting Henry VII's coat of arms alongside the red dragon."],
  [name("(queen )?victoria"), "Named for Queen Victoria, who reigned from 1837 to 1901, the golden age of British pub building."],
  [name("(prince )?albert"), "Named for Prince Albert, Queen Victoria's husband, who died in 1861."],
  [name("barley mow"), "A barley mow is a stack of harvested barley: the raw material for your pint."],
  [name("three tuns"), "A tun is a huge cask. Three tuns are on the arms of the Vintners' Company, the City of London's wine traders' guild."],
  [name("(lord |admiral )?nelson"), "Honours Admiral Lord Nelson, killed in 1805 at the moment of his victory at Trafalgar."],
  [name("duke of york"), "Often Frederick, Duke of York: the 'Grand Old Duke of York' of the nursery rhyme."],
  [name("bird in (the )?hand"), "From the proverb: a bird in the hand is worth two in the bush."],
  [name("bay horse"), "A bay is a horse with a reddish-brown coat and a black mane and tail."],
  [name("horse and jockey"), "A racing name, often found near a racecourse or training gallops."],
  [name("(horse and groom|waggon and horses|wagon and horses)"), "A coaching and carting name, from the days when horses needed feeding and watering as much as their drivers."],
  [name("(travell?ers rest|halfway house)"), "A road name: built to catch travellers partway through a long journey, back when that meant days, not hours."],
  [name("cricketers( arms)?"), "A cricket name. Pubs like this often face a village green, where the match traditionally finished in the bar."],
  [name("robin hood"), "Named after the legendary outlaw of Sherwood Forest, a pub favourite far beyond Nottinghamshire."],
  [name("crown and anchor"), "The crown and anchor is a Royal Navy emblem, popular with publicans who'd served at sea."],
  [name("beehive"), "Some Beehive pubs had rhyming signs, like 'Within this hive we're all alive, good liquor makes us funny'."],
  [name("(blue |five |six |eight |ring o )?bells?"), "Often found near a church: bell-ringers were thirsty, loyal customers."],
  [/^(golden|white|black|blue|red) lion$|^lion$/, "Lions of every colour turn up on pub signs, borrowed from the coats of arms of local nobles and kings."],
  [/^(black |red )?bulls?( head)?$/, "A cattle name. Pubs like this often stood near markets, where drovers sealed deals over a drink."],
  [/^ye old/, "'Ye' was never pronounced 'yee'. The Y stands in for the old letter thorn (þ), so it just reads 'the'."],
  [/ arms$/, "An 'Arms' pub usually took its name from the coat of arms of a local landowner, or a trade guild that met there."],
  [/ inn$/, "Historically an inn offered beds and stabling, a tavern served wine, and an alehouse sold only ale."],
  [/ (brewery )?tap$|^(brewery )?tap$/, "A brewery tap is a pub attached to a brewery, which is about as fresh as beer gets."],
  [/ club$/, "A members' club. Most welcome visitors who sign in at the bar."],
  [/ tavern$/, "Historically a tavern served wine, an inn offered beds and stabling, and an alehouse sold only ale."],
];

const FALLBACKS = [
  "No known claim to fame. Yet.",
  "History unknown. Go and make some.",
  "An unknown quantity. Report back.",
  "The map knows nothing more. The bar staff might.",
  "No famous ghosts on record. Probably.",
  "Unremarkable on paper. Pubs rarely are.",
  "Its story isn't written down. Ask the regulars.",
  "Nothing on file. Perfect for a quiet one.",
];

export function normaliseName(n = "") {
  return n.toLowerCase().replace(/&/g, "and").replace(/[’'`.,]/g, "").replace(/\s+/g, " ").trim();
}

export function nameFact(pubName) {
  const n = normaliseName(pubName).replace(/^the /, "");
  if (!n) return null;
  for (const [re, fact] of NAME_TRIVIA) if (re.test(n)) return fact;
  return null;
}

const yes = (v) => v === "yes";
const list = (v) =>
  v.split(";").map((s) => s.trim()).filter((s) => s && !/^(various|yes|no|free ?house)$/i.test(s));

/** Small badges from the pub's OSM tags. */
export function chips(tags = {}) {
  const c = [];
  if (yes(tags.microbrewery)) c.push("🍺 Brews its own");
  if (yes(tags.real_ale)) c.push("🛢️ Real ale");
  if (yes(tags.real_cider)) c.push("🍏 Real cider");
  if (yes(tags.real_fire)) c.push("🔥 Real fire");
  if (yes(tags.outdoor_seating) || yes(tags.beer_garden)) c.push("🌳 Outdoor seating");
  if (yes(tags.food)) c.push("🍽️ Food");
  if (yes(tags.dog)) c.push("🐕 Dogs welcome");
  if (yes(tags.live_music)) c.push("🎸 Live music");
  if (/grade/i.test(tags.listed_status || "")) c.push(`📜 ${tags.listed_status.replace(/^grade/i, "Grade")} listed`);
  else if (tags.heritage || tags.listed_status) c.push("📜 Listed building");
  return c;
}

function hash(s) {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return Math.abs(h);
}

/** The best single fact for a pub (Wikipedia is fetched separately and takes priority when it arrives). */
export function headline(pub) {
  const t = pub.tags || {};
  const year = /\b(1[0-9]{3})\b/.exec(t.start_date || "")?.[1];
  if (year && +year < 1950) return `Pouring since ${year}.`;
  if (t.brand && /wetherspoon/i.test(t.brand))
    return "Wetherspoon is reportedly named after a teacher of founder Tim Martin's, who told him he'd never make a success of himself.";
  if (t.old_name) return `Formerly known as ${list(t.old_name)[0] || t.old_name}.`;
  const nf = nameFact(pub.name);
  if (nf) return nf;
  if (!normaliseName(pub.name).replace(/^unnamed pub$/, "")) {
    return "This pub has no name on the map. Ask at the bar, then add it to OpenStreetMap.";
  }
  const brews = list(t.brewery || "");
  if (brews.length) return `Pours ${brews.slice(0, 3).join(", ")}${brews.length > 3 ? " and more" : ""}.`;
  if (year) return `Open since ${year}.`;
  return FALLBACKS[hash(pub.id) % FALLBACKS.length];
}
