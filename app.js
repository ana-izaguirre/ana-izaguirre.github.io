// Page logic: BM25 search, career story, language, theme and fireflies.
// Loaded after the first frame, so the HTML paints without waiting to download or run it.
import {createIndex,search as rank,tokenize,normalize as norm,isHit,surfaceForm} from './js/search.js';
(()=>{
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
// Reduced motion: asked by the system, or by the page's own switch (spec 019).
const osReduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
let reduce=osReduce||document.documentElement.dataset.motion==='off';
const qs=new URLSearchParams(location.search),quiet=qs.has('quiet');
const MAIL='ana.izaguirrematamoros@gmail.com';

/* ---------- i18n: Spanish comes from the HTML itself ---------- */
const ES={};$$('[data-i18n]').forEach(e=>{ES[e.dataset.i18n]=e.textContent});
ES.ph_mini=$('#q-mini').placeholder;
$$('[data-i18n-aria]').forEach(e=>{const k=e.dataset.i18nAria;if(!(k in ES))ES[k]=e.getAttribute('aria-label')});
Object.assign(ES,window.ES_TOP); // the cover may have been translated before the first frame
ES.rp_step='Paso';ES.c_done='Copiado';ES.clear='Limpiar la búsqueda';ES.oops='Algo falló en la búsqueda. Escríbeme y te contesto yo:';ES.to_top='Volver arriba';ES.rp_prev='Paso anterior';ES.rp_next='Paso siguiente';
const EN={...window.EN_TOP,
// Case studies (docs/specs/002). Spanish lives in the markup; keep both in step.
case_open:"See the case",
case_hint:"problem, decisions, architecture, trade-offs, results",
case_hint_b:"problem and results",cta_mail:"Write to me",more_q:"More questions",eb_faq:"FAQ",faq_h:"What I am usually asked",faq_q1:"Where, how and when do you want to work?",faq_q2:"What is your English level?",faq_q3:"Why is there a break since 2025?",faq_q4:"Can I see your code?",faq_a4:"Yes: three own projects, with their decisions and figures, above and at",pm_trainer1_n:"100%",pm_trainer1:"coverage required on the critical modules",pm_trainer2_n:"100%",pm_trainer2:"nightly mutation score, file by file, on the non-negotiable ones",pm_trainer3_n:"0",pm_trainer3:"AI rows left after the E2E that runs the product without AI",pm_mcp1_n:"0.44",pm_mcp1:"recall@3 over 50 questions without the corpus vocabulary",pm_mcp2_n:"50",pm_mcp2:"evaluation questions, every change judged with McNemar's test",pm_mcp3_n:"1",pm_mcp3:"runtime dependency: mcp",pm_latino1_n:"65%",pm_latino1:"coverage as a ratchet: it only goes up",pm_latino2_n:"0",pm_latino2:"data in the browser once signed in",pm_latino3_n:"1",pm_latino3:"access control: the Firestore rules",trust_h:"Has worked at",eb_story:"Journey",eb_ask:"Ask my CV",eb_about:"Profile",eb_proj:"Own work",eb_talk:"Let's talk",idx_a:"Index",st_a:"In figures",st_years:"years in production",st_cos:"companies",st_tech:"technologies",st_own:"own projects",view_l:"Read it as",view_brief:"Hiring",view_deep:"Engineering",
case_src:"Sources in the repository:",
case_p:"Problem",
case_d:"Decisions",
case_a:"Architecture",
case_t:"Trade-offs",
case_r:"Results",
cs_trainer_p:"A personal trainer builds and follows up on workout plans with AI help. A badly adapted plan can injure someone, so the AI cannot have the final say.",
cs_trainer_d1:"The DRAFT → SENT transition does not exist: SENT is only reachable from APPROVED, and only a trainer's action gets there.",
cs_trainer_d2:"The domain only knows the AIProvider interface. \"Gemini\" does not appear in the core, and a test checks it.",
cs_trainer_d3:"A webhook never waits for the AI: receive, store, answer 200, fire separately. Generating takes 10–30 s and Tally retries sooner.",
cs_trainer_d4:"Idempotency through UNIQUE (source, external_id): insert first. A prior check would let two concurrent requests through.",
cs_trainer_a:"Edge Functions on Deno over Supabase Postgres. The core is plain TypeScript: the linter forbids Deno, fetch and npm in it, which is why it runs unchanged under Node in the tests. The interface is Telegram.",
cs_trainer_t1:"With Telegram as the only interface everything runs as service_role and RLS protects nothing: authorization lives in the core, at 100% coverage, denied cases included.",
cs_trainer_t2:"Out of V1 on purpose: a web dashboard, a second AI provider, and any automation without human supervision.",
cs_trainer_r1:"The product works without AI: an E2E walks create, edit, approve and send, and asserts zero rows of AI generations.",
cs_trainer_r2:"100% coverage enforced by CI on the critical modules, and a nightly workflow that requires a 100% mutation score file by file on the non-negotiable ones: authorization, the state machine and Telegram button parsing, among others.",
cs_mcp_p:"A coding agent knows the language, not your system's documentation, and pasting the whole folder into its context is neither practical nor cheap.",
cs_mcp_d1:"SQLite FTS5 instead of a vector database: BM25 over an inverted index from the standard library, with nothing to operate. Embeddings would be an additive phase 2.",
cs_mcp_d2:"Chunks follow headings, each carrying its full path (guide › Setup › Config). One runtime dependency: mcp.",
cs_mcp_a:"An MCP server in Python 3.12 over stdio with three tools: search_docs, list_sources and get_document. The index is a build artefact; the markdown files are the source of truth.",
cs_mcp_t:"Keyword search misses when a question describes a symptom in different words from the documentation. That limit is published, not buried.",
cs_mcp_r1:"recall@1 0.30 and recall@3 0.44 over 50 questions written without the corpus vocabulary. An earlier set scored 0.60/0.87 and measured the question-writing, not the search.",
cs_mcp_r2:"Every change is judged with McNemar's exact test over the questions whose outcome flipped, so noise is never celebrated.",
cs_latino_p:"Latin American students and professionals who migrate need verified scholarships and visa guides with their official source, in Spanish.",
cs_latino_d1:"The product was narrowed on purpose: six screens compile but are not linked, and restoring one is deleting a line in navigation.ts.",
cs_latino_d2:"The Gemini key lives in a minimal Express server that only serves /api/*. Signed-in users get no browser storage; anonymous visitors, one cookie with five display preferences.",
cs_latino_a:"A React 19 SPA built with Vite. The browser talks to Firestore and Firebase Auth directly, and firestore.rules is the only access control. Deployed on Vercel.",
cs_latino_t1:"With no server-side validation layer, the Firestore rules carry all of the security.",
cs_latino_t2:"Every Firestore path falls back to static data on error, and that hid a broken feature for a long time. The rule now is that no failure stays silent.",
cs_latino_r:"In active development, with its own project board. Coverage at 65% as a ratchet: every PR that adds behaviour raises it, never lowers it.",
skip:'Go to the CV',mode_l:'Search in',mode_all:'Whole CV',mode_exp:'Experience',mode_proj:'Projects',mode_skills:'Skills',ans_h:'What my CV says',ask_again:'Ask something else',s_about:'About me',
about1:'Backend and full stack engineer with 8+ years in production, most recently at Allergan Data Labs (AbbVie) and Intel. I work with event-driven architectures on AWS, REST and GraphQL APIs, and AI-assisted development every day.',
about2:'I live in Zaragoza and I am looking for a permanent role: hybrid in Zaragoza or remote from Spain. Available immediately.',ask_h2:'Or tap one of these questions:',
c1:'How did you handle queue and event architecture on AWS?',c2:'What is your experience with on-call and observability with Datadog?',c3:'How do you use AI and agentic development day to day?',c4:'Have you led or mentored engineers?',c5:'Where do you live and what role are you looking for?',c6:'What is your English level?',
how:'Keyword search (BM25) over this very CV, inside your browser. No model is generating text: nothing is made up and every answer cites its source.',
role:'Full stack engineer, backend-focused',loc:'Zaragoza, Spain',
s_perfil:'Profile',
perfil:'Full stack engineer with 8+ years building production systems, most recently at Allergan Data Labs (AbbVie) and Intel. My strength is the backend: event-driven architectures on AWS, REST and GraphQL APIs, and on-call rotations with Datadog. Two years leading and mentoring teams. AI-assisted development in my daily workflow.',
disp:'I live in Zaragoza, Spain. I am looking for a permanent role as a backend or full stack engineer: hybrid in Zaragoza or remote from Spain. Available immediately.',
s_exp:'Experience',hoy:'today',x0_t:'Career break (parenting)',
x0_1:'Full-time parenting after a company-wide layoff. During this time I have published my own backend projects on GitHub.',
x1_1:'End-to-end features with Node.js, GraphQL and TypeScript on the clinic marketing platform.',
x1_2:'High-volume email delivery on an event-driven architecture on AWS (SNS, SQS, Lambda).',
x1_3:'Batch endpoint with multi-tenant, role-based permissions that automated the initial clinic setup.',
x1_4:'Campaign reporting in Snowflake and on-call rotations with Datadog.',
x2_1:'Full stack development (Angular, Node.js) on an internal engineering platform.',
x2_2:"Led the team's CI/CD with Docker, GitHub Actions and Kubernetes.",
x2_3:'Mentoring and onboarding of new engineers, code review practices and test automation with Cypress.',
x3_1:'GraphQL services with Apollo Server, TypeScript and Express for the financing flows; promoted to Senior.',
x3_2:'Asynchronous service-to-service messaging with RabbitMQ and Jest tests on the critical paths.',
x4_1:'Identity verification with AWS Rekognition on a remote-proctoring platform, on a serverless architecture (Lambda, S3, DynamoDB).',
x4_2:'Blackboard LMS integrations in Java EE and MongoDB.',
x5_1:'Node.js services against SAP HANA on the TIMP tax platform, with SAP UI5 front ends. Before that, automated testing in Java and Selenium with JMeter load scenarios, and ABAP development on SAP.',
x6_1:'Full stack development on e-learning platforms with C#, PHP, JSP and MySQL on Linux, including videoconferencing inside the training platform.',
s_proj:'Projects',
p1_1:'Workout planning over Telegram where AI proposes and the trainer decides: a state machine with no path to the client without human approval, idempotent webhooks and 100% coverage on the critical modules.',
p2_1:'MCP server that gives AI agents keyword search over markdown documentation, with an evaluation harness that publishes its metrics. It is the same idea behind the search in my interactive CV.',
p3_1:'Web platform for Latin American students and professionals who migrate: scholarships, an AI assistant (Gemini) and forums, with a proxy that keeps keys out of the browser.',
s_sk:'Skills',yrs_k:'Years of experience per technology',k2:'Messaging',v2:'SNS, SQS and RabbitMQ: queues, events and asynchronous messaging',k4:'Data',k5:'Frontend, testing',k6:'AI',
v6:'Gemini API, MCP and development with coding agents (Claude Code, OpenCode)',fab:'Contact',pop_t:'Available to start now',pop_d:'Permanent full stack or backend role: hybrid in Zaragoza or remote from Spain.',c_copy:'Copy email',c_done:'Copied',oops:'Something went wrong with the search. Write to me and I will answer myself:',s_edu:'Education and languages',k_edu:'Education',
e1:"Master's in High Performance Computing, Universidade da Coruña (2022–2026).",
e2:"Bachelor's in Computer Science, UNAH (2010–2015).",
k_lang:'Languages',l1:'Native Spanish. Professional English: 6+ years with US engineering teams. Basic Portuguese.',
foot:'© 2026 Ana Izaguirre. Handmade, no frameworks, no trackers.'
};
Object.assign(EN,{
rp_h:'My career in seven scenes',
'c-latino_0':'Proxy keeps keys off the client',
'c-latino_1':'React 19 + TypeScript',
'c-latino_2':'Firestore',
'c-mcp_0':'SQLite FTS5 + BM25',
'c-mcp_1':'Evaluation harness',
'c-mcp_2':'MCP protocol',
'c-mcp_3':'Strict typing with mypy',
'c-trainer_0':'Strict state machine',
'c-trainer_1':'Idempotent webhooks',
'c-trainer_2':'Domain isolated from the AI',
'c-trainer_3':'100% coverage on authorization',
rp_note:'At every stop: who, which sector, how long and with which technologies.',to_top:'Back to top',clear:'Clear the search',rp_step:'Step',rp_prev:'Previous step',rp_next:'Next step',k_co:'companies',k_te:'technologies',k_pr:'own projects',
c7:'Have you designed REST and GraphQL APIs?',c8:'How do you approach testing?',c9:'Do you use Docker and Kubernetes?',c10:'What architectural decisions did you make in trainer-flow?',c11:'Which databases have you used?',c12:'What have you done since 2025?'
});
const SEC={es:{perfil:'Perfil',disp:'Disponibilidad',exp:'Experiencia',proj:'Proyectos',skills:'Competencias',edu:'Formación',lang:'Idiomas',case:'Caso de estudio'},
           en:{perfil:'Profile',disp:'Availability',exp:'Experience',proj:'Projects',skills:'Skills',edu:'Education',lang:'Languages',case:'Case study'}};
const num=(ms,l)=>{const s=ms<10?ms.toFixed(1):String(Math.round(ms));return l==='es'?s.replace('.',','):s};
const UI={
es:{meta:(n,ms)=>`${n===1?'1 fragmento':n+' fragmentos'} del CV, búsqueda en ${ms} ms`,none:'Eso no aparece en mi CV. Escríbeme y te lo cuento:',
 see:'Ver en el CV',hist:'Ya preguntado:',why:'Coincide con:',syn:'sinónimo',
 noneIn:m=>`No aparece en ${m}.`,tryAll:'Buscar en todo el CV',play:'Reproducir',pause:'Pausar',again:'Reproducir de nuevo',light:'Claro',dark:'Oscuro'},
en:{meta:(n,ms)=>`${n===1?'1 passage':n+' passages'} from the CV, search took ${ms} ms`,none:'That is not in my CV. Email me and I will tell you:',
 see:'See it in the CV',hist:'Already asked:',why:'Matches:',syn:'synonym',
 noneIn:m=>`Nothing in ${m}.`,tryAll:'Search the whole CV',play:'Play',pause:'Pause',again:'Replay again',light:'Light',dark:'Dark'}};
const META={es:{t:document.title,d:$('meta[name=description]').content},
 en:{t:'Ana Izaguirre, full stack and backend engineer in Zaragoza | Node.js, TypeScript, AWS',d:'Interactive CV of Ana Izaguirre, full stack engineer specialising in backend, based in Zaragoza, with 8+ years in production: Node.js, TypeScript, React and AWS.'}};
let lang='es';
function flash(el){el.scrollIntoView({behavior:reduce?'auto':'smooth',block:'center'});el.classList.remove('flash');void el.offsetWidth;el.classList.add('flash')}
function mk(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e}

const ICONS=JSON.parse('{"C#":{"p":"M14.2209.0875v5.9613l-3.7433.5012v3.5233l3.7433-.5012v3.5735l3.492-.4672V9.1047L24 8.2634l-.4631-3.4613-5.824.7794V.0875zM6.287 1.145v5.9618L0 7.9483l.4634 3.4613 5.8514-.7834 3.4644-.4637V1.145zm3.5198 9.7185l-3.492.4675v3.578l-6.183.8276.4633 3.4613 5.8239-.7796v5.4942h3.492v-5.962l3.6114-.4834V13.944l-3.7156.4973zm13.73 1.7405l-5.824.779-3.492.4673v9.0179h3.492v-5.9618L24 16.0652Z","h":"#99CC00"},"PHP":{"p":"M7.01 10.207h-.944l-.515 2.648h.838c.556 0 .97-.105 1.242-.314.272-.21.455-.559.55-1.049.092-.47.05-.802-.124-.995-.175-.193-.523-.29-1.047-.29zM12 5.688C5.373 5.688 0 8.514 0 12s5.373 6.313 12 6.313S24 15.486 24 12c0-3.486-5.373-6.312-12-6.312zm-3.26 7.451c-.261.25-.575.438-.917.551-.336.108-.765.164-1.285.164H5.357l-.327 1.681H3.652l1.23-6.326h2.65c.797 0 1.378.209 1.744.628.366.418.476 1.002.33 1.752a2.836 2.836 0 0 1-.305.847c-.143.255-.33.49-.561.703zm4.024.715l.543-2.799c.063-.318.039-.536-.068-.651-.107-.116-.336-.174-.687-.174H11.46l-.704 3.625H9.388l1.23-6.327h1.367l-.327 1.682h1.218c.767 0 1.295.134 1.586.401s.378.7.263 1.299l-.572 2.944h-1.389zm7.597-2.265a2.782 2.782 0 0 1-.305.847c-.143.255-.33.49-.561.703a2.44 2.44 0 0 1-.917.551c-.336.108-.765.164-1.286.164h-1.18l-.327 1.682h-1.378l1.23-6.326h2.649c.797 0 1.378.209 1.744.628.366.417.477 1.001.331 1.751zM17.766 10.207h-.943l-.516 2.648h.838c.557 0 .971-.105 1.242-.314.272-.21.455-.559.551-1.049.092-.47.049-.802-.125-.995s-.524-.29-1.047-.29z","h":"#777BB4"},"Java EE":{"p":"M11.915 0 11.7.215C9.515 2.4 7.47 6.39 6.046 10.483c-1.064 1.024-3.633 2.81-3.711 3.551-.093.87 1.746 2.611 1.55 3.235-.198.625-1.304 1.408-1.014 1.939.1.188.823.011 1.277-.491a13.389 13.389 0 0 0-.017 2.14c.076.906.27 1.668.643 2.232.372.563.956.911 1.667.911.397 0 .727-.114 1.024-.264.298-.149.571-.33.91-.5.68-.34 1.634-.666 3.53-.604 1.903.062 2.872.39 3.559.704.687.314 1.15.664 1.925.664.767 0 1.395-.336 1.807-.9.412-.563.631-1.33.72-2.24.06-.623.055-1.32 0-2.066.454.45 1.117.604 1.213.424.29-.53-.816-1.314-1.013-1.937-.198-.624 1.642-2.366 1.549-3.236-.08-.748-2.707-2.568-3.748-3.586C16.428 6.374 14.308 2.394 12.13.215zm.175 6.038a2.95 2.95 0 0 1 2.943 2.942 2.95 2.95 0 0 1-2.943 2.943A2.95 2.95 0 0 1 9.148 8.98a2.95 2.95 0 0 1 2.942-2.942zM8.685 7.983a3.515 3.515 0 0 0-.145.997c0 1.951 1.6 3.55 3.55 3.55 1.95 0 3.55-1.598 3.55-3.55 0-.329-.046-.648-.132-.951.334.095.64.208.915.336a42.699 42.699 0 0 1 2.042 5.829c.678 2.545 1.01 4.92.846 6.607-.082.844-.29 1.51-.606 1.94-.315.431-.713.651-1.315.651-.593 0-.932-.27-1.673-.61-.741-.338-1.825-.694-3.792-.758-1.974-.064-3.073.293-3.821.669-.375.188-.659.373-.911.5s-.466.2-.752.2c-.53 0-.876-.209-1.16-.64-.285-.43-.474-1.101-.545-1.948-.141-1.693.176-4.069.823-6.614a43.155 43.155 0 0 1 1.934-5.783c.348-.167.749-.31 1.192-.425zm-3.382 4.362a.216.216 0 0 1 .13.031c-.166.56-.323 1.116-.463 1.665a33.849 33.849 0 0 0-.547 2.555 3.9 3.9 0 0 0-.2-.39c-.58-1.012-.914-1.642-1.16-2.08.315-.24 1.679-1.755 2.24-1.781zm13.394.01c.562.027 1.926 1.543 2.24 1.783-.246.438-.58 1.068-1.16 2.08a4.428 4.428 0 0 0-.163.309 32.354 32.354 0 0 0-.562-2.49 40.579 40.579 0 0 0-.482-1.652.216.216 0 0 1 .127-.03z","h":"#000000"},"JSP":{"p":"M11.915 0 11.7.215C9.515 2.4 7.47 6.39 6.046 10.483c-1.064 1.024-3.633 2.81-3.711 3.551-.093.87 1.746 2.611 1.55 3.235-.198.625-1.304 1.408-1.014 1.939.1.188.823.011 1.277-.491a13.389 13.389 0 0 0-.017 2.14c.076.906.27 1.668.643 2.232.372.563.956.911 1.667.911.397 0 .727-.114 1.024-.264.298-.149.571-.33.91-.5.68-.34 1.634-.666 3.53-.604 1.903.062 2.872.39 3.559.704.687.314 1.15.664 1.925.664.767 0 1.395-.336 1.807-.9.412-.563.631-1.33.72-2.24.06-.623.055-1.32 0-2.066.454.45 1.117.604 1.213.424.29-.53-.816-1.314-1.013-1.937-.198-.624 1.642-2.366 1.549-3.236-.08-.748-2.707-2.568-3.748-3.586C16.428 6.374 14.308 2.394 12.13.215zm.175 6.038a2.95 2.95 0 0 1 2.943 2.942 2.95 2.95 0 0 1-2.943 2.943A2.95 2.95 0 0 1 9.148 8.98a2.95 2.95 0 0 1 2.942-2.942zM8.685 7.983a3.515 3.515 0 0 0-.145.997c0 1.951 1.6 3.55 3.55 3.55 1.95 0 3.55-1.598 3.55-3.55 0-.329-.046-.648-.132-.951.334.095.64.208.915.336a42.699 42.699 0 0 1 2.042 5.829c.678 2.545 1.01 4.92.846 6.607-.082.844-.29 1.51-.606 1.94-.315.431-.713.651-1.315.651-.593 0-.932-.27-1.673-.61-.741-.338-1.825-.694-3.792-.758-1.974-.064-3.073.293-3.821.669-.375.188-.659.373-.911.5s-.466.2-.752.2c-.53 0-.876-.209-1.16-.64-.285-.43-.474-1.101-.545-1.948-.141-1.693.176-4.069.823-6.614a43.155 43.155 0 0 1 1.934-5.783c.348-.167.749-.31 1.192-.425zm-3.382 4.362a.216.216 0 0 1 .13.031c-.166.56-.323 1.116-.463 1.665a33.849 33.849 0 0 0-.547 2.555 3.9 3.9 0 0 0-.2-.39c-.58-1.012-.914-1.642-1.16-2.08.315-.24 1.679-1.755 2.24-1.781zm13.394.01c.562.027 1.926 1.543 2.24 1.783-.246.438-.58 1.068-1.16 2.08a4.428 4.428 0 0 0-.163.309 32.354 32.354 0 0 0-.562-2.49 40.579 40.579 0 0 0-.482-1.652.216.216 0 0 1 .127-.03z","h":"#000000"},"Node.js":{"p":"M11.998,24c-0.321,0-0.641-0.084-0.922-0.247l-2.936-1.737c-0.438-0.245-0.224-0.332-0.08-0.383 c0.585-0.203,0.703-0.25,1.328-0.604c0.065-0.037,0.151-0.023,0.218,0.017l2.256,1.339c0.082,0.045,0.197,0.045,0.272,0l8.795-5.076 c0.082-0.047,0.134-0.141,0.134-0.238V6.921c0-0.099-0.053-0.192-0.137-0.242l-8.791-5.072c-0.081-0.047-0.189-0.047-0.271,0 L3.075,6.68C2.99,6.729,2.936,6.825,2.936,6.921v10.15c0,0.097,0.054,0.189,0.139,0.235l2.409,1.392 c1.307,0.654,2.108-0.116,2.108-0.89V7.787c0-0.142,0.114-0.253,0.256-0.253h1.115c0.139,0,0.255,0.112,0.255,0.253v10.021 c0,1.745-0.95,2.745-2.604,2.745c-0.508,0-0.909,0-2.026-0.551L2.28,18.675c-0.57-0.329-0.922-0.945-0.922-1.604V6.921 c0-0.659,0.353-1.275,0.922-1.603l8.795-5.082c0.557-0.315,1.296-0.315,1.848,0l8.794,5.082c0.57,0.329,0.924,0.944,0.924,1.603 v10.15c0,0.659-0.354,1.273-0.924,1.604l-8.794,5.078C12.643,23.916,12.324,24,11.998,24z M19.099,13.993 c0-1.9-1.284-2.406-3.987-2.763c-2.731-0.361-3.009-0.548-3.009-1.187c0-0.528,0.235-1.233,2.258-1.233 c1.807,0,2.473,0.389,2.747,1.607c0.024,0.115,0.129,0.199,0.247,0.199h1.141c0.071,0,0.138-0.031,0.186-0.081 c0.048-0.054,0.074-0.123,0.067-0.196c-0.177-2.098-1.571-3.076-4.388-3.076c-2.508,0-4.004,1.058-4.004,2.833 c0,1.925,1.488,2.457,3.895,2.695c2.88,0.282,3.103,0.703,3.103,1.269c0,0.983-0.789,1.402-2.642,1.402 c-2.327,0-2.839-0.584-3.011-1.742c-0.02-0.124-0.126-0.215-0.253-0.215h-1.137c-0.141,0-0.254,0.112-0.254,0.253 c0,1.482,0.806,3.248,4.655,3.248C17.501,17.007,19.099,15.91,19.099,13.993z","h":"#5FA04E"},"SAP HANA":{"p":"M0 6.064v11.872h12.13L24 6.064zm3.264 2.208h.005c.863.001 1.915.245 2.676.633l-.82 1.43c-.835-.404-1.255-.442-1.73-.467-.708-.038-1.064.215-1.069.488-.007.332.669.633 1.305.838.964.306 2.19.715 2.377 1.9L7.77 8.437h2.046l2.064 5.576-.007-5.575h2.37c2.257 0 3.318.764 3.318 2.519 0 1.575-1.09 2.514-2.936 2.514h-.763l-.01 2.094-3.588-.003-.25-.908c-.37.122-.787.189-1.23.189-.456 0-.885-.071-1.263-.2l-.358.919-2 .006.09-.462c-.029.025-.057.05-.087.074-.535.43-1.208.629-2.037.644l-.213.002a5.075 5.075 0 0 1-2.581-.675l.73-1.448c.79.467 1.286.572 1.956.558.347-.007.598-.07.761-.239a.557.557 0 0 0 .156-.369c.007-.376-.53-.553-1.185-.756-.531-.164-1.135-.389-1.606-.735-.559-.41-.825-.924-.812-1.65a1.99 1.99 0 0 1 .566-1.377c.519-.537 1.357-.863 2.363-.863zm10.597 1.67v1.904h.521c.694 0 1.247-.23 1.248-.964 0-.709-.554-.94-1.248-.94zm-5.087.767l-.748 2.362c.223.085.481.133.757.133.268 0 .52-.047.742-.126l-.736-2.37z","h":"#0FAAFF"},"Selenium":{"p":"M23.174 3.468l-7.416 8.322a.228.228 0 0 1-.33 0l-3.786-3.9a.228.228 0 0 1 0-.282L12.872 6a.228.228 0 0 1 .366 0l2.106 2.346a.228.228 0 0 0 .342 0l5.94-8.094A.162.162 0 0 0 21.5 0H.716a.174.174 0 0 0-.174.174v23.652A.174.174 0 0 0 .716 24h22.566a.174.174 0 0 0 .174-.174V3.6a.162.162 0 0 0-.282-.132zM6.932 21.366a5.706 5.706 0 0 1-4.05-1.44.222.222 0 0 1 0-.288l.882-1.236a.222.222 0 0 1 .33-.036 4.338 4.338 0 0 0 2.964 1.158c1.158 0 1.722-.534 1.722-1.098 0-1.752-5.7-.552-5.7-4.278 0-1.65 1.428-3 3.756-3a5.568 5.568 0 0 1 3.708 1.242.222.222 0 0 1 0 .3l-.906 1.2a.222.222 0 0 1-.318.036 4.29 4.29 0 0 0-2.706-.936c-.906 0-1.41.402-1.41.996 0 1.572 5.688.522 5.688 4.2.006 1.812-1.284 3.18-3.96 3.18zm12.438-3.432a.192.192 0 0 1-.192.192h-5.202a.06.06 0 0 0-.06.066 1.986 1.986 0 0 0 2.106 1.638 3.264 3.264 0 0 0 1.8-.6.192.192 0 0 1 .276.042l.636.93a.198.198 0 0 1-.042.264 4.71 4.71 0 0 1-2.892.9 3.726 3.726 0 0 1-3.93-3.87 3.744 3.744 0 0 1 3.81-3.852c2.196 0 3.684 1.644 3.684 4.05zm-3.684-2.748a1.758 1.758 0 0 0-1.8 1.56.06.06 0 0 0 .06.066h3.492a.06.06 0 0 0 .06-.066 1.698 1.698 0 0 0-1.812-1.56Z","h":"#43B02A"},"MongoDB":{"p":"M17.193 9.555c-1.264-5.58-4.252-7.414-4.573-8.115-.28-.394-.53-.954-.735-1.44-.036.495-.055.685-.523 1.184-.723.566-4.438 3.682-4.74 10.02-.282 5.912 4.27 9.435 4.888 9.884l.07.05A73.49 73.49 0 0111.91 24h.481c.114-1.032.284-2.056.51-3.07.417-.296.604-.463.85-.693a11.342 11.342 0 003.639-8.464c.01-.814-.103-1.662-.197-2.218zm-5.336 8.195s0-8.291.275-8.29c.213 0 .49 10.695.49 10.695-.381-.045-.765-1.76-.765-2.405z","h":"#47A248"},"GraphQL":{"p":"M12.002 0a2.138 2.138 0 1 0 0 4.277 2.138 2.138 0 1 0 0-4.277zm8.54 4.931a2.138 2.138 0 1 0 0 4.277 2.138 2.138 0 1 0 0-4.277zm0 9.862a2.138 2.138 0 1 0 0 4.277 2.138 2.138 0 1 0 0-4.277zm-8.54 4.931a2.138 2.138 0 1 0 0 4.276 2.138 2.138 0 1 0 0-4.276zm-8.542-4.93a2.138 2.138 0 1 0 0 4.276 2.138 2.138 0 1 0 0-4.277zm0-9.863a2.138 2.138 0 1 0 0 4.277 2.138 2.138 0 1 0 0-4.277zm8.542-3.378L2.953 6.777v10.448l9.049 5.224 9.047-5.224V6.777zm0 1.601 7.66 13.27H4.34zm-1.387.371L3.97 15.037V7.363zm2.774 0 6.646 3.838v7.674zM5.355 17.44h13.293l-6.646 3.836z","h":"#E10098"},"Apollo":{"p":"M12,0C5.372,0 0,5.373 0,12 0,18.628 5.372,24 12,24 18.627,24 24,18.628 24,12A12.014,12.014 0 0 0 23.527,8.657 0.6,0.6 0 0 0 22.4,9.066H22.398C22.663,10.009 22.8,10.994 22.8,12A10.73,10.73 0 0 1 19.637,19.637 10.729,10.729 0 0 1 12,22.8 10.73,10.73 0 0 1 4.363,19.637 10.728,10.728 0 0 1 1.2,12 10.73,10.73 0 0 1 4.363,4.363 10.728,10.728 0 0 1 12,1.2C14.576,1.2 17.013,2.096 18.958,3.74A1.466,1.466 0 1 0 19.82,2.9 11.953,11.953 0 0 0 12,0ZM10.56,5.88 6.36,16.782H8.99L9.677,14.934H13.646L12.927,12.892H10.314L12.014,8.201 15.038,16.781H17.669L13.47,5.88Z","h":"#311C87"},"TypeScript":{"p":"M1.125 0C.502 0 0 .502 0 1.125v21.75C0 23.498.502 24 1.125 24h21.75c.623 0 1.125-.502 1.125-1.125V1.125C24 .502 23.498 0 22.875 0zm17.363 9.75c.612 0 1.154.037 1.627.111a6.38 6.38 0 0 1 1.306.34v2.458a3.95 3.95 0 0 0-.643-.361 5.093 5.093 0 0 0-.717-.26 5.453 5.453 0 0 0-1.426-.2c-.3 0-.573.028-.819.086a2.1 2.1 0 0 0-.623.242c-.17.104-.3.229-.393.374a.888.888 0 0 0-.14.49c0 .196.053.373.156.529.104.156.252.304.443.444s.423.276.696.41c.273.135.582.274.926.416.47.197.892.407 1.266.628.374.222.695.473.963.753.268.279.472.598.614.957.142.359.214.776.214 1.253 0 .657-.125 1.21-.373 1.656a3.033 3.033 0 0 1-1.012 1.085 4.38 4.38 0 0 1-1.487.596c-.566.12-1.163.18-1.79.18a9.916 9.916 0 0 1-1.84-.164 5.544 5.544 0 0 1-1.512-.493v-2.63a5.033 5.033 0 0 0 3.237 1.2c.333 0 .624-.03.872-.09.249-.06.456-.144.623-.25.166-.108.29-.234.373-.38a1.023 1.023 0 0 0-.074-1.089 2.12 2.12 0 0 0-.537-.5 5.597 5.597 0 0 0-.807-.444 27.72 27.72 0 0 0-1.007-.436c-.918-.383-1.602-.852-2.053-1.405-.45-.553-.676-1.222-.676-2.005 0-.614.123-1.141.369-1.582.246-.441.58-.804 1.004-1.089a4.494 4.494 0 0 1 1.47-.629 7.536 7.536 0 0 1 1.77-.201zm-15.113.188h9.563v2.166H9.506v9.646H6.789v-9.646H3.375z","h":"#3178C6"},"Express":{"p":"M12.262 16.666h1.146l6.975-9.325H19.22zm9.778 1.441v.004l-4.334-5.706-.557.74 4.873 6.682H.945V4.173h9.505l5.026 6.7.574-.772-4.374-5.928h.003l-.719-.945H0v17.544h24zM10.917 8.705a3.8 3.8 0 0 0-1.292-1.183q-.796-.45-1.916-.45c-.746 0-1.37.14-1.906.424a3.76 3.76 0 0 0-1.31 1.12 4.9 4.9 0 0 0-.75 1.581 7.17 7.17 0 0 0 0 3.696c.148.567.402 1.101.75 1.573a3.5 3.5 0 0 0 1.31 1.066q.803.39 1.906.389 1.77 0 2.739-.868.966-.867 1.328-2.457h-1.139q-.271 1.084-.977 1.734-.704.651-1.952.65-.812 0-1.392-.342a3.1 3.1 0 0 1-.957-.869 3.5 3.5 0 0 1-.551-1.182 5 5 0 0 1-.17-1.133 9 9 0 0 0-.015-.286 4.5 4.5 0 0 1 .015-.829c.047-.418.147-.83.296-1.223A3.7 3.7 0 0 1 5.54 9.05a2.9 2.9 0 0 1 .922-.742q.541-.28 1.246-.28c.47 0 .869.093 1.23.28q.541.281.922.742.379.461.587 1.057t.225 1.246H5.625l.004.957h6.182a7.3 7.3 0 0 0-.18-1.924 4.9 4.9 0 0 0-.715-1.68z","h":"#0A0A0A"},"RabbitMQ":{"p":"M23.035 9.601h-7.677a.956.956 0 01-.962-.962V.962a.956.956 0 00-.962-.956H10.56a.956.956 0 00-.962.956V8.64a.956.956 0 01-.962.962H5.762a.956.956 0 01-.961-.962V.962A.956.956 0 003.839 0H.959a.956.956 0 00-.956.962v22.076A.956.956 0 00.965 24h22.07a.956.956 0 00.962-.962V10.58a.956.956 0 00-.962-.98zm-3.86 8.152a1.437 1.437 0 01-1.437 1.443h-1.924a1.437 1.437 0 01-1.436-1.443v-1.917a1.437 1.437 0 011.436-1.443h1.924a1.437 1.437 0 011.437 1.443z","h":"#FF6600"},"Jest":{"p":"M22.251 11.82a3.117 3.117 0 0 0-2.328-3.01L22.911 0H8.104L11.1 8.838a3.116 3.116 0 0 0-2.244 2.988c0 1.043.52 1.967 1.313 2.536a8.279 8.279 0 0 1-1.084 1.244 8.14 8.14 0 0 1-2.55 1.647c-.834-.563-1.195-1.556-.869-2.446a3.11 3.11 0 0 0-.91-6.08 3.117 3.117 0 0 0-3.113 3.113c0 .848.347 1.626.903 2.182-.048.097-.097.195-.146.299-.465.959-.993 2.043-1.195 3.259-.403 2.432.257 4.384 1.849 5.489A5.093 5.093 0 0 0 5.999 24c1.827 0 3.682-.917 5.475-1.807 1.279-.632 2.599-1.292 3.898-1.612.48-.118.98-.187 1.508-.264 1.07-.153 2.175-.312 3.168-.89a4.482 4.482 0 0 0 2.182-3.091c.174-.994 0-1.994-.444-2.87.298-.48.465-1.042.465-1.647zm-1.355 0c0 .965-.785 1.75-1.75 1.75a1.753 1.753 0 0 1-1.085-3.126l.007-.007c.056-.042.118-.084.18-.125 0 0 .008 0 .008-.007.028-.014.055-.035.083-.05.007 0 .014-.006.021-.006.028-.014.063-.028.097-.042.035-.014.07-.027.098-.041.007 0 .013-.007.02-.007.028-.007.056-.021.084-.028.007 0 .02-.007.028-.007.034-.007.062-.014.097-.02h.007l.104-.022c.007 0 .02 0 .028-.007.028 0 .055-.007.083-.007h.035c.035 0 .07-.007.111-.007h.09c.028 0 .05 0 .077.007h.014c.055.007.111.014.167.028a1.766 1.766 0 0 1 1.396 1.723zM10.043 1.39h10.93l-2.509 7.4c-.104.02-.208.055-.312.09l-2.64-5.385-2.648 5.35c-.104-.034-.216-.055-.327-.076l-2.494-7.38zm4.968 9.825a3.083 3.083 0 0 0-.938-1.668l1.438-2.904 1.452 2.967c-.43.43-.743.98-.868 1.605H15.01zm-3.481-1.098c.034-.007.062-.014.097-.02h.02c.029-.008.056-.008.084-.015h.028c.028 0 .049-.007.076-.007h.271c.028 0 .049.007.07.007.014 0 .02 0 .035.007.027.007.048.007.076.014.007 0 .014 0 .028.007l.097.02h.007c.028.008.056.015.083.029.007 0 .014.007.028.007.021.007.049.014.07.027.007 0 .014.007.02.007.028.014.056.021.084.035h.007a.374.374 0 0 1 .09.049h.007c.028.014.056.034.084.048.007 0 .007.007.013.007.028.014.05.035.077.049l.007.007c.083.062.16.132.236.201l.007.007a1.747 1.747 0 0 1 .48 1.209 1.752 1.752 0 0 1-3.502 0 1.742 1.742 0 0 1 1.32-1.695zm-6.838-.049c.966 0 1.751.786 1.751 1.751s-.785 1.751-1.75 1.751-1.752-.785-1.752-1.75.786-1.752 1.751-1.752zm16.163 6.025a3.07 3.07 0 0 1-1.508 2.133c-.758.438-1.689.577-2.669.716a17.29 17.29 0 0 0-1.64.291c-1.445.355-2.834 1.05-4.182 1.717-1.724.854-3.35 1.66-4.857 1.66a3.645 3.645 0 0 1-2.154-.688c-1.529-1.056-1.453-3.036-1.272-4.12.167-1.015.632-1.966 1.077-2.877.028-.055.049-.104.077-.16.152.056.312.098.479.126-.264 1.473.486 2.994 1.946 3.745l.264.139.284-.104c1.216-.431 2.342-1.133 3.336-2.071a9.334 9.334 0 0 0 1.445-1.716c.16.027.32.034.48.034a3.117 3.117 0 0 0 3.008-2.327h1.167a3.109 3.109 0 0 0 3.01 2.327c.576 0 1.11-.16 1.57-.43.18.52.236 1.063.139 1.605z","h":"#C21325"},"React":{"p":"M14.23 12.004a2.236 2.236 0 0 1-2.235 2.236 2.236 2.236 0 0 1-2.236-2.236 2.236 2.236 0 0 1 2.235-2.236 2.236 2.236 0 0 1 2.236 2.236zm2.648-10.69c-1.346 0-3.107.96-4.888 2.622-1.78-1.653-3.542-2.602-4.887-2.602-.41 0-.783.093-1.106.278-1.375.793-1.683 3.264-.973 6.365C1.98 8.917 0 10.42 0 12.004c0 1.59 1.99 3.097 5.043 4.03-.704 3.113-.39 5.588.988 6.38.32.187.69.275 1.102.275 1.345 0 3.107-.96 4.888-2.624 1.78 1.654 3.542 2.603 4.887 2.603.41 0 .783-.09 1.106-.275 1.374-.792 1.683-3.263.973-6.365C22.02 15.096 24 13.59 24 12.004c0-1.59-1.99-3.097-5.043-4.032.704-3.11.39-5.587-.988-6.38-.318-.184-.688-.277-1.092-.278zm-.005 1.09v.006c.225 0 .406.044.558.127.666.382.955 1.835.73 3.704-.054.46-.142.945-.25 1.44-.96-.236-2.006-.417-3.107-.534-.66-.905-1.345-1.727-2.035-2.447 1.592-1.48 3.087-2.292 4.105-2.295zm-9.77.02c1.012 0 2.514.808 4.11 2.28-.686.72-1.37 1.537-2.02 2.442-1.107.117-2.154.298-3.113.538-.112-.49-.195-.964-.254-1.42-.23-1.868.054-3.32.714-3.707.19-.09.4-.127.563-.132zm4.882 3.05c.455.468.91.992 1.36 1.564-.44-.02-.89-.034-1.345-.034-.46 0-.915.01-1.36.034.44-.572.895-1.096 1.345-1.565zM12 8.1c.74 0 1.477.034 2.202.093.406.582.802 1.203 1.183 1.86.372.64.71 1.29 1.018 1.946-.308.655-.646 1.31-1.013 1.95-.38.66-.773 1.288-1.18 1.87-.728.063-1.466.098-2.21.098-.74 0-1.477-.035-2.202-.093-.406-.582-.802-1.204-1.183-1.86-.372-.64-.71-1.29-1.018-1.946.303-.657.646-1.313 1.013-1.954.38-.66.773-1.286 1.18-1.868.728-.064 1.466-.098 2.21-.098zm-3.635.254c-.24.377-.48.763-.704 1.16-.225.39-.435.782-.635 1.174-.265-.656-.49-1.31-.676-1.947.64-.15 1.315-.283 2.015-.386zm7.26 0c.695.103 1.365.23 2.006.387-.18.632-.405 1.282-.66 1.933-.2-.39-.41-.783-.64-1.174-.225-.392-.465-.774-.705-1.146zm3.063.675c.484.15.944.317 1.375.498 1.732.74 2.852 1.708 2.852 2.476-.005.768-1.125 1.74-2.857 2.475-.42.18-.88.342-1.355.493-.28-.958-.646-1.956-1.1-2.98.45-1.017.81-2.01 1.085-2.964zm-13.395.004c.278.96.645 1.957 1.1 2.98-.45 1.017-.812 2.01-1.086 2.964-.484-.15-.944-.318-1.37-.5-1.732-.737-2.852-1.706-2.852-2.474 0-.768 1.12-1.742 2.852-2.476.42-.18.88-.342 1.356-.494zm11.678 4.28c.265.657.49 1.312.676 1.948-.64.157-1.316.29-2.016.39.24-.375.48-.762.705-1.158.225-.39.435-.788.636-1.18zm-9.945.02c.2.392.41.783.64 1.175.23.39.465.772.705 1.143-.695-.102-1.365-.23-2.006-.386.18-.63.406-1.282.66-1.933zM17.92 16.32c.112.493.2.968.254 1.423.23 1.868-.054 3.32-.714 3.708-.147.09-.338.128-.563.128-1.012 0-2.514-.807-4.11-2.28.686-.72 1.37-1.536 2.02-2.44 1.107-.118 2.154-.3 3.113-.54zm-11.83.01c.96.234 2.006.415 3.107.532.66.905 1.345 1.727 2.035 2.446-1.595 1.483-3.092 2.295-4.11 2.295-.22-.005-.406-.05-.553-.132-.666-.38-.955-1.834-.73-3.703.054-.46.142-.944.25-1.438zm4.56.64c.44.02.89.034 1.345.034.46 0 .915-.01 1.36-.034-.44.572-.895 1.095-1.345 1.565-.455-.47-.91-.993-1.36-1.565z","h":"#61DAFB"},"Angular":{"p":"M16.712 17.711H7.288l-1.204 2.916L12 24l5.916-3.373-1.204-2.916ZM14.692 0l7.832 16.855.814-12.856L14.692 0ZM9.308 0 .662 3.999l.814 12.856L9.308 0Zm-.405 13.93h6.198L12 6.396 8.903 13.93Z","h":"#0F0F11"},"Docker":{"p":"M13.983 11.078h2.119a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.119a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.185m-2.954-5.43h2.118a.186.186 0 00.186-.186V3.574a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m0 2.716h2.118a.187.187 0 00.186-.186V6.29a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.887c0 .102.082.185.185.186m-2.93 0h2.12a.186.186 0 00.184-.186V6.29a.185.185 0 00-.185-.185H8.1a.185.185 0 00-.185.185v1.887c0 .102.083.185.185.186m-2.964 0h2.119a.186.186 0 00.185-.186V6.29a.185.185 0 00-.185-.185H5.136a.186.186 0 00-.186.185v1.887c0 .102.084.185.186.186m5.893 2.715h2.118a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m-2.93 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.083.185.185.185m-2.964 0h2.119a.185.185 0 00.185-.185V9.006a.185.185 0 00-.184-.186h-2.12a.186.186 0 00-.186.186v1.887c0 .102.084.185.186.185m-2.92 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.082.185.185.185M23.763 9.89c-.065-.051-.672-.51-1.954-.51-.338.001-.676.03-1.01.087-.248-1.7-1.653-2.53-1.716-2.566l-.344-.199-.226.327c-.284.438-.49.922-.612 1.43-.23.97-.09 1.882.403 2.661-.595.332-1.55.413-1.744.42H.751a.751.751 0 00-.75.748 11.376 11.376 0 00.692 4.062c.545 1.428 1.355 2.48 2.41 3.124 1.18.723 3.1 1.137 5.275 1.137.983.003 1.963-.086 2.93-.266a12.248 12.248 0 003.823-1.389c.98-.567 1.86-1.288 2.61-2.136 1.252-1.418 1.998-2.997 2.553-4.4h.221c1.372 0 2.215-.549 2.68-1.009.309-.293.55-.65.707-1.046l.098-.288Z","h":"#2496ED"},"Kubernetes":{"p":"M10.204 14.35l.007.01-.999 2.413a5.171 5.171 0 0 1-2.075-2.597l2.578-.437.004.005a.44.44 0 0 1 .484.606zm-.833-2.129a.44.44 0 0 0 .173-.756l.002-.011L7.585 9.7a5.143 5.143 0 0 0-.73 3.255l2.514-.725.002-.009zm1.145-1.98a.44.44 0 0 0 .699-.337l.01-.005.15-2.62a5.144 5.144 0 0 0-3.01 1.442l2.147 1.523.004-.002zm.76 2.75l.723.349.722-.347.18-.78-.5-.623h-.804l-.5.623.179.779zm1.5-3.095a.44.44 0 0 0 .7.336l.008.003 2.134-1.513a5.188 5.188 0 0 0-2.992-1.442l.148 2.615.002.001zm10.876 5.97l-5.773 7.181a1.6 1.6 0 0 1-1.248.594l-9.261.003a1.6 1.6 0 0 1-1.247-.596l-5.776-7.18a1.583 1.583 0 0 1-.307-1.34L2.1 5.573c.108-.47.425-.864.863-1.073L11.305.513a1.606 1.606 0 0 1 1.385 0l8.345 3.985c.438.209.755.604.863 1.073l2.062 8.955c.108.47-.005.963-.308 1.34zm-3.289-2.057c-.042-.01-.103-.026-.145-.034-.174-.033-.315-.025-.479-.038-.35-.037-.638-.067-.895-.148-.105-.04-.18-.165-.216-.216l-.201-.059a6.45 6.45 0 0 0-.105-2.332 6.465 6.465 0 0 0-.936-2.163c.052-.047.15-.133.177-.159.008-.09.001-.183.094-.282.197-.185.444-.338.743-.522.142-.084.273-.137.415-.242.032-.024.076-.062.11-.089.24-.191.295-.52.123-.736-.172-.216-.506-.236-.745-.045-.034.027-.08.062-.111.088-.134.116-.217.23-.33.35-.246.25-.45.458-.673.609-.097.056-.239.037-.303.033l-.19.135a6.545 6.545 0 0 0-4.146-2.003l-.012-.223c-.065-.062-.143-.115-.163-.25-.022-.268.015-.557.057-.905.023-.163.061-.298.068-.475.001-.04-.001-.099-.001-.142 0-.306-.224-.555-.5-.555-.275 0-.499.249-.499.555l.001.014c0 .041-.002.092 0 .128.006.177.044.312.067.475.042.348.078.637.056.906a.545.545 0 0 1-.162.258l-.012.211a6.424 6.424 0 0 0-4.166 2.003 8.373 8.373 0 0 1-.18-.128c-.09.012-.18.04-.297-.029-.223-.15-.427-.358-.673-.608-.113-.12-.195-.234-.329-.349-.03-.026-.077-.062-.111-.088a.594.594 0 0 0-.348-.132.481.481 0 0 0-.398.176c-.172.216-.117.546.123.737l.007.005.104.083c.142.105.272.159.414.242.299.185.546.338.743.522.076.082.09.226.1.288l.16.143a6.462 6.462 0 0 0-1.02 4.506l-.208.06c-.055.072-.133.184-.215.217-.257.081-.546.11-.895.147-.164.014-.305.006-.48.039-.037.007-.09.02-.133.03l-.004.002-.007.002c-.295.071-.484.342-.423.608.061.267.349.429.645.365l.007-.001.01-.003.129-.029c.17-.046.294-.113.448-.172.33-.118.604-.217.87-.256.112-.009.23.069.288.101l.217-.037a6.5 6.5 0 0 0 2.88 3.596l-.09.218c.033.084.069.199.044.282-.097.252-.263.517-.452.813-.091.136-.185.242-.268.399-.02.037-.045.095-.064.134-.128.275-.034.591.213.71.248.12.556-.007.69-.282v-.002c.02-.039.046-.09.062-.127.07-.162.094-.301.144-.458.132-.332.205-.68.387-.897.05-.06.13-.082.215-.105l.113-.205a6.453 6.453 0 0 0 4.609.012l.106.192c.086.028.18.042.256.155.136.232.229.507.342.84.05.156.074.295.145.457.016.037.043.09.062.129.133.276.442.402.69.282.247-.118.341-.435.213-.71-.02-.039-.045-.096-.065-.134-.083-.156-.177-.261-.268-.398-.19-.296-.346-.541-.443-.793-.04-.13.007-.21.038-.294-.018-.022-.059-.144-.083-.202a6.499 6.499 0 0 0 2.88-3.622c.064.01.176.03.213.038.075-.05.144-.114.28-.104.266.039.54.138.87.256.154.06.277.128.448.173.036.01.088.019.13.028l.009.003.007.001c.297.064.584-.098.645-.365.06-.266-.128-.537-.423-.608zM16.4 9.701l-1.95 1.746v.005a.44.44 0 0 0 .173.757l.003.01 2.526.728a5.199 5.199 0 0 0-.108-1.674A5.208 5.208 0 0 0 16.4 9.7zm-4.013 5.325a.437.437 0 0 0-.404-.232.44.44 0 0 0-.372.233h-.002l-1.268 2.292a5.164 5.164 0 0 0 3.326.003l-1.27-2.296h-.01zm1.888-1.293a.44.44 0 0 0-.27.036.44.44 0 0 0-.214.572l-.003.004 1.01 2.438a5.15 5.15 0 0 0 2.081-2.615l-2.6-.44-.004.005z","h":"#326CE5"},"GitHub Actions":{"p":"M10.984 13.836a.5.5 0 0 1-.353-.146l-.745-.743a.5.5 0 1 1 .706-.708l.392.391 1.181-1.18a.5.5 0 0 1 .708.707l-1.535 1.533a.504.504 0 0 1-.354.146zm9.353-.147l1.534-1.532a.5.5 0 0 0-.707-.707l-1.181 1.18-.392-.391a.5.5 0 1 0-.706.708l.746.743a.497.497 0 0 0 .706-.001zM4.527 7.452l2.557-1.585A1 1 0 0 0 7.09 4.17L4.533 2.56A1 1 0 0 0 3 3.406v3.196a1.001 1.001 0 0 0 1.527.85zm2.03-2.436L4 6.602V3.406l2.557 1.61zM24 12.5c0 1.93-1.57 3.5-3.5 3.5a3.503 3.503 0 0 1-3.46-3h-2.08a3.503 3.503 0 0 1-3.46 3 3.502 3.502 0 0 1-3.46-3h-.558c-.972 0-1.85-.399-2.482-1.042V17c0 1.654 1.346 3 3 3h.04c.244-1.693 1.7-3 3.46-3 1.93 0 3.5 1.57 3.5 3.5S13.43 24 11.5 24a3.502 3.502 0 0 1-3.46-3H8c-2.206 0-4-1.794-4-4V9.899A5.008 5.008 0 0 1 0 5c0-2.757 2.243-5 5-5s5 2.243 5 5a5.005 5.005 0 0 1-4.952 4.998A2.482 2.482 0 0 0 7.482 12h.558c.244-1.693 1.7-3 3.46-3a3.502 3.502 0 0 1 3.46 3h2.08a3.503 3.503 0 0 1 3.46-3c1.93 0 3.5 1.57 3.5 3.5zm-15 8c0 1.378 1.122 2.5 2.5 2.5s2.5-1.122 2.5-2.5-1.122-2.5-2.5-2.5S9 19.122 9 20.5zM5 9c2.206 0 4-1.794 4-4S7.206 1 5 1 1 2.794 1 5s1.794 4 4 4zm9 3.5c0-1.378-1.122-2.5-2.5-2.5S9 11.122 9 12.5s1.122 2.5 2.5 2.5 2.5-1.122 2.5-2.5zm9 0c0-1.378-1.122-2.5-2.5-2.5S18 11.122 18 12.5s1.122 2.5 2.5 2.5 2.5-1.122 2.5-2.5zm-13 8a.5.5 0 1 0 1 0 .5.5 0 0 0-1 0zm2 0a.5.5 0 1 0 1 0 .5.5 0 0 0-1 0zm12 0c0 1.93-1.57 3.5-3.5 3.5a3.503 3.503 0 0 1-3.46-3.002c-.007.001-.013.005-.021.005l-.506.017h-.017a.5.5 0 0 1-.016-.999l.506-.017c.018-.002.035.006.052.007A3.503 3.503 0 0 1 20.5 17c1.93 0 3.5 1.57 3.5 3.5zm-1 0c0-1.378-1.122-2.5-2.5-2.5S18 19.122 18 20.5s1.122 2.5 2.5 2.5 2.5-1.122 2.5-2.5z","h":"#2088FF"},"Cypress":{"p":"M11.998.0195c-.8642 0-1.6816.1101-2.1445.1934v.002C4.1731 1.2283 0 6.1368 0 12.0018c0 1.1265.1573 2.2328.4648 3.3028.0387.1453.0915.2993.1368.4473 1.607 4.865 6.2245 8.226 11.3925 8.2285.0651 0 .2518-.0003.502-.0118.8564-.0353 1.6228-.5734 1.9512-1.369l.4736-1.1544L20.4258 8.043H18.621l-2.3164 5.871-2.334-5.871h-1.9082l3.2734 8.0117c-.8115 1.9702-1.6252 3.9395-2.4355 5.9101-.0808.1945-.2655.3284-.4727.336-.144.005-.285.0098-.4316.0098-4.5848 0-8.6672-3.0695-9.9277-7.4649a10.3058 10.3058 0 0 1-.3985-2.8437c0-5.0887 3.6521-9.3404 8.6035-10.164.2214-.037.8885-.1446 1.7246-.1446 4.4166 0 8.269 2.732 9.7305 6.8476.0558.144.0977.293.1465.4395.299.9746.4531 1.9887.4531 3.0215 0 4.5696-2.9413 8.5326-7.3164 9.8613l.4863 1.5996c5.085-1.546 8.4995-6.1518 8.502-11.459 0-1.5491-.2983-2.8706-.6504-3.8926-.0432-.1212-.0873-.2422-.1309-.3633h-.002C21.4577 3.0954 17.0444.0195 11.998.0195ZM8.4336 7.8906c-1.1999 0-2.1747.3852-2.9805 1.1758-.8007.7856-1.205 1.7736-1.205 2.9356 0 1.1544.4068 2.1368 1.205 2.9199.8058.7906 1.7806 1.1738 2.9805 1.1738 1.705 0 3.1556-.955 3.7871-2.4883l.0332-.082-1.6289-.5547c-.168.4563-.7552 1.4883-2.1914 1.4883-.6745 0-1.2437-.2344-1.6934-.6992-.4572-.4699-.6875-1.0632-.6875-1.7578 0-.6998.2253-1.2809.6875-1.7735.4522-.4648 1.019-.7012 1.6934-.7012 1.438 0 2.0238 1.0815 2.1934 1.4883l1.627-.5527-.0333-.084c-.629-1.5358-2.082-2.4883-3.7871-2.4883Z","h":"#69D3A7"},"Snowflake":{"p":"M24 3.459c0 .646-.418 1.18-1.141 1.18-.723 0-1.142-.534-1.142-1.18 0-.647.419-1.18 1.142-1.18.723 0 1.141.533 1.141 1.18zm-.228 0c0-.533-.38-.951-.913-.951s-.913.38-.913.95c0 .533.38.952.913.952.57 0 .913-.419.913-.951zm-1.37-.533h.495c.266 0 .456.152.456.38 0 .153-.076.229-.19.305l.19.266v.038h-.266l-.19-.266h-.229v.266h-.266zm.495.228h-.229v.267h.229c.114 0 .152-.038.152-.114.038-.077-.038-.153-.152-.153zM7.602 12.4c.038-.151.076-.304.076-.456 0-.114-.038-.228-.038-.342-.114-.343-.304-.647-.646-.838l-4.87-2.777c-.685-.38-1.56-.152-1.94.533-.381.685-.153 1.56.532 1.94l2.701 1.56-2.701 1.56c-.685.38-.913 1.256-.533 1.94.38.685 1.256.914 1.94.533l4.832-2.777c.343-.267.571-.533.647-.876zm1.332 2.626c-.266-.038-.57.038-.837.19l-4.832 2.777c-.685.38-.913 1.256-.532 1.94.38.686 1.255.914 1.94.533l2.701-1.56v3.12c0 .8.647 1.408 1.446 1.408.799 0 1.407-.647 1.407-1.408v-5.592c0-.761-.57-1.37-1.293-1.408zm4.946-6.088c.266.038.57-.038.837-.19l4.832-2.777c.685-.38.913-1.256.532-1.94-.38-.686-1.255-.914-1.94-.533l-2.701 1.56V1.975c0-.799-.647-1.408-1.446-1.408-.799 0-1.446.609-1.446 1.408V7.53c0 .76.609 1.37 1.332 1.407zM3.265 5.97l4.832 2.777c.266.152.533.19.837.19.723-.038 1.331-.684 1.331-1.407V1.975c0-.799-.646-1.408-1.407-1.408-.799 0-1.446.647-1.446 1.408v3.12l-2.701-1.56c-.685-.38-1.56-.152-1.94.533-.419.646-.19 1.521.494 1.902zm9.093 6.011a.412.412 0 00-.114-.266l-.57-.571a.346.346 0 00-.267-.114.412.412 0 00-.266.114l-.571.57a.411.411 0 00-.114.267c0 .076.038.19.114.267l.57.57a.345.345 0 00.267.114c.076 0 .19-.038.266-.114l.571-.57a.412.412 0 00.114-.267zm1.598.533L11.94 14.53c-.039.038-.153.114-.229.114h-.608a.411.411 0 01-.267-.114L8.82 12.514a.408.408 0 01-.076-.229v-.608c0-.076.038-.19.114-.267l2.016-2.016a.41.41 0 01.267-.114h.608a.41.41 0 01.267.114l2.016 2.016a.347.347 0 01.114.267v.608c-.076.077-.114.19-.19.229zm5.593 5.44l-4.832-2.777c-.266-.152-.57-.19-.837-.152-.723.038-1.332.684-1.332 1.408v5.554c0 .8.647 1.408 1.408 1.408.799 0 1.446-.647 1.446-1.408v-3.12l2.7 1.56c.686.38 1.561.152 1.941-.533.419-.646.19-1.521-.494-1.94zm2.549-7.533l-2.701 1.56 2.7 1.56c.686.38.914 1.256.533 1.94-.38.685-1.255.913-1.94.533l-4.832-2.778a1.644 1.644 0 01-.647-.798c-.037-.153-.076-.305-.076-.457 0-.114.039-.228.039-.342.114-.343.342-.647.646-.837l4.832-2.778c.685-.38 1.56-.152 1.94.533.457.609.19 1.484-.494 1.864","h":"#29B5E8"},"Datadog":{"p":"M19.57 17.04l-1.997-1.316-1.665 2.782-1.937-.567-1.706 2.604.087.82 9.274-1.71-.538-5.794zm-8.649-2.498l1.488-.204c.241.108.409.15.697.223.45.117.97.23 1.741-.16.18-.088.553-.43.704-.625l6.096-1.106.622 7.527-10.444 1.882zm11.325-2.712l-.602.115L20.488 0 .789 2.285l2.427 19.693 2.306-.334c-.184-.263-.471-.581-.96-.989-.68-.564-.44-1.522-.039-2.127.53-1.022 3.26-2.322 3.106-3.956-.056-.594-.15-1.368-.702-1.898-.02.22.017.432.017.432s-.227-.289-.34-.683c-.112-.15-.2-.199-.319-.4-.085.233-.073.503-.073.503s-.186-.437-.216-.807c-.11.166-.137.48-.137.48s-.241-.69-.186-1.062c-.11-.323-.436-.965-.343-2.424.6.421 1.924.321 2.44-.439.171-.251.288-.939-.086-2.293-.24-.868-.835-2.16-1.066-2.651l-.028.02c.122.395.374 1.223.47 1.625.293 1.218.372 1.642.234 2.204-.116.488-.397.808-1.107 1.165-.71.358-1.653-.514-1.713-.562-.69-.55-1.224-1.447-1.284-1.883-.062-.477.275-.763.445-1.153-.243.07-.514.192-.514.192s.323-.334.722-.624c.165-.109.262-.178.436-.323a9.762 9.762 0 0 0-.456.003s.42-.227.855-.392c-.318-.014-.623-.003-.623-.003s.937-.419 1.678-.727c.509-.208 1.006-.147 1.286.257.367.53.752.817 1.569.996.501-.223.653-.337 1.284-.509.554-.61.99-.688.99-.688s-.216.198-.274.51c.314-.249.66-.455.66-.455s-.134.164-.259.426l.03.043c.366-.22.797-.394.797-.394s-.123.156-.268.358c.277-.002.838.012 1.056.037 1.285.028 1.552-1.374 2.045-1.55.618-.22.894-.353 1.947.68.903.888 1.609 2.477 1.259 2.833-.294.295-.874-.115-1.516-.916a3.466 3.466 0 0 1-.716-1.562 1.533 1.533 0 0 0-.497-.85s.23.51.23.96c0 .246.03 1.165.424 1.68-.039.076-.057.374-.1.43-.458-.554-1.443-.95-1.604-1.067.544.445 1.793 1.468 2.273 2.449.453.927.186 1.777.416 1.997.065.063.976 1.197 1.15 1.767.306.994.019 2.038-.381 2.685l-1.117.174c-.163-.045-.273-.068-.42-.153.08-.143.241-.5.243-.572l-.063-.111c-.348.492-.93.97-1.414 1.245-.633.359-1.363.304-1.838.156-1.348-.415-2.623-1.327-2.93-1.566 0 0-.01.191.048.234.34.383 1.119 1.077 1.872 1.56l-1.605.177.759 5.908c-.337.048-.39.071-.757.124-.325-1.147-.946-1.895-1.624-2.332-.599-.384-1.424-.47-2.214-.314l-.05.059a2.851 2.851 0 0 1 1.863.444c.654.413 1.181 1.481 1.375 2.124.248.822.42 1.7-.248 2.632-.476.662-1.864 1.028-2.986.237.3.481.705.876 1.25.95.809.11 1.577-.03 2.106-.574.452-.464.69-1.434.628-2.456l.714-.104.258 1.834 11.827-1.424zM15.05 6.848c-.034.075-.085.125-.007.37l.004.014.013.032.032.073c.14.287.295.558.552.696.067-.011.136-.019.207-.023.242-.01.395.028.492.08.009-.048.01-.119.005-.222-.018-.364.072-.982-.626-1.308-.264-.122-.634-.084-.757.068a.302.302 0 0 1 .058.013c.186.066.06.13.027.207m1.958 3.392c-.092-.05-.52-.03-.821.005-.574.068-1.193.267-1.328.372-.247.191-.135.523.047.66.511.382.96.638 1.432.575.29-.038.546-.497.728-.914.124-.288.124-.598-.058-.698m-5.077-2.942c.162-.154-.805-.355-1.556.156-.554.378-.571 1.187-.041 1.646.053.046.096.078.137.104a4.77 4.77 0 0 1 1.396-.412c.113-.125.243-.345.21-.745-.044-.542-.455-.456-.146-.749","h":"#632CA6"},"Python":{"p":"M11.858 0c-.978.005-1.913.088-2.736.234C6.7.662 6.26 1.558 6.26 3.21v2.182h5.725v.727H4.111c-1.664 0-3.121 1-3.577 2.903-.526 2.181-.549 3.542 0 5.82.407 1.694 1.379 2.902 3.043 2.902h1.969v-2.616c0-1.89 1.635-3.557 3.576-3.557h5.72c1.591 0 2.862-1.31 2.862-2.91v-5.45c0-1.553-1.309-2.718-2.863-2.977A18 18 0 0 0 11.858 0M8.762 1.755c.591 0 1.074.491 1.074 1.095 0 .601-.483 1.087-1.074 1.087A1.08 1.08 0 0 1 7.688 2.85c0-.604.48-1.095 1.074-1.095m9.656 4.364v2.543c0 1.971-1.671 3.63-3.577 3.63H9.122c-1.566 0-2.862 1.34-2.862 2.91v5.452c0 1.551 1.349 2.464 2.862 2.91 1.813.532 3.55.628 5.72 0 1.44-.418 2.862-1.258 2.862-2.91V18.47h-5.719v-.727h8.582c1.664 0 2.284-1.16 2.862-2.903.598-1.793.573-3.518 0-5.819-.41-1.656-1.196-2.903-2.862-2.903zm-3.216 13.807a1.08 1.08 0 0 1 1.074 1.088c0 .604-.48 1.094-1.074 1.094-.592 0-1.075-.49-1.075-1.094 0-.601.483-1.088 1.075-1.088","h":"#3776AB"},"MCP":{"p":"M13.85 0a4.16 4.16 0 0 0-2.95 1.217L1.456 10.66a.835.835 0 0 0 0 1.18.835.835 0 0 0 1.18 0l9.442-9.442a2.49 2.49 0 0 1 3.541 0 2.49 2.49 0 0 1 0 3.541L8.59 12.97l-.1.1a.835.835 0 0 0 0 1.18.835.835 0 0 0 1.18 0l.1-.098 7.03-7.034a2.49 2.49 0 0 1 3.542 0l.049.05a2.49 2.49 0 0 1 0 3.54l-8.54 8.54a1.96 1.96 0 0 0 0 2.755l1.753 1.753a.835.835 0 0 0 1.18 0 .835.835 0 0 0 0-1.18l-1.753-1.753a.266.266 0 0 1 0-.394l8.54-8.54a4.185 4.185 0 0 0 0-5.9l-.05-.05a4.16 4.16 0 0 0-2.95-1.218c-.2 0-.401.02-.6.048a4.17 4.17 0 0 0-1.17-3.552A4.16 4.16 0 0 0 13.85 0m0 3.333a.84.84 0 0 0-.59.245L6.275 10.56a4.186 4.186 0 0 0 0 5.902 4.186 4.186 0 0 0 5.902 0L19.16 9.48a.835.835 0 0 0 0-1.18.835.835 0 0 0-1.18 0l-6.985 6.984a2.49 2.49 0 0 1-3.54 0 2.49 2.49 0 0 1 0-3.54l6.983-6.985a.835.835 0 0 0 0-1.18.84.84 0 0 0-.59-.245","h":"#000000"},"SQLite FTS5":{"p":"M21.678.521c-1.032-.92-2.28-.55-3.513.544a8.71 8.71 0 0 0-.547.535c-2.109 2.237-4.066 6.38-4.674 9.544.237.48.422 1.093.544 1.561a13.044 13.044 0 0 1 .164.703s-.019-.071-.096-.296l-.05-.146a1.689 1.689 0 0 0-.033-.08c-.138-.32-.518-.995-.686-1.289-.143.423-.27.818-.376 1.176.484.884.778 2.4.778 2.4s-.025-.099-.147-.442c-.107-.303-.644-1.244-.772-1.464-.217.804-.304 1.346-.226 1.478.152.256.296.698.422 1.186.286 1.1.485 2.44.485 2.44l.017.224a22.41 22.41 0 0 0 .056 2.748c.095 1.146.273 2.13.5 2.657l.155-.084c-.334-1.038-.47-2.399-.41-3.967.09-2.398.642-5.29 1.661-8.304 1.723-4.55 4.113-8.201 6.3-9.945-1.993 1.8-4.692 7.63-5.5 9.788-.904 2.416-1.545 4.684-1.931 6.857.666-2.037 2.821-2.912 2.821-2.912s1.057-1.304 2.292-3.166c-.74.169-1.955.458-2.362.629-.6.251-.762.337-.762.337s1.945-1.184 3.613-1.72C21.695 7.9 24.195 2.767 21.678.521m-18.573.543A1.842 1.842 0 0 0 1.27 2.9v16.608a1.84 1.84 0 0 0 1.835 1.834h9.418a22.953 22.953 0 0 1-.052-2.707c-.006-.062-.011-.141-.016-.2a27.01 27.01 0 0 0-.473-2.378c-.121-.47-.275-.898-.369-1.057-.116-.197-.098-.31-.097-.432 0-.12.015-.245.037-.386a9.98 9.98 0 0 1 .234-1.045l.217-.028c-.017-.035-.014-.065-.031-.097l-.041-.381a32.8 32.8 0 0 1 .382-1.194l.2-.019c-.008-.016-.01-.038-.018-.053l-.043-.316c.63-3.28 2.587-7.443 4.8-9.791.066-.069.133-.128.198-.194Z","h":"#003B57"},"Deno":{"p":"M1.105 18.02A11.9 11.9 0 0 1 0 12.985q0-.698.078-1.376a12 12 0 0 1 .231-1.34A12 12 0 0 1 4.025 4.02a12 12 0 0 1 5.46-2.771 12 12 0 0 1 3.428-.23c1.452.112 2.825.477 4.077 1.05a12 12 0 0 1 2.78 1.774 12.02 12.02 0 0 1 4.053 7.078A12 12 0 0 1 24 12.985q0 .454-.036.914a12 12 0 0 1-.728 3.305 12 12 0 0 1-2.38 3.875c-1.33 1.357-3.02 1.962-4.43 1.936a4.4 4.4 0 0 1-2.724-1.024c-.99-.853-1.391-1.83-1.53-2.919a5 5 0 0 1 .128-1.518c.105-.38.37-1.116.76-1.437-.455-.197-1.04-.624-1.226-.829-.045-.05-.04-.13 0-.183a.155.155 0 0 1 .177-.053c.392.134.869.267 1.372.35.66.111 1.484.25 2.317.292 2.03.1 4.153-.813 4.812-2.627s.403-3.609-1.96-4.685-3.454-2.356-5.363-3.128c-1.247-.505-2.636-.205-4.06.582-3.838 2.121-7.277 8.822-5.69 15.032a.191.191 0 0 1-.315.19 12 12 0 0 1-1.25-1.634 12 12 0 0 1-.769-1.404M11.57 6.087c.649-.051 1.214.501 1.31 1.236.13.979-.228 1.99-1.41 2.013-1.01.02-1.315-.997-1.248-1.614.066-.616.574-1.575 1.35-1.635","h":"#000000"},"Supabase":{"p":"M11.9 1.036c-.015-.986-1.26-1.41-1.874-.637L.764 12.05C-.33 13.427.65 15.455 2.409 15.455h9.579l.113 7.51c.014.985 1.259 1.408 1.873.636l9.262-11.653c1.093-1.375.113-3.403-1.645-3.403h-9.642z","h":"#3FCF8E"},"Gemini":{"p":"M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81","h":"#8E75B2"},"MySQL":{"p":"M16.405 5.501c-.115 0-.193.014-.274.033v.013h.014c.054.104.146.18.214.273.054.107.1.214.154.32l.014-.015c.094-.066.14-.172.14-.333-.04-.047-.046-.094-.08-.14-.04-.067-.126-.1-.18-.153zM5.77 18.695h-.927a50.854 50.854 0 00-.27-4.41h-.008l-1.41 4.41H2.45l-1.4-4.41h-.01a72.892 72.892 0 00-.195 4.41H0c.055-1.966.192-3.81.41-5.53h1.15l1.335 4.064h.008l1.347-4.064h1.095c.242 2.015.384 3.86.428 5.53zm4.017-4.08c-.378 2.045-.876 3.533-1.492 4.46-.482.716-1.01 1.073-1.583 1.073-.153 0-.34-.046-.566-.138v-.494c.11.017.24.026.386.026.268 0 .483-.075.647-.222.197-.18.295-.382.295-.605 0-.155-.077-.47-.23-.944L6.23 14.615h.91l.727 2.36c.164.536.233.91.205 1.123.4-1.064.678-2.227.835-3.483zm12.325 4.08h-2.63v-5.53h.885v4.85h1.745zm-3.32.135l-1.016-.5c.09-.076.177-.158.255-.25.433-.506.648-1.258.648-2.253 0-1.83-.718-2.746-2.155-2.746-.704 0-1.254.232-1.65.697-.43.508-.646 1.256-.646 2.245 0 .972.19 1.686.574 2.14.35.41.877.615 1.583.615.264 0 .506-.033.725-.098l1.325.772.36-.622zM15.5 17.588c-.225-.36-.337-.94-.337-1.736 0-1.393.424-2.09 1.27-2.09.443 0 .77.167.977.5.224.362.336.936.336 1.723 0 1.404-.424 2.108-1.27 2.108-.445 0-.77-.167-.978-.5zm-1.658-.425c0 .47-.172.856-.516 1.156-.344.3-.803.45-1.384.45-.543 0-1.064-.172-1.573-.515l.237-.476c.438.22.833.328 1.19.328.332 0 .593-.073.783-.22a.754.754 0 00.3-.615c0-.33-.23-.61-.648-.845-.388-.213-1.163-.657-1.163-.657-.422-.307-.632-.636-.632-1.177 0-.45.157-.81.47-1.085.315-.278.72-.415 1.22-.415.512 0 .98.136 1.4.41l-.213.476a2.726 2.726 0 00-1.064-.23c-.283 0-.502.068-.654.206a.685.685 0 00-.248.524c0 .328.234.61.666.85.393.215 1.187.67 1.187.67.433.305.648.63.648 1.168zm9.382-5.852c-.535-.014-.95.04-1.297.188-.1.04-.26.04-.274.167.055.053.063.14.11.214.08.134.218.313.346.407.14.11.28.216.427.31.26.16.555.255.81.416.145.094.293.213.44.313.073.05.12.14.214.172v-.02c-.046-.06-.06-.147-.105-.214-.067-.067-.134-.127-.2-.193a3.223 3.223 0 00-.695-.675c-.214-.146-.682-.35-.77-.595l-.013-.014c.146-.013.32-.066.46-.106.227-.06.435-.047.67-.106.106-.027.213-.06.32-.094v-.06c-.12-.12-.21-.283-.334-.395a8.867 8.867 0 00-1.104-.823c-.21-.134-.476-.22-.697-.334-.08-.04-.214-.06-.26-.127-.12-.146-.19-.34-.275-.514a17.69 17.69 0 01-.547-1.163c-.12-.262-.193-.523-.34-.763-.69-1.137-1.437-1.826-2.586-2.5-.247-.14-.543-.2-.856-.274-.167-.008-.334-.02-.5-.027-.11-.047-.216-.174-.31-.235-.38-.24-1.364-.76-1.644-.072-.18.434.267.862.422 1.082.115.153.26.328.34.5.047.116.06.235.107.356.106.294.207.622.347.897.073.14.153.287.247.413.054.073.146.107.167.227-.094.136-.1.334-.154.5-.24.757-.146 1.693.194 2.25.107.166.362.534.703.393.3-.12.234-.5.32-.835.02-.08.007-.133.048-.187v.015c.094.188.188.367.274.555.206.328.566.668.867.895.16.12.287.328.487.402v-.02h-.015c-.043-.058-.1-.086-.154-.133a3.445 3.445 0 01-.35-.4 8.76 8.76 0 01-.747-1.218c-.11-.21-.202-.436-.29-.643-.04-.08-.04-.2-.107-.24-.1.146-.247.273-.32.453-.127.288-.14.642-.188 1.01-.027.007-.014 0-.027.014-.214-.052-.287-.274-.367-.46-.2-.475-.233-1.238-.06-1.785.047-.14.247-.582.167-.716-.042-.127-.174-.2-.247-.303a2.478 2.478 0 01-.24-.427c-.16-.374-.24-.788-.414-1.162-.08-.173-.22-.354-.334-.513-.127-.18-.267-.307-.368-.52-.033-.073-.08-.194-.027-.274.014-.054.042-.075.094-.09.088-.072.335.022.422.062.247.1.455.194.662.334.094.066.195.193.315.226h.14c.214.047.455.014.655.073.355.114.675.28.962.46a5.953 5.953 0 012.085 2.286c.08.154.115.295.188.455.14.33.313.663.455.982.14.315.275.636.476.897.1.14.502.213.682.286.133.06.34.115.46.188.23.14.454.3.67.454.11.076.443.243.463.378z","h":"#4479A1"},"Java":{"p":"M11.915 0 11.7.215C9.515 2.4 7.47 6.39 6.046 10.483c-1.064 1.024-3.633 2.81-3.711 3.551-.093.87 1.746 2.611 1.55 3.235-.198.625-1.304 1.408-1.014 1.939.1.188.823.011 1.277-.491a13.389 13.389 0 0 0-.017 2.14c.076.906.27 1.668.643 2.232.372.563.956.911 1.667.911.397 0 .727-.114 1.024-.264.298-.149.571-.33.91-.5.68-.34 1.634-.666 3.53-.604 1.903.062 2.872.39 3.559.704.687.314 1.15.664 1.925.664.767 0 1.395-.336 1.807-.9.412-.563.631-1.33.72-2.24.06-.623.055-1.32 0-2.066.454.45 1.117.604 1.213.424.29-.53-.816-1.314-1.013-1.937-.198-.624 1.642-2.366 1.549-3.236-.08-.748-2.707-2.568-3.748-3.586C16.428 6.374 14.308 2.394 12.13.215zm.175 6.038a2.95 2.95 0 0 1 2.943 2.942 2.95 2.95 0 0 1-2.943 2.943A2.95 2.95 0 0 1 9.148 8.98a2.95 2.95 0 0 1 2.942-2.942zM8.685 7.983a3.515 3.515 0 0 0-.145.997c0 1.951 1.6 3.55 3.55 3.55 1.95 0 3.55-1.598 3.55-3.55 0-.329-.046-.648-.132-.951.334.095.64.208.915.336a42.699 42.699 0 0 1 2.042 5.829c.678 2.545 1.01 4.92.846 6.607-.082.844-.29 1.51-.606 1.94-.315.431-.713.651-1.315.651-.593 0-.932-.27-1.673-.61-.741-.338-1.825-.694-3.792-.758-1.974-.064-3.073.293-3.821.669-.375.188-.659.373-.911.5s-.466.2-.752.2c-.53 0-.876-.209-1.16-.64-.285-.43-.474-1.101-.545-1.948-.141-1.693.176-4.069.823-6.614a43.155 43.155 0 0 1 1.934-5.783c.348-.167.749-.31 1.192-.425zm-3.382 4.362a.216.216 0 0 1 .13.031c-.166.56-.323 1.116-.463 1.665a33.849 33.849 0 0 0-.547 2.555 3.9 3.9 0 0 0-.2-.39c-.58-1.012-.914-1.642-1.16-2.08.315-.24 1.679-1.755 2.24-1.781zm13.394.01c.562.027 1.926 1.543 2.24 1.783-.246.438-.58 1.068-1.16 2.08a4.428 4.428 0 0 0-.163.309 32.354 32.354 0 0 0-.562-2.49 40.579 40.579 0 0 0-.482-1.652.216.216 0 0 1 .127-.03z","h":"#000000"},"PostgreSQL":{"p":"M23.5594 14.7228a.5269.5269 0 0 0-.0563-.1191c-.139-.2632-.4768-.3418-1.0074-.2321-1.6533.3411-2.2935.1312-2.5256-.0191 1.342-2.0482 2.445-4.522 3.0411-6.8297.2714-1.0507.7982-3.5237.1222-4.7316a1.5641 1.5641 0 0 0-.1509-.235C21.6931.9086 19.8007.0248 17.5099.0005c-1.4947-.0158-2.7705.3461-3.1161.4794a9.449 9.449 0 0 0-.5159-.0816 8.044 8.044 0 0 0-1.3114-.1278c-1.1822-.0184-2.2038.2642-3.0498.8406-.8573-.3211-4.7888-1.645-7.2219.0788C.9359 2.1526.3086 3.8733.4302 6.3043c.0409.818.5069 3.334 1.2423 5.7436.4598 1.5065.9387 2.7019 1.4334 3.582.553.9942 1.1259 1.5933 1.7143 1.7895.4474.1491 1.1327.1441 1.8581-.7279.8012-.9635 1.5903-1.8258 1.9446-2.2069.4351.2355.9064.3625 1.39.3772a.0569.0569 0 0 0 .0004.0041 11.0312 11.0312 0 0 0-.2472.3054c-.3389.4302-.4094.5197-1.5002.7443-.3102.064-1.1344.2339-1.1464.8115-.0025.1224.0329.2309.0919.3268.2269.4231.9216.6097 1.015.6331 1.3345.3335 2.5044.092 3.3714-.6787-.017 2.231.0775 4.4174.3454 5.0874.2212.5529.7618 1.9045 2.4692 1.9043.2505 0 .5263-.0291.8296-.0941 1.7819-.3821 2.5557-1.1696 2.855-2.9059.1503-.8707.4016-2.8753.5388-4.1012.0169-.0703.0357-.1207.057-.1362.0007-.0005.0697-.0471.4272.0307a.3673.3673 0 0 0 .0443.0068l.2539.0223.0149.001c.8468.0384 1.9114-.1426 2.5312-.4308.6438-.2988 1.8057-1.0323 1.5951-1.6698zM2.371 11.8765c-.7435-2.4358-1.1779-4.8851-1.2123-5.5719-.1086-2.1714.4171-3.6829 1.5623-4.4927 1.8367-1.2986 4.8398-.5408 6.108-.13-.0032.0032-.0066.0061-.0098.0094-2.0238 2.044-1.9758 5.536-1.9708 5.7495-.0002.0823.0066.1989.0162.3593.0348.5873.0996 1.6804-.0735 2.9184-.1609 1.1504.1937 2.2764.9728 3.0892.0806.0841.1648.1631.2518.2374-.3468.3714-1.1004 1.1926-1.9025 2.1576-.5677.6825-.9597.5517-1.0886.5087-.3919-.1307-.813-.5871-1.2381-1.3223-.4796-.839-.9635-2.0317-1.4155-3.5126zm6.0072 5.0871c-.1711-.0428-.3271-.1132-.4322-.1772.0889-.0394.2374-.0902.4833-.1409 1.2833-.2641 1.4815-.4506 1.9143-1.0002.0992-.126.2116-.2687.3673-.4426a.3549.3549 0 0 0 .0737-.1298c.1708-.1513.2724-.1099.4369-.0417.156.0646.3078.26.3695.4752.0291.1016.0619.2945-.0452.4444-.9043 1.2658-2.2216 1.2494-3.1676 1.0128zm2.094-3.988-.0525.141c-.133.3566-.2567.6881-.3334 1.003-.6674-.0021-1.3168-.2872-1.8105-.8024-.6279-.6551-.9131-1.5664-.7825-2.5004.1828-1.3079.1153-2.4468.079-3.0586-.005-.0857-.0095-.1607-.0122-.2199.2957-.2621 1.6659-.9962 2.6429-.7724.4459.1022.7176.4057.8305.928.5846 2.7038.0774 3.8307-.3302 4.7363-.084.1866-.1633.3629-.2311.5454zm7.3637 4.5725c-.0169.1768-.0358.376-.0618.5959l-.146.4383a.3547.3547 0 0 0-.0182.1077c-.0059.4747-.054.6489-.115.8693-.0634.2292-.1353.4891-.1794 1.0575-.11 1.4143-.8782 2.2267-2.4172 2.5565-1.5155.3251-1.7843-.4968-2.0212-1.2217a6.5824 6.5824 0 0 0-.0769-.2266c-.2154-.5858-.1911-1.4119-.1574-2.5551.0165-.5612-.0249-1.9013-.3302-2.6462.0044-.2932.0106-.5909.019-.8918a.3529.3529 0 0 0-.0153-.1126 1.4927 1.4927 0 0 0-.0439-.208c-.1226-.4283-.4213-.7866-.7797-.9351-.1424-.059-.4038-.1672-.7178-.0869.067-.276.1831-.5875.309-.9249l.0529-.142c.0595-.16.134-.3257.213-.5012.4265-.9476 1.0106-2.2453.3766-5.1772-.2374-1.0981-1.0304-1.6343-2.2324-1.5098-.7207.0746-1.3799.3654-1.7088.5321a5.6716 5.6716 0 0 0-.1958.1041c.0918-1.1064.4386-3.1741 1.7357-4.4823a4.0306 4.0306 0 0 1 .3033-.276.3532.3532 0 0 0 .1447-.0644c.7524-.5706 1.6945-.8506 2.802-.8325.4091.0067.8017.0339 1.1742.081 1.939.3544 3.2439 1.4468 4.0359 2.3827.8143.9623 1.2552 1.9315 1.4312 2.4543-1.3232-.1346-2.2234.1268-2.6797.779-.9926 1.4189.543 4.1729 1.2811 5.4964.1353.2426.2522.4522.2889.5413.2403.5825.5515.9713.7787 1.2552.0696.087.1372.1714.1885.245-.4008.1155-1.1208.3825-1.0552 1.717-.0123.1563-.0423.4469-.0834.8148-.0461.2077-.0702.4603-.0994.7662zm.8905-1.6211c-.0405-.8316.2691-.9185.5967-1.0105a2.8566 2.8566 0 0 0 .135-.0406 1.202 1.202 0 0 0 .1342.103c.5703.3765 1.5823.4213 3.0068.1344-.2016.1769-.5189.3994-.9533.6011-.4098.1903-1.0957.333-1.7473.3636-.7197.0336-1.0859-.0807-1.1721-.151zm.5695-9.2712c-.0059.3508-.0542.6692-.1054 1.0017-.055.3576-.112.7274-.1264 1.1762-.0142.4368.0404.8909.0932 1.3301.1066.887.216 1.8003-.2075 2.7014a3.5272 3.5272 0 0 1-.1876-.3856c-.0527-.1276-.1669-.3326-.3251-.6162-.6156-1.1041-2.0574-3.6896-1.3193-4.7446.3795-.5427 1.3408-.5661 2.1781-.463zm.2284 7.0137a12.3762 12.3762 0 0 0-.0853-.1074l-.0355-.0444c.7262-1.1995.5842-2.3862.4578-3.4385-.0519-.4318-.1009-.8396-.0885-1.2226.0129-.4061.0666-.7543.1185-1.0911.0639-.415.1288-.8443.1109-1.3505.0134-.0531.0188-.1158.0118-.1902-.0457-.4855-.5999-1.938-1.7294-3.253-.6076-.7073-1.4896-1.4972-2.6889-2.0395.5251-.1066 1.2328-.2035 2.0244-.1859 2.0515.0456 3.6746.8135 4.8242 2.2824a.908.908 0 0 1 .0667.1002c.7231 1.3556-.2762 6.2751-2.9867 10.5405zm-8.8166-6.1162c-.025.1794-.3089.4225-.6211.4225a.5821.5821 0 0 1-.0809-.0056c-.1873-.026-.3765-.144-.5059-.3156-.0458-.0605-.1203-.178-.1055-.2844.0055-.0401.0261-.0985.0925-.1488.1182-.0894.3518-.1226.6096-.0867.3163.0441.6426.1938.6113.4186zm7.9305-.4114c.0111.0792-.049.201-.1531.3102-.0683.0717-.212.1961-.4079.2232a.5456.5456 0 0 1-.075.0052c-.2935 0-.5414-.2344-.5607-.3717-.024-.1765.2641-.3106.5611-.352.297-.0414.6111.0088.6356.1851z","h":"#4169E1"},"Next.js":{"p":"M18.665 21.978C16.758 23.255 14.465 24 12 24 5.377 24 0 18.623 0 12S5.377 0 12 0s12 5.377 12 12c0 3.583-1.574 6.801-4.067 9.001L9.219 7.2H7.2v9.596h1.615V9.251l9.85 12.727Zm-3.332-8.533 1.6 2.061V7.2h-1.6v6.245Z","h":"#000000"},"Redux":{"p":"M16.634 16.504c.87-.075 1.543-.84 1.5-1.754-.047-.914-.796-1.648-1.709-1.648h-.061a1.71 1.71 0 00-1.648 1.769c.03.479.226.869.494 1.153-1.048 2.038-2.621 3.536-5.005 4.795-1.603.838-3.296 1.154-4.944.93-1.378-.195-2.456-.81-3.116-1.799-.988-1.499-1.078-3.116-.255-4.734.6-1.17 1.499-2.023 2.099-2.443a9.96 9.96 0 01-.42-1.543C-.868 14.408-.416 18.752.932 20.805c1.004 1.498 3.057 2.456 5.304 2.456.6 0 1.23-.044 1.843-.194 3.897-.749 6.848-3.086 8.541-6.532zm5.348-3.746c-2.32-2.728-5.738-4.226-9.634-4.226h-.51c-.253-.554-.837-.899-1.498-.899h-.045c-.943 0-1.678.81-1.647 1.753.03.898.794 1.648 1.708 1.648h.074a1.69 1.69 0 001.499-1.049h.555c2.309 0 4.495.674 6.488 1.992 1.527 1.005 2.622 2.323 3.237 3.897.538 1.288.509 2.547-.045 3.597-.855 1.647-2.294 2.517-4.196 2.517-1.199 0-2.367-.375-2.967-.644-.36.298-.96.793-1.394 1.093 1.318.598 2.652.943 3.94.943 2.922 0 5.094-1.647 5.919-3.236.898-1.798.824-4.824-1.47-7.416zM6.49 17.042c.03.899.793 1.648 1.708 1.648h.06a1.688 1.688 0 001.648-1.768c0-.9-.779-1.647-1.693-1.647h-.06c-.06 0-.15 0-.226.029-1.243-2.098-1.768-4.347-1.572-6.772.12-1.828.72-3.417 1.797-4.735.9-1.124 2.593-1.68 3.747-1.708 3.236-.061 4.585 3.971 4.689 5.574l1.498.45C17.741 3.197 14.686.62 11.764.62 9.02.62 6.49 2.613 5.47 5.535 4.077 9.43 4.991 13.177 6.7 16.174c-.15.195-.24.539-.21.868z","h":"#764ABC"},"Firebase":{"p":"M19.455 8.369c-.538-.748-1.778-2.285-3.681-4.569-.826-.991-1.535-1.832-1.884-2.245a146 146 0 0 0-.488-.576l-.207-.245-.113-.133-.022-.032-.01-.005L12.57 0l-.609.488c-1.555 1.246-2.828 2.851-3.681 4.64-.523 1.064-.864 2.105-1.043 3.176-.047.241-.088.489-.121.738-.209-.017-.421-.028-.632-.033-.018-.001-.035-.002-.059-.003a7.46 7.46 0 0 0-2.28.274l-.317.089-.163.286c-.765 1.342-1.198 2.869-1.252 4.416-.07 2.01.477 3.954 1.583 5.625 1.082 1.633 2.61 2.882 4.42 3.611l.236.095.071.025.003-.001a9.59 9.59 0 0 0 2.941.568q.171.006.342.006c1.273 0 2.513-.249 3.69-.742l.008.004.313-.145a9.63 9.63 0 0 0 3.927-3.335c1.01-1.49 1.577-3.234 1.641-5.042.075-2.161-.643-4.304-2.133-6.371m-7.083 6.695c.328 1.244.264 2.44-.191 3.558-1.135-1.12-1.967-2.352-2.475-3.665-.543-1.404-.87-2.74-.974-3.975.48.157.922.366 1.315.622 1.132.737 1.914 1.902 2.325 3.461zm.207 6.022c.482.368.99.712 1.513 1.028-.771.21-1.565.302-2.369.273a8 8 0 0 1-.373-.022c.458-.394.869-.823 1.228-1.279zm1.347-6.431c-.516-1.957-1.527-3.437-3.002-4.398-.647-.421-1.385-.741-2.194-.95.011-.134.026-.268.043-.4.014-.113.03-.216.046-.313.133-.689.332-1.37.589-2.025.099-.25.206-.499.321-.74l.004-.008c.177-.358.376-.719.61-1.105l.092-.152-.003-.001c.544-.851 1.197-1.627 1.942-2.311l.288.341c.672.796 1.304 1.548 1.878 2.237 1.291 1.549 2.966 3.583 3.612 4.48 1.277 1.771 1.893 3.579 1.83 5.375-.049 1.395-.461 2.755-1.195 3.933-.694 1.116-1.661 2.05-2.8 2.708-.636-.318-1.559-.839-2.539-1.599.79-1.575.952-3.28.479-5.072zm-2.575 5.397c-.725.939-1.587 1.55-2.09 1.856-.081-.029-.163-.06-.243-.093l-.065-.026c-1.49-.616-2.747-1.656-3.635-3.01-.907-1.384-1.356-2.993-1.298-4.653.041-1.19.338-2.327.882-3.379.316-.07.638-.114.96-.131l.084-.002c.162-.003.324-.003.478 0 .227.011.454.035.677.07.073 1.513.445 3.145 1.105 4.852.637 1.644 1.694 3.162 3.144 4.515z","h":"#DD2C00"},"AWS":{"p":"M7.2 18.6h10.1a4.3 4.3 0 0 0 .45-8.58 6.2 6.2 0 0 0-11.75-1.3 4.65 4.65 0 0 0 1.2 9.88Z","h":"#FF9900"}}');
/* ---------- the story: a camera that travels the timeline and stops at each stage ---------- */
const NS='http://www.w3.org/2000/svg';
const scene=$('#scene'),card=$('#card'),wire=$('#wire'),segsEl=$('#segs'),yearsEl=$('#years'),fillEl=$('#rail-fill'),knob=$('#knob'),railLine=$('.rail-line'),playBtn=$('#rp-play'),logosEl=$('#c-logos');
const BEATS=4,HOLD=[1450,2400,1600,2900];
const T0=2015,T1=2027;
const X=v=>(v-T0)/(T1-T0)*100;
const evs=$$('[data-co-name]').map(el=>({el,s:+el.dataset.s,e:+el.dataset.e})).sort((a,b)=>a.s-b.s);
for(let y=T0;y<T1;y++){const t=mk('span',null,y);t.style.left=X(y+.5)+'%';yearsEl.appendChild(t)}
evs.forEach((ev,i)=>{
  const g=mk('button','seg');g.type='button';g.style.left=`calc(${X(ev.s)}% - 10px)`;
  g.appendChild(mk('span','lb'));
  g.addEventListener('click',()=>{pause();go(i,BEATS)});
  segsEl.appendChild(g);ev.seg=g;
  ev.btns=null;
});
// The story always starts at its first scene (spec 013).
let idx=0,beat=1,playing=false,timer=null,shown=-1;
const STACK=['Node.js','TypeScript','AWS','GraphQL','React','Datadog','Docker','Python'];
// A simple-icons logo as inline SVG. Brand colours close to black or white would
// vanish in one of the two themes, so those take the text colour instead.
// No safety net on purpose: a technology without an icon breaks here, and the
// story's icon test catches it, instead of initials showing up silently.
function iconSvg(name){
  const ic=ICONS[name],svg=document.createElementNS(NS,'svg');
  svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');
  const n=parseInt(ic.h.slice(1),16),lum=(.2126*(n>>16)+.7152*(n>>8&255)+.0722*(n&255))/255;
  const pa=document.createElementNS(NS,'path');pa.setAttribute('d',ic.p);pa.setAttribute('fill',lum<.22||lum>.86?'currentColor':ic.h);
  svg.appendChild(pa);return svg;
}
$('#stack').replaceChildren(...STACK.map(name=>{
  const li=mk('li');li.title=name;li.setAttribute('aria-label',name);li.appendChild(iconSvg(name));return li;
}));
// Two stages close in time would sit less than 24 px apart, below the WCAG 2.2
// target size. They are pushed apart just enough, without touching the fill or
// the progress marker, which keep following the real dates.
const MIN_HIT=26;
function fitLabels(){
  // Alternating writes and reads forced a layout at every stage (about 14).
  // Now: reset everything, read once, compute the rest without touching the DOM.
  evs.forEach(ev=>{ev.seg.style.setProperty('--nudge','0px');ev.seg.classList.remove('tight')});
  const rects=evs.map(ev=>ev.seg.getBoundingClientRect());
  let prev=null;
  const push=rects.map(r=>{
    const p=prev!==null&&r.left<prev+MIN_HIT?prev+MIN_HIT-r.left:0;
    prev=r.left+p;return p;
  });
  // The active stage's label always shows; it used to land on top of its
  // neighbour ("INFOPAgile Solutions"). It is reserved first, and any label
  // that touches it, on either side, hides.
  const box=i=>({left:rects[i].left+push[i],right:rects[i].right+push[i]});
  const hits=(a,b)=>a.left<b.right+6&&b.left<a.right+6;
  const seen=[box(idx)];
  evs.forEach((ev,i)=>{
    if(push[i])ev.seg.style.setProperty('--nudge',push[i].toFixed(1)+'px');
    if(i===idx)return;
    const b=box(i);
    if(seen.some(p=>hits(b,p)))ev.seg.classList.add('tight');
    else seen.push(b);
  });
}
let szT;
addEventListener('resize',()=>{fitLabels();clearTimeout(szT);szT=setTimeout(measure,160)},{passive:true});
function logosOf(ev){
  if(ev.btns)return ev.btns;
  ev.btns=ev.el.dataset.tech.split(',').map((name,j)=>{
    const b=mk('button','lg');b.type='button';b.style.setProperty('--i',j);
    b.appendChild(iconSvg(name));
    b.setAttribute('aria-label',name);b.setAttribute('title',name);
    b.addEventListener('click',()=>{ask(name);answer.scrollIntoView({behavior:reduce?'auto':'smooth',block:'center'})});
    return b;
  });
  return ev.btns;
}
function fillCard(ev){
  const L=lang==='en'?'En':'Es';
  $('#c-year').textContent=ev.el.querySelector('.when').textContent;
  $('#c-co').textContent=(lang==='en'&&ev.el.dataset.coNameEn)||ev.el.dataset.coName;
  $('#c-role').textContent=ev.el.dataset['role'+L];
  $('#c-sector').textContent=ev.el.dataset['n2'+L];
  $('#c-dur').textContent=ev.el.dataset['n3'+L];
  logosEl.replaceChildren(...logosOf(ev));
}
let measured=0;
// The scene reserves the height of the tallest stage. The card used to be filled
// seven times with a height read after each: seven forced layouts. Now seven
// invisible copies are written and read together: one layout.
function measure(){
  const probes=evs.map(ev=>{
    fillCard(ev);
    const c=card.cloneNode(true);
    c.removeAttribute('id');c.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));
    c.className='card b4';c.style.visibility='hidden';c.setAttribute('aria-hidden','true');c.inert=true;
    return c;
  });
  scene.append(...probes);
  const max=Math.max(...probes.map(c=>c.offsetHeight));
  probes.forEach(c=>c.remove());shown=-1;
  if(Math.abs(max-measured)>2){measured=max;scene.style.minHeight=max+'px'}
  paint(false);
}
function place(W,cw){
  const ev=evs[idx];
  const mid=(X(ev.s)+X(ev.e))/2/100*W;
  card.style.setProperty('--x',Math.round(Math.max(0,Math.min(W-cw,mid-cw/2)))+'px');
  wire.style.setProperty('--wx',Math.round(mid)+'px');
}
function paint(anim){
  // Every measurement first, before any write: a single layout.
  // The card's width does not depend on its content (min(560px,100%)).
  const W=scene.clientWidth,cw=card.offsetWidth,RW=railLine.clientWidth;
  const ev=evs[idx],L=lang==='en'?'En':'Es',D=lang==='es'?ES:EN;let fresh=false;
  if(shown!==idx){
    fillCard(ev);
    shown=idx;fresh=true;
  }
  card.className='card b'+beat;
  if(fresh&&anim&&!reduce){void card.offsetWidth;card.classList.add('enter')}
  place(W,cw);
  const upto=evs.slice(0,idx+1);
  evs.forEach((e,i)=>{e.seg.classList.toggle('seen',i<=idx);e.seg.classList.toggle('on',i===idx);if(i===idx)e.seg.setAttribute('aria-current','true');else e.seg.removeAttribute('aria-current')});
  segLabels();
  fitLabels();
  const prog=X(ev.s+(ev.e-ev.s)*(beat/BEATS));
  fillEl.style.width=prog+'%';
  knob.style.setProperty('--kx',(prog/100*RW).toFixed(1)+'px');
  $('#rp-step').textContent=`${D.rp_step} ${beat}/${BEATS} · ${idx+1}/${evs.length}`;
  $('#k-co').textContent=upto.reduce((a,e)=>a+(+e.el.dataset.co||0),0);
  $('#k-pr').textContent=upto.reduce((a,e)=>a+(+e.el.dataset.pr||0),0);
  const t=new Set();upto.forEach((e,i)=>{if(i<idx||beat===BEATS)e.el.dataset.tech.split(',').forEach(x=>t.add(x))});
  $('#k-te').textContent=t.size;
  logosEl.querySelectorAll('button').forEach(b=>b.tabIndex=beat===BEATS?0:-1);
}
function segLabels(){evs.forEach(e=>{e.seg.querySelector('.lb').textContent=(lang==='en'&&e.el.dataset.shortEn)||e.el.dataset.short})}
function go(i,b){idx=Math.max(0,Math.min(evs.length-1,i));beat=b;paint(true)}
function step(n){
  pause();let b=beat+n,i=idx;
  if(b>BEATS){if(i>=evs.length-1){go(i,BEATS);return}i++;b=1}
  if(b<1){if(i<=0){go(0,1);return}i--;b=BEATS}
  go(i,b);
}
function label(){
  const st=playing?'pause':((idx>=evs.length-1&&beat>=BEATS)?'replay':'play');
  playBtn.className='btn red ic '+st;
  const t=playing?UI[lang].pause:(st==='replay'?UI[lang].again:UI[lang].play);
  playBtn.setAttribute('aria-label',t);playBtn.setAttribute('title',t);
  // The progress marker only makes sense while playing: stopped at the end of a
  // stage it sits on the next stage's dot and makes that one look active.
  railLine.classList.toggle('playing',playing);
}
function pause(){playing=false;clearTimeout(timer);label()}
function tick(){
  timer=setTimeout(()=>{
    if(idx>=evs.length-1&&beat>=BEATS){pause();return}
    if(beat>=BEATS){idx++;beat=1}else beat++;
    paint(true);tick();
  },HOLD[beat-1]);
}
function play(){
  if(playing){pause();return}
  if(idx>=evs.length-1&&beat>=BEATS){idx=0;beat=1;shown=-1;paint(true)}
  playing=true;label();tick();
}
const loader=$('#loader');
const killLoader=()=>loader.classList.add('gone');
if(reduce)killLoader();else{setTimeout(killLoader,1900);addEventListener('pointerdown',killLoader,{once:true})}
// With fireflies animating every frame there may be no idle time: 800 ms at most.
const idle=f=>window.requestIdleCallback?requestIdleCallback(f,{timeout:800}):setTimeout(f,220);
// On phones the landscape is a narrow band: a centred crop would lose the family
// (x≈820) and the basilica (x≈1150). The crop frames both.
const land=$('.land'),bandMQ=matchMedia('(max-width:680px)');
const frame=()=>land&&land.setAttribute('viewBox',bandMQ.matches?'465 300 1040 600':'0 0 1680 900');
bandMQ.addEventListener('change',frame);frame();
// Fireflies: about 22 on desktop and 11 on phones, mostly over the landscape.
// Each flies and blinks at its own pace, so they never glow in unison.
// Their flight scales with the landscape they fly over (spec 014): on a desktop
// 130 px each way over 9-15 s, as before; on a phone, where the landscape is a
// band about 300 px tall, a third of its width over 5-8 s, or they read as still.
const FLIGHT={wide:{dx:()=>130,dy:()=>78,secs:[9,15]},band:{dx:w=>w*.3,dy:(w,h)=>h*.24,secs:[5,8]}};
idle(()=>{
 const host=$('#flies');
 const small=innerWidth<=680,n=small?11:22,r=(a,b)=>a+Math.random()*(b-a);
 const fl=FLIGHT[small?'band':'wide'],dx=fl.dx(host.clientWidth),dy=fl.dy(host.clientWidth,host.clientHeight);
 const f=document.createDocumentFragment();
 for(let i=0;i<n;i++){
   const el=mk('span','fly'),dot=mk('i');
   const high=Math.random()<.18;
   el.style.left=r(3,97).toFixed(1)+'%';
   el.style.top=(high?r(18,48):(small?r(30,88):r(50,78))).toFixed(1)+'%';
   el.style.setProperty('--s',r(3.5,6.5).toFixed(1)+'px');
   el.style.setProperty('--b',r(2.2,4.6).toFixed(1)+'s');
   dot.style.animationDelay=(-r(0,4)).toFixed(1)+'s';
   el.appendChild(dot);f.appendChild(el);
   if(osReduce){dot.style.animation='none';dot.style.opacity='.8';continue}
   // A loop through three points and back, never retracing a line. Explicit px
   // values, not var() in @keyframes: Safari on iPhone ignored those (spec 007).
   const pt=()=>`translate(${r(-dx,dx).toFixed(0)}px,${r(-dy,dy).toFixed(0)}px)`;
   const d=r(...fl.secs)*1000;
   const flight=el.animate([{transform:'translate(0,0)'},{transform:pt()},{transform:pt()},{transform:pt()},{transform:'translate(0,0)'}],
     {duration:d,iterations:Infinity,easing:'ease-in-out',delay:-r(0,d)});
   if(reduce)flight.pause(); // the page's switch is off: ready to fly when it is turned on
 }
 host.appendChild(f);
});
const fab=$('#fab'),pop=$('#pop');
function setPop(open){
  pop.hidden=!open;fab.setAttribute('aria-expanded',String(open));
  if(open)pop.querySelector('.pop-a').focus({preventScroll:true});
}
fab.addEventListener('click',()=>setPop(pop.hidden));
addEventListener('keydown',e=>{if(e.key==='Escape'&&!pop.hidden){setPop(false);fab.focus()}});
addEventListener('pointerdown',e=>{if(!pop.hidden&&!e.target.closest('.dock'))setPop(false)});
const popCopy=$('#pop-copy');
async function copyMail(){
  try{await navigator.clipboard.writeText(MAIL);return true}catch(e){/* no permission or no HTTPS: try the old method */}
  const t=mk('input');t.value=MAIL;document.body.appendChild(t);t.select();
  let ok=false;try{ok=document.execCommand('copy')}catch(e){ok=false}
  t.remove();return ok;
}
// If nothing could copy, the button shows the address to copy by hand:
// saying "Copied" without having copied would be a lie.
popCopy.addEventListener('click',async()=>{
  const ok=await copyMail();
  popCopy.textContent=ok?(lang==='es'?ES:EN).c_done:MAIL;
  setTimeout(()=>{popCopy.textContent=(lang==='es'?ES:EN).c_copy},ok?1800:6000);
});
const narrow=matchMedia('(max-width:430px)');
const toTop=$('#to-top');
addEventListener('scroll',()=>{toTop.classList.toggle('show',scrollY>innerHeight*.75)},{passive:true});
narrow.addEventListener('change',()=>applyLang(lang));
toTop.addEventListener('click',()=>{scrollTo({top:0,behavior:reduce?'auto':'smooth'});pause();go(0,1)});
playBtn.addEventListener('click',play);
$('#rp-prev').addEventListener('click',()=>step(-1));
$('#rp-next').addEventListener('click',()=>step(1));
scene.addEventListener('click',e=>{if(!e.target.closest('button'))step(1)});
let sx=null;
scene.addEventListener('pointerdown',e=>{sx=e.clientX});
scene.addEventListener('pointerup',e=>{if(sx!==null&&Math.abs(e.clientX-sx)>45){step(e.clientX<sx?1:-1)}sx=null});
addEventListener('keydown',e=>{if(e.target.matches('input,textarea'))return;if(e.key==='ArrowRight')step(1);if(e.key==='ArrowLeft')step(-1)});
let rt;addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(measure,150)});
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>idle(measure));

