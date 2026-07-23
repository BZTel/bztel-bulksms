import { prisma } from './prisma';

const words = [
  "0803","0pay","131","180","1stbank","1xbet","272","777","ab more","ab parlay e",
  "abuad","access","access bank","access plc","accessb","accessban","accessbank","accessbenk","accessbnk",
  "accessbonk","accessplc","accionbank","acct","acesbankplc","acessbank","acessmobil","acessmobile",
  "acessplc","acesssbanks","adclick","adclick int","adminpaxful","advansbank","afunanya","agip nig",
  "air cargo","aircargo","airdroid","airtel","airtelng","alatbywema","alert","alerthsbc","alertz",
  "aliexpress","alilvisas","alphabank","alrajhi","amazon","america","android","anonymous","anysid",
  "app1e","appie","appieuk","apple","apple inc","apple store","applemap","appleuk","army","atm",
  "atmalert","atmbio","atmcard","atmoney","atmteam","atmunit","atmupgrade","authpaxful","avisos",
  "ba","babcock","babcock uni","bacargo","banc","bank","bank details","bank loan","bank mgnt",
  "bank of ame","barclay","bclays","bet9ja","bill gate","billgate","bio","bitcoin","biu","biu info",
  "bivi","bkash","blackberry","blockchain","boa","boflox","boifundtran","bonuspax","british",
  "british air","british wcs","britishair","britishaps","britishways","brt","bvn","bvnalert",
  "bvnupdate","caixa","caixabanco","calxa","camexpress","canada","cantonfair","capitec sms",
  "cardalert","cardupdate","cashpay","cb ntransfe","cba","cbn","cbn nigeria","cbnbvn","cbnetwork",
  "cbnp","cbntransfer","cgtcare","channels tv","chipper","chippercash","ci0ud","cihbank","cioud",
  "citi","citibank","cl0ud","cmcopifairt","cocacola","comowealth","congrats","congratulation",
  "congratulations","contactme","corleone","courier","court","covenantbank","cpinel","cr","cr ng",
  "cr ngn","cr opa","cr pay","cr pays","crc credit","credit","creditalert","crime","crypto",
  "crypto prof","cryto prof","custom bank","custom ng","customhq","customs","dangote","delivate",
  "delivery","destitute","dgss","dhl","dhl express","dhl temu","dhlairways","dhln","dhlnigeria",
  "diam0nd","diamond","diamondbank","dotbank","dr","dss","ea cargo","easemoni","easy access",
  "easyaccess","ecoban","ecobank","ecobank plc","efcc","efcc ng","eft payment","embassy","emirate",
  "emirates","emmirates","empirebank","etisalat","etisalat ng","examdesk","exness","express",
  "express biz","expressbiz","expressexch","expresspay","exxonmobil","f1rstbank","facabook",
  "facbook","facebook","facelock","fairmoneybank","fargo bank","fb","fbh","fbi","fbi agent",
  "fbn","fbn nigeria","fcmb","fcmb bnk","fcmib","fcsc","fdx","fdxinfo","fdxpay","fedelityban",
  "federal","federal gov","fedex","fgn","fidelity","fidelity ba","fidelitybank","fidelitysms",
  "fidelityykc","finabank","finance","financial","fincabank","finstsbanks","fir stb ank","firsban",
  "first bank","firstb","firstban","firstbank","firstbankcr","firstbankng","firstbnk","firstbonk",
  "firstcity","firstmobile","firstmonie","flatemate","flatmate","flatmates","flrstbank","fnb",
  "fnb sms","fpolynekede","france","fraud","frstbank","fsdh","garvitate","gb","gcash","gigl",
  "gl0","glo","globus bank","globusbank","globusbankparallexbank","glodious","glong","gmail",
  "google","gotv","gravitate","grvsl","gt","gt alert","gtb","gtb banc","gtb bank","gtb cash",
  "gtban","gtbank","gtbank ng","gtbannk","gtbbank","gtbcash","gtbenk","gtbnk","gtbsms","gtc banc",
  "gtcashout","gtco","gtib","gtsbanks","guinness","gumad","gumads","gumtree","gumtreead",
  "gumtreeads","hacker","heritage","heritagebank","horax","hsbc","ici0ud","icioud","icl0ud",
  "icloud","ihelp","ijmb","illuminati","immigration","infinity mfb","infinitybank","info","infofdx",
  "infos","insta","instagram","instagramn","instgram","insurance","intercbn","interlink",
  "interswich","interswitch","ios18","ios26","itaucard","itunes","itunespay","itunespays","jaiz",
  "jaizbank","jamb","jambnotify","jamborgng","jijing","jumbo","jumia","jumia deals","keystone",
  "keystone ba","keystonebank","kinabank","kmb","konga","kredobank","kuda","kuda bank","kudaban",
  "kudabank","kudabankloan","kudaloan","kudamfb","kudi","kudimoney","lacum","ling zhang",
  "linkbvn","loankuda","lost device","lotusbank","ltd","lupuse","lynn","madonna uni","manager uba",
  "mbmaccido","mcafee","mcbilemoney","mfb","mint finex","mintfinexbank","mkobo mfb","mkobobank",
  "mobil ng","mobilemoney","momo","monie","moniepoint","moniepointbank","monipoint","monlpoant",
  "monopiant","monopoat","monopoint","monopoit lt","mtn","mtng","mtnmomo","mtnn","mtnng","mtnnig",
  "mtoken","multpleplus","mutualbank","mxsms","myhermes","naf","nahcon","nairacash","nasrda",
  "nbuild","ncdc","ncs","ncs custom","ncs hqr","ncshq","nda","nff","nig army","nig custom",
  "nig navy","nigerianavy","nimc","nin","nipost","nis","nis2018","nklondon","nmfb","nnr2017",
  "nokia","nokiauk","noreply","notify","novabank","novo","nxsms","octa","olxng","op","opaco",
  "opacy","opay","opay gadi","opaybank","opayco","opaycom","opayinfo","opaylnfo","opayng",
  "opaynig","opaynigeria","opely","openy ltd","opey","opey ltd","opey one","optimusbank","otp",
  "p4xful","paga","palmcredit","palmpaaye","palmpah","palmpat","palmpay","parcel","paxful",
  "pay stack","payatavke","paymentcom","payments","paypal","paystack","paystacke","pcgs1",
  "peacebank","pearlbank","peoplesbank","piggyvest","polaris","polarisbank","police","police ng",
  "policecid","policeng","postnl","powcash ltd","premiumbank","providus","providusbank",
  "quicktelier","quickteller","rabobank","randbank","ravenbank","redcentral","rephidimbank",
  "rexbank","rexpress","roombuddies","rubies","rubies bank","rubiesbank","samantha","samsung",
  "samsungco","sbgl","scb","shell","shephardbank","sicoob","skyebank","smartcash","smartkash",
  "smsa","smstext","snapchat","spareroom","sparkasse","sparklebank","spdc","spybank","stanbic",
  "stanbicibtc","standard td","standardbnk","standardchateredbank","standardltd","sterling",
  "sterlingbank","suntrstbank","suntrustbank","swifmonie","swift monie","swiftmt103","custom ng",
  "camexpress","peoplesbank","paga","nbuild","examdesk","gtbcash","cashpay","gtb","gtb cash",
  "cashpay","acessbank","air cargo","gtbannk","zenith3ank","zenithin","uae embassy","ncdc",
  "accessbnk","access bank","access bank","access","access","accessbank","accessbank","zenlthbank",
  "biu info","boa","fbi","dhl express","fedex","ups","ijmb","yahoo","globus bank","globusbank",
  "globusbankparallexbank","glodious","glong","gmail","google","gotv","gravitate","grvsl","gt",
  "gt alert","gtb","gtb banc","gtb bank","gtb cash","gtban","gtbank","gtbank ng","gtbannk",
  "gtbbank","gtbcash","gtbenk","gtbnk","gtbsms","gtc banc","gtcashout","gtco","gtib","gtsbanks",
  "guinness","gumad","gumads","gumtree","gumtreead","gumtreeads","hacker","heritage","heritagebank",
  "horax","hsbc","ici0ud","icioud","icl0ud","icloud","ihelp","ijmb","illuminati","immigration",
  "infinity mfb","infinitybank","info","infofdx","infos","insta","instagram","instagramn",
  "instgram","insurance","intercbn","interlink","interswich","interswitch","ios18","ios26",
  "itaucard","itunes","itunespay","itunespays","jaiz","jaizbank","jamb","jambnotify","jamborgng",
  "jijing","jumbo","jumia","jumia deals","keystone","keystone ba","keystonebank","kinabank",
  "kmb","konga","kredobank","kuda","kuda bank","kudaban","kudabank","kudabankloan","kudaloan",
  "kudamfb","kudi","kudimoney","lacum","ling zhang","linkbvn","loankuda","lost device","lotusbank",
  "lupuse","lynn","madonna uni","manager uba","mbmaccido","mcafee","mcbilemoney","mfb","mint finex",
  "mintfinexbank","mkobo mfb","mkobobank","mobil ng","mobilemoney","momo","monie","moniepoint",
  "moniepointbank","monipoint","monlpoant","monopiant","monopoat","monopoint","monopoit lt",
  "mtn","mtng","mtnmomo","mtnn","mtnng","mtnnig","mtoken","multpleplus","mutualbank","mxsms",
  "myhermes","naf","nahcon","nairacash","nasrda","nbuild","ncdc","ncs","ncs custom","ncs hqr",
  "ncshq","nda","nff","nig army","nig custom","nig navy","nigerianavy","nimc","nin","nipost",
  "nis","nis2018","nklondon","nmfb","nnr2017","nokia","nokiauk","noreply","notify","novabank",
  "novo","nxsms","octa","olxng","op","opaco","opacy","opay","opay gadi","opaybank","opayco",
  "opaycom","opayinfo","opaylnfo","opayng","opaynig","opaynigeria","opely","openy ltd","opey",
  "opey ltd","opey one","optimusbank","otp","p4xful","paga","palmcredit","palmpaaye","palmpah",
  "palmpat","palmpay","parcel","paxful","pay stack","payatavke","paymentcom","payments","paypal",
  "paystack","paystacke","pcgs1","peacebank","pearlbank","peoplesbank","piggyvest","polaris",
  "polarisbank","police","police ng","policecid","policeng","postnl","powcash ltd","premiumbank",
  "providus","providusbank","quicktelier","quickteller","rabobank","randbank","ravenbank",
  "redcentral","rephidimbank","rexbank","rexpress","roombuddies","rubies","rubies bank",
  "rubiesbank","samantha","samsung","samsungco","sbgl","scb","shell","shephardbank","sicoob",
  "skyebank","smartcash","smartkash","smsa","smstext","snapchat","spareroom","sparkasse",
  "sparklebank","spdc","spybank","stanbic","stanbicibtc","standard td","standardbnk",
  "standardchateredbank","standardltd","sterling","sterlingbank","suntrstbank","suntrustbank",
  "swifmonie","swift monie","swiftmt103","tajbank","textsms","thaiboxing","tiktok","titanbank",
  "tnsms","tnxsms","transaction","tresco","tsb bri","twinkas","twitter","txnsms","txsms",
  "tyme plc","tymebnk","uae embassy","uba","uba bank","uba frica","uba ngn","uba nig","ubafrica",
  "ubaplc","ubasbanks","ubia","ufcl","unilag","union banc","union bank","unionban","unionbank",
  "unionbnk","unionbonk","uniosun","united capi","united plc","unitedbanks","unity bank",
  "unitybank","unlock app","unlockapp","updateal","updateale","updateatm","updatedata","updateun",
  "ups","usa export","usa securit","usaembassy","uscustom","usps","utme 55019","vfcash",
  "vfd mfb","vfdbank","vvv","w0n","waec","webapp","weller","wemaban","wemabank","wespac",
  "western un","western uni","westpac","whatsapp","wmeo","world bank","worldbank","wutransfer",
  "yahoo","yello","youfirst","your acc","your acct","youtube","zaih","zaihcach","zain","zaincash",
  "zalncach","zanicach","zen","zen app","zen ith","zenith","zenith bank","zenith life","zenith plc",
  "zenith3ank","zenithban","zenithbank","zenithbanks","zenithbonk","zenithin","zenlthbank",
  "ziahcach","ziva","znth bnk","zorex"
];