/* ---------- index: the CV below is the corpus ---------- */
// The ranking lives in js/search.js, pure and unit-tested. This adapter turns
// the CV's [data-chunk] blocks into plain passages and maps ids back to elements.
let index=null,passageEls=new Map(),indexReady=false;
function buildIndex(){
  const docs=[];passageEls=new Map();
  for(const el of $$('[data-chunk]')){
    // A block with no [data-line] would be rejected by createIndex, loudly.
    const lines=el.matches('[data-line]')?[el]:[...el.querySelectorAll('[data-line]')];
    if(el.dataset.sec==='case'){
      // A case is indexed line by line, each with its project's name and its
      // part's heading ("Decisions"): short passages like the CV's own. As one
      // long passage it raised the average length BM25 normalizes by, and short
      // skill lines fell below the cutoff.
      lines.forEach((l,i)=>{
        const part=l.closest('dd').previousElementSibling.textContent;
        passageEls.set(`${el.id}:${i}`,{el,lines:[l]});
        docs.push({id:`${el.id}:${i}`,section:'case',text:`${el.dataset.name} ${part} ${l.textContent}`,lines:[{text:l.textContent}]});
      });
      continue;
    }
    passageEls.set(el.id,{el,lines});
    docs.push({id:el.id,section:el.dataset.sec,text:el.textContent,lines:lines.map(l=>({text:l.textContent}))});
  }
  index=createIndex(docs);indexReady=true;
}
// Search modes (docs/specs/003): which CV sections may answer. "all" searches
// everything, education and profile included.
const MODES={all:undefined,exp:['exp'],proj:['proj','case'],skills:['skills','lang']};
let mode='all';
function search(q){
  if(!indexReady)buildIndex();
  // Ask for more than three: several lines of one case may rank, and each
  // case answers once, with its best line.
  const res=rank(index,q,{sections:MODES[mode],limit:6}),seen=new Set();
  return{terms:new Set(res.terms),hits:res.hits.map(h=>{
    const p=passageEls.get(h.id);
    return{el:p.el,lines:h.lines.map(i=>p.lines[i]),matched:h.matched,synonyms:new Set(h.synonyms)};
  }).filter(h=>!seen.has(h.el)&&seen.add(h.el)).slice(0,3)};
}


/* ---------- questions ---------- */
const answer=$('#answer'),hist=$('#hist'),asked=[];
function marked(text,terms){
  const p=mk('p','hit-txt');
  text.split(/([\p{L}\p{N}#+]+)/u).forEach(piece=>{
    if(!piece)return;const t=tokenize(piece)[0];
    p.appendChild(isHit(t,terms)?mk('mark',null,piece):document.createTextNode(piece));
  });return p;
}
function titleOf(c){
  const sec=SEC[lang][c.dataset.sec],h=c.querySelector('h3'),w=c.querySelector('.when');
  if(c.dataset.sec==='case')return `${sec}: ${c.dataset.name}`;
  if(w&&w.classList.contains('k'))return `${sec}: ${w.textContent}`;
  if(!h)return sec;
  return `${sec}: ${h.textContent}, ${w.textContent}`; // every block with an h3 has a date (.when)
}
function fail(text,err){
  const D=lang==='es'?ES:EN,box=mk('div','ans in');
  box.appendChild(mk('h3','ans-q',text));
  const p=mk('p','none',D.oops+' '),a=mk('a',null,MAIL);
  a.href='mailto:'+MAIL;p.appendChild(a);box.appendChild(p);
  if(err)box.appendChild(mk('p','ans-meta',String(err).slice(0,120)));
  answer.replaceChildren(box);
}
// The try/catch is not decoration: if fail() threw inside this listener, that
// exception would fire another 'error' event, and so on forever.
addEventListener('error',e=>{try{if(!answer.children.length)fail('',e.message)}catch(_){/* nowhere left to show it */}});
function ask(text,silent){
  try{askInner(text,silent)}catch(err){fail(text,err&&err.message)}
}
let current={text:'',silent:true};
function askInner(text,silent){
  text=text.trim();current={text,silent};
  const t0=performance.now(),res=search(text),ms=performance.now()-t0;
  const box=mk('div','ans'+(silent?'':' in'));
  if(!silent){const x=mk('button','ans-x','×');x.type='button';x.setAttribute('aria-label',(lang==='es'?ES:EN).clear);x.addEventListener('click',clearAsk);box.appendChild(x)}
  box.appendChild(mk('h3','ans-q',text));box.appendChild(mk('p','ans-meta',UI[lang].meta(res.hits.length,num(ms,lang))));
  if(!res.hits.length&&mode!=='all'){
    // Nothing in this mode is not "nothing in the CV": offer the wider search.
    const label=$(`#modes input[value="${mode}"]`).nextElementSibling.textContent;
    box.appendChild(mk('p','none',UI[lang].noneIn(label)));
    const b=mk('button','try-all',UI[lang].tryAll);b.type='button';
    b.addEventListener('click',()=>{$('#modes input[value="all"]').checked=true;mode='all';ask(text)});
    box.appendChild(b);
  }else if(!res.hits.length){
    const p=mk('p','none',UI[lang].none+' '),a=mk('a',null,MAIL);a.href='mailto:'+MAIL;p.appendChild(a);box.appendChild(p);
  }
  res.hits.forEach((h,i)=>{
    const art=mk('article','hit');art.style.setProperty('--i',i);art.appendChild(mk('p','hit-src',titleOf(h.el)));
    const why=mk('p','hit-why');why.appendChild(mk('span',null,UI[lang].why));
    h.matched.slice(0,6).forEach(t=>{
      const syn=h.synonyms.has(t),ev=mk('span','ev'+(syn?' syn':''),surfaceForm(h.el.textContent,t));
      if(syn){ev.title=UI[lang].syn;ev.appendChild(mk('span','vh',` (${UI[lang].syn})`))}
      why.appendChild(ev);
    });
    art.appendChild(why);
    h.lines.forEach(l=>art.appendChild(marked(l.textContent,res.terms)));
    // Only About and Projects are on screen; the rest of the CV exists for the PDF
    // and for this search. Nobody can be sent to a hidden passage.
    if(!h.el.closest('.cv-only')){
      const a=mk('a',null,UI[lang].see);a.href='#'+h.el.id;
      // A case lives in a closed <details>: open it, or the scroll lands on a summary.
      a.addEventListener('click',e=>{e.preventDefault();if(h.lines.some(l=>l.closest('[data-deep]')))$('#views [value=deep]').checked=true;h.el.open=true;flash(h.el)});
      art.appendChild(a);
    }
    box.appendChild(art);
  });
  answer.replaceChildren(box);
  if(!silent){
    const k=norm(text);if(!asked.some(a=>norm(a)===k)){asked.unshift(text);asked.length=Math.min(asked.length,5)}
    hist.hidden=false;hist.replaceChildren(mk('span',null,UI[lang].hist));
    asked.forEach(a=>{const b=mk('button','chip',a);b.type='button';b.addEventListener('click',()=>ask(a));hist.appendChild(b)});
    const rb=answer.getBoundingClientRect();
    if(rb.top<70||rb.bottom>innerHeight)answer.scrollIntoView({behavior:reduce?'auto':'smooth',block:'nearest'});
    box.classList.remove('in');void box.offsetWidth;box.classList.add('in');
  }
}
// A single question box, the one on the cover. The section below shows the
// answer, the suggestions and the history, without a second box repeating it.
const mini=$('#q-mini');
function clearAsk(){mini.value='';asked.length=0;hist.hidden=true;answer.replaceChildren();ask($('#chips .chip').textContent,true)}
answer.addEventListener('keydown',e=>{if(e.key==='Escape')clearAsk()});
mini.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();clearAsk()}});
$('#ask-mini').addEventListener('submit',e=>{
  e.preventDefault();
  const v=mini.value.trim();
  if(!v){mini.focus();return}
  mini.value='';ask(v);
  $('#ask-sec').scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'});
});
// On phones the question box moves next to its suggested questions (spec 008):
// on the cover it sat a screen and a half away from them. Still one box.
const box=$('#ask-mini'),boxHome=box.parentElement,phoneMQ=matchMedia('(max-width:680px)');
const placeBox=()=>phoneMQ.matches?$('#ask-sec .grid').prepend(box):boxHome.append(box);
phoneMQ.addEventListener('change',placeBox);placeBox();
// Pointer response (spec 011): the cover cards lean toward the pointer, and a
// project row glows where the pointer is. Only for a mouse or trackpad, never
// for touch, and never under reduced motion. The values feed CSS; the CSS
// decides the motion.
if(!osReduce&&matchMedia('(hover:hover) and (pointer:fine)').matches){
  const at=(e,f)=>{const el=e.currentTarget,r=el.getBoundingClientRect();f(el,(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height,r)};
  $$('.tile').forEach(el=>{
    el.addEventListener('pointermove',e=>at(e,(el,x,y)=>{el.style.setProperty('--tx',((x-.5)*9).toFixed(2)+'deg');el.style.setProperty('--ty',((.5-y)*9).toFixed(2)+'deg')}));
    el.addEventListener('pointerleave',()=>{el.style.removeProperty('--tx');el.style.removeProperty('--ty')});
  });
  $$('.sheet .row').forEach(el=>el.addEventListener('pointermove',e=>at(e,(el,x,y,r)=>{el.style.setProperty('--mx',Math.round(x*r.width)+'px');el.style.setProperty('--my',Math.round(y*r.height)+'px')})));
}
// In-page links land where they point (spec 009). The sections below the story
// skip rendering until seen (content-visibility), so the browser aims at their
// estimated heights and stops short. Once the scroll settles, aim again at the
// real position. The browser's own jump stays: hash, focus, history.
document.addEventListener('click',e=>{
  // A link the page already handles ("See it" centres and flashes) is left alone.
  const a=!e.defaultPrevented&&e.target.closest('a[href^="#"]'),t=a&&document.getElementById(a.hash.slice(1));
  if(!t)return;
  // Whichever comes first, the scroll ending or a fallback for browsers without
  // scrollend, cancels the other: one correction, never a snap back later.
  const settle=()=>{clearTimeout(timer);removeEventListener('scrollend',settle);t.scrollIntoView({behavior:'auto'})};
  addEventListener('scrollend',settle);const timer=setTimeout(settle,1200);
});
$('#ask-again').addEventListener('click',()=>{
  if(phoneMQ.matches)box.scrollIntoView({behavior:reduce?'auto':'smooth',block:'center'});
  else scrollTo({top:0,behavior:reduce?'auto':'smooth'});
  mini.focus({preventScroll:true});
});
// On phones the questions come four at a time (spec 012). Each tap brings the
// next four in, one after another, and focus goes to the first new question.
// Wider screens show all twelve and never see the button (CSS).
const chips=$('#chips'),more=$('#chips-more'),BATCH=4;
more.addEventListener('click',()=>{
  const from=+chips.dataset.shown,all=$$('#chips .chip'),next=all.slice(from,from+BATCH);
  next.forEach((c,k)=>{c.style.setProperty('--k',k);c.classList.add('in')});
  chips.dataset.shown=from+BATCH;
  const left=all.length-from-BATCH;
  more.hidden=left<=0;more.querySelector('.n').textContent='+'+left;
  next[0].focus();
});
$('#chips').addEventListener('click',e=>{const b=e.target.closest('.chip');if(b)ask(b.textContent)});
// Switching mode re-asks whatever is on screen, in the new scope.
$('#modes').addEventListener('change',e=>{mode=e.target.value;ask(current.text,current.silent)});

/* ---------- motion switch (spec 019) ---------- */
// Off, CSS stops every animation and transition, the fireflies land, the
// story stops, and jumps around the page become instant. On again, it all resumes.
const motionBtn=$('#motion');
motionBtn.setAttribute('aria-pressed',String(!reduce));
motionBtn.addEventListener('click',()=>{
  reduce=!reduce;
  document.documentElement.dataset.motion=reduce?'off':'on';
  try{localStorage.setItem('motion',document.documentElement.dataset.motion)}catch(e){}
  $$('.fly').forEach(f=>f.getAnimations().forEach(a=>reduce?a.pause():a.play()));
  if(reduce)pause();
  motionBtn.setAttribute('aria-pressed',String(!reduce));
});
/* ---------- theme ---------- */
const themeBtn=$('#theme'),root=document.documentElement;
function paintTheme(){
  const dark=root.dataset.theme!=='light';
  const tl=dark?UI[lang].light:UI[lang].dark;
  themeBtn.setAttribute('aria-label',tl);themeBtn.setAttribute('title',tl);
  $('meta[name=theme-color]').content=dark?'#1C1830':'#FBF3E4';
}
themeBtn.addEventListener('click',()=>{root.dataset.theme=root.dataset.theme==='light'?'dark':'light';try{localStorage.setItem('theme',root.dataset.theme)}catch(e){}paintTheme()});

/* ---------- language ---------- */
const langBtn=$('#lang');
function applyLang(l){
  lang=l;const D=l==='es'?ES:EN;
  root.lang=l;
  $$('[data-i18n]').forEach(e=>{const v=D[e.dataset.i18n];if(v!=null)e.textContent=v});
  $$('[data-i18n-aria]').forEach(e=>e.setAttribute('aria-label',D[e.dataset.i18nAria]));
  $('#q-mini').placeholder=D.ph_mini;
  document.title=META[l].t;$('meta[name=description]').content=META[l].d;
  $('meta[property="og:locale"]').content=l==='es'?'es_ES':'en_US';
  const full=l==='es'?'English':'Español',code=l==='es'?'EN':'ES';
  langBtn.textContent=code;
  langBtn.setAttribute('aria-label',code+', '+full);langBtn.setAttribute('title',full);langBtn.lang=l==='es'?'en':'es';
  $$('a.dl').forEach(a=>{if(a.dataset.i18n==='dl')a.textContent=narrow.matches?'CV':D.dl});
  $$('a.dl').forEach(a=>a.href=`Ana-Izaguirre-CV-${l.toUpperCase()}.pdf`);
  // First load: text now, measurements when the main thread is free, in two
  // tasks so neither reaches 50 ms on a slow phone. A language switch measures at once.
  indexReady=false;paintTheme();shown=-1;if(booted){paint(false);measure()}else{fillCard(evs[idx]);shown=idx;segLabels();idle(()=>{paint(false);idle(measure)})}
  label();
  asked.length=0;hist.hidden=true;
  const first=$('#chips .chip').textContent;
  idle(()=>ask(first,true));
  try{localStorage.setItem('lang',l)}catch(e){}
}
langBtn.addEventListener('click',()=>applyLang(lang==='es'?'en':'es'));
// The story is below the fold: on first load its measurement waits for a free
// main thread; on a language switch it runs at once.
let booted=false;
applyLang(window.LANG0);booted=true; // LANG0: decided in index.html before the first frame

/* one orchestrated moment on arrival: the career plays once */
// It plays when the story comes into view, not on the cover where nobody sees
// it: by the time a visitor scrolled down, it used to be over (spec 013).
function wake(){
  document.documentElement.classList.remove('boot');
  const seen=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting)){seen.disconnect();if(!playing&&idx===0&&beat===1)play()}},{threshold:.45});
  seen.observe($('#scene'));
}
if(reduce||quiet)document.documentElement.classList.remove('boot');
else if(document.readyState==='complete')idle(()=>setTimeout(wake,120));
else addEventListener('load',()=>idle(()=>setTimeout(wake,120)),{once:true});
window.__cv={search,ask};
})();