// Short/generic keywords that can cause false positives if matched as substrings
const genericOrShortWords = new Set([
  "cr", "dr", "op", "gt", "gb", "ba", "fb", "uba", "glo", "cba", "boa", "ltd",
  "alert", "link", "citi", "police", "court", "crime", "bank", "banc", "info", "infos", "sms",
  "0803", "777", "180", "131", "272", "bio", "scb", "fnb", "fbn", "cbn", "bvn", "otp", "fgn", "fbi", "ups", "nin"
]);

// Short keywords representing actual brand prefixes/suffixes (e.g. mtn, glo, uba)
const brandShortWords = new Set([
  "mtn", "glo", "dhl", "gtb", "cbn", "bvn", "uba", "fbn", "scb", "fnb", "fay"
]);

// Whitelisted words to ignore startsWith/endsWith checks for brand short words
const brandWordWhitelist = new Set([
  "global", "globe", "glorious", "glory", "glow", "gloom", "cuban", "tuba", "subagent", "garbage"
]);

// Determine classification for message body
const wholeWordKeywords = words.filter(
  (w) => genericOrShortWords.has(w) || w.length <= 3
);
const substringKeywords = words.filter(
  (w) => !genericOrShortWords.has(w) && w.length > 3
);

export interface VerificationResult {
  blocked: boolean;
  reason?: string;
}

/**
 * Checks senderId and message body for unauthorized / blocklisted words.
 */
export function checkContent(senderId: string, message: string): VerificationResult {
  const rawSender = senderId.toLowerCase().trim();
  const cleanSender = rawSender.replace(/[^a-z0-9]/g, '');

  // Split Sender ID by camelCase or non-alphanumeric to get distinct word tokens
  const senderTokens = senderId
    .split(/(?=[A-Z][a-z])|(?<=[a-z])(?=[A-Z])|(?<=[0-9])(?=[a-zA-Z])|(?<=[a-zA-Z])(?=[0-9])|[^a-zA-Z0-9]/)
    .map((w) => w.toLowerCase().trim())
    .filter(Boolean);

  const cleanMsg = message.toLowerCase().replace(/[^a-z0-9]/g, ' ');
  const paddedMsg = ` ${cleanMsg.replace(/\s+/g, ' ').trim()} `;
  const unspacedMsg = cleanMsg.replace(/\s+/g, '');

  // 1. Check Sender ID
  for (const kw of words) {
    const cleanKw = kw.replace(/[^a-z0-9]/g, '');
    if (!cleanKw) continue;

    // A. Check exact match or word-split match in sender tokens
    if (senderTokens.includes(cleanKw)) {
      return { blocked: true, reason: `Sender ID contains blocked word "${kw}" as a token` };
    }

    // B. Check short brand prefix/suffix match (e.g. GLO-SMS, MYGLO)
    if (brandShortWords.has(cleanKw)) {
      if (cleanSender.startsWith(cleanKw) || cleanSender.endsWith(cleanKw)) {
        if (!brandWordWhitelist.has(cleanSender)) {
          return { blocked: true, reason: `Sender ID matches brand prefix/suffix "${kw}"` };
        }
      }
    }

    // C. Check long keyword substring matches (e.g. firstbank)
    if (kw.length > 3 && !genericOrShortWords.has(kw)) {
      if (cleanSender.includes(cleanKw)) {
        return { blocked: true, reason: `Sender ID contains blocked word "${kw}"` };
      }
    }
  }

  // 2. Check Message Body
  // Whole word checks
  for (const kw of wholeWordKeywords) {
    const cleanKw = kw.replace(/[^a-z0-9]/g, ' ').trim();
    if (paddedMsg.includes(` ${cleanKw} `)) {
      return { blocked: true, reason: `Message contains blocked word "${kw}" (whole word)` };
    }
  }

  // Substring checks (ignoring spaces/punctuation)
  for (const kw of substringKeywords) {
    const cleanKw = kw.replace(/[^a-z0-9]/g, '');
    if (unspacedMsg.includes(cleanKw)) {
      return { blocked: true, reason: `Message contains blocked word "${kw}"` };
    }
  }

  return { blocked: false };
}

/**
 * Suspends user account and logs an audit record detailing the violation.
 */
export async function suspendUser(userId: number, senderId: string, message: string): Promise<void> {
  const preview = message.substring(0, 100) + (message.length > 100 ? '...' : '');
  
  await prisma.$transaction(async (tx) => {
    // 1. Update user status to suspended
    await tx.user.update({
      where: { id: userId },
      data: { status: 'suspended' },
    });

    // 2. Write security alert to audit logs
    await tx.auditLog.create({
      data: {
        userId: userId,
        action: 'USER_SUSPENDED',
        details: `Account automatically suspended due to policy violation: blocked SMS content. Sender: "${senderId}". Message preview: "${preview}"`,
      },
    });
  });
}
