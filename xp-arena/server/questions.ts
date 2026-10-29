// Question bank: medical prefixes, suffixes and roots (slide 01 · Learning Objective).
// recall = name the meaning of a word part, decode = split a term, apply = pick the term for a scenario.

import type { Question } from '../shared/types';

type Q = Omit<Question, 'id'>;

const recall: Q[] = [
  { kind: 'recall', prompt: 'What does this word part mean?', term: 'cardi-', choices: ['Heart', 'Lung', 'Liver', 'Blood'], answer: 0, breakdown: [{ part: 'cardi-', meaning: 'heart' }], result: 'heart, as in cardiology' },
  { kind: 'recall', prompt: 'What does this suffix mean?', term: '-itis', choices: ['Surgical removal', 'Inflammation', 'Study of', 'Pain'], answer: 1, breakdown: [{ part: '-itis', meaning: 'inflammation' }], result: 'inflammation, as in tonsillitis' },
  { kind: 'recall', prompt: 'What does this root mean?', term: 'gastr-', choices: ['Intestine', 'Kidney', 'Stomach', 'Throat'], answer: 2, breakdown: [{ part: 'gastr-', meaning: 'stomach' }], result: 'stomach, as in gastric' },
  { kind: 'recall', prompt: 'What does this root mean?', term: 'hepat-', choices: ['Spleen', 'Pancreas', 'Gallbladder', 'Liver'], answer: 3, breakdown: [{ part: 'hepat-', meaning: 'liver' }], result: 'liver, as in hepatitis' },
  { kind: 'recall', prompt: 'What does this root mean?', term: 'nephr-', choices: ['Kidney', 'Nerve', 'Bladder', 'Bone'], answer: 0, breakdown: [{ part: 'nephr-', meaning: 'kidney' }], result: 'kidney, as in nephrology' },
  { kind: 'recall', prompt: 'What does this suffix mean?', term: '-ectomy', choices: ['Cutting into', 'Visual exam', 'Surgical removal', 'Repair'], answer: 2, breakdown: [{ part: '-ectomy', meaning: 'surgical removal' }], result: 'surgical removal, as in appendectomy' },
  { kind: 'recall', prompt: 'What does this suffix mean?', term: '-algia', choices: ['Swelling', 'Pain', 'Bleeding', 'Hardening'], answer: 1, breakdown: [{ part: '-algia', meaning: 'pain' }], result: 'pain, as in neuralgia' },
  { kind: 'recall', prompt: 'What does this root mean?', term: 'oste-', choices: ['Muscle', 'Joint', 'Cartilage', 'Bone'], answer: 3, breakdown: [{ part: 'oste-', meaning: 'bone' }], result: 'bone, as in osteoporosis' },
  { kind: 'recall', prompt: 'What does this suffix mean?', term: '-logy', choices: ['Study of', 'Disease of', 'Record of', 'Fear of'], answer: 0, breakdown: [{ part: '-logy', meaning: 'study of' }], result: 'study of, as in biology' },
  { kind: 'recall', prompt: 'What does this prefix mean?', term: 'brady-', choices: ['Fast', 'Irregular', 'Slow', 'Absent'], answer: 2, breakdown: [{ part: 'brady-', meaning: 'slow' }], result: 'slow, as in bradycardia' },
  { kind: 'recall', prompt: 'What does this prefix mean?', term: 'tachy-', choices: ['Weak', 'Fast', 'Deep', 'Painful'], answer: 1, breakdown: [{ part: 'tachy-', meaning: 'fast' }], result: 'fast, as in tachycardia' },
  { kind: 'recall', prompt: 'What does this prefix mean?', term: 'hypo-', choices: ['Below normal', 'Above normal', 'Around', 'Within'], answer: 0, breakdown: [{ part: 'hypo-', meaning: 'below, deficient' }], result: 'below normal, as in hypothermia' },
  { kind: 'recall', prompt: 'What does this root mean?', term: 'derm-', choices: ['Hair', 'Skin', 'Nail', 'Gland'], answer: 1, breakdown: [{ part: 'derm-', meaning: 'skin' }], result: 'skin, as in dermatology' },
  { kind: 'recall', prompt: 'What does this root mean?', term: 'arthr-', choices: ['Artery', 'Muscle', 'Joint', 'Tendon'], answer: 2, breakdown: [{ part: 'arthr-', meaning: 'joint' }], result: 'joint, as in arthritis' },
  { kind: 'recall', prompt: 'What does this suffix mean?', term: '-scopy', choices: ['Visual examination', 'Surgical repair', 'Measurement', 'Recording'], answer: 0, breakdown: [{ part: '-scopy', meaning: 'visual examination' }], result: 'looking inside with a scope, as in endoscopy' },
  { kind: 'recall', prompt: 'What does this root mean?', term: 'encephal-', choices: ['Spine', 'Skull', 'Nerve', 'Brain'], answer: 3, breakdown: [{ part: 'encephal-', meaning: 'brain' }], result: 'brain, as in encephalitis' },
];

const decode: Q[] = [
  { kind: 'decode', prompt: 'Break it down. What does this term mean?', term: 'gastritis', choices: ['Stomach pain', 'Stomach inflammation', 'Removal of the stomach', 'Study of the stomach'], answer: 1, breakdown: [{ part: 'gastr', meaning: 'stomach' }, { part: 'itis', meaning: 'inflammation' }], result: 'stomach inflammation' },
  { kind: 'decode', prompt: 'Break it down. What does this term mean?', term: 'cardiology', choices: ['Study of the heart', 'Heart inflammation', 'Enlarged heart', 'Heart surgery'], answer: 0, breakdown: [{ part: 'cardi', meaning: 'heart' }, { part: 'o', meaning: 'combining vowel' }, { part: 'logy', meaning: 'study of' }], result: 'study of the heart' },
  { kind: 'decode', prompt: 'Break it down. What does this term mean?', term: 'hepatomegaly', choices: ['Liver inflammation', 'Liver removal', 'Enlarged liver', 'Liver pain'], answer: 2, breakdown: [{ part: 'hepat', meaning: 'liver' }, { part: 'o', meaning: 'combining vowel' }, { part: 'megaly', meaning: 'enlargement' }], result: 'enlargement of the liver' },
  { kind: 'decode', prompt: 'Break it down. What does this term mean?', term: 'nephrectomy', choices: ['Kidney stone', 'Kidney inflammation', 'Study of kidneys', 'Removal of a kidney'], answer: 3, breakdown: [{ part: 'nephr', meaning: 'kidney' }, { part: 'ectomy', meaning: 'surgical removal' }], result: 'surgical removal of a kidney' },
  { kind: 'decode', prompt: 'Break it down. What does this term mean?', term: 'arthralgia', choices: ['Joint pain', 'Joint removal', 'Bone pain', 'Muscle pain'], answer: 0, breakdown: [{ part: 'arthr', meaning: 'joint' }, { part: 'algia', meaning: 'pain' }], result: 'joint pain' },
  { kind: 'decode', prompt: 'Break it down. What does this term mean?', term: 'bradycardia', choices: ['Fast heart rate', 'Slow heart rate', 'Heart failure', 'Heart murmur'], answer: 1, breakdown: [{ part: 'brady', meaning: 'slow' }, { part: 'card', meaning: 'heart' }, { part: 'ia', meaning: 'condition' }], result: 'a slow heart rate' },
  { kind: 'decode', prompt: 'Break it down. What does this term mean?', term: 'encephalitis', choices: ['Brain tumor', 'Brain scan', 'Inflammation of the brain', 'Study of the brain'], answer: 2, breakdown: [{ part: 'encephal', meaning: 'brain' }, { part: 'itis', meaning: 'inflammation' }], result: 'inflammation of the brain' },
  { kind: 'decode', prompt: 'Break it down. What does this term mean?', term: 'hypoglycemia', choices: ['High blood sugar', 'Low blood pressure', 'Low blood sugar', 'Low red cell count'], answer: 2, breakdown: [{ part: 'hypo', meaning: 'below normal' }, { part: 'glyc', meaning: 'sugar' }, { part: 'emia', meaning: 'blood condition' }], result: 'low blood sugar' },
  { kind: 'decode', prompt: 'Break it down. What does this term mean?', term: 'tachypnea', choices: ['Rapid breathing', 'No breathing', 'Painful breathing', 'Slow breathing'], answer: 0, breakdown: [{ part: 'tachy', meaning: 'fast' }, { part: 'pnea', meaning: 'breathing' }], result: 'rapid breathing' },
  { kind: 'decode', prompt: 'Break it down. What does this term mean?', term: 'osteoarthritis', choices: ['Bone fracture', 'Muscle and joint pain', 'Softening of the bones', 'Inflammation of bone and joint'], answer: 3, breakdown: [{ part: 'oste', meaning: 'bone' }, { part: 'o', meaning: 'combining vowel' }, { part: 'arthr', meaning: 'joint' }, { part: 'itis', meaning: 'inflammation' }], result: 'inflammation of bone and joint' },
  { kind: 'decode', prompt: 'Break it down. What does this term mean?', term: 'dermatitis', choices: ['Skin inflammation', 'Skin removal', 'Study of the skin', 'Skin infection'], answer: 0, breakdown: [{ part: 'dermat', meaning: 'skin' }, { part: 'itis', meaning: 'inflammation' }], result: 'inflammation of the skin' },
  { kind: 'decode', prompt: 'Break it down. What does this term mean?', term: 'colonoscopy', choices: ['Removal of the colon', 'Visual exam of the colon', 'Colon inflammation', 'Opening in the colon'], answer: 1, breakdown: [{ part: 'colon', meaning: 'colon' }, { part: 'o', meaning: 'combining vowel' }, { part: 'scopy', meaning: 'visual examination' }], result: 'looking inside the colon with a scope' },
];

const apply: Q[] = [
  { kind: 'apply', prompt: 'A patient’s resting heart rate is 48 beats per minute. Which term fits?', choices: ['Tachycardia', 'Bradycardia', 'Arrhythmia', 'Bradypnea'], answer: 1, breakdown: [{ part: 'brady', meaning: 'slow' }, { part: 'card', meaning: 'heart' }, { part: 'ia', meaning: 'condition' }], result: 'bradycardia: a slow heart rate' },
  { kind: 'apply', prompt: 'A patient with diabetes is shaky and sweaty. Their blood sugar reads 55 mg/dL. Which term fits?', choices: ['Hyperglycemia', 'Hypertension', 'Hypoglycemia', 'Anemia'], answer: 2, breakdown: [{ part: 'hypo', meaning: 'below normal' }, { part: 'glyc', meaning: 'sugar' }, { part: 'emia', meaning: 'blood condition' }], result: 'hypoglycemia: low blood sugar' },
  { kind: 'apply', prompt: 'The surgeon removes the patient’s gallbladder. What is the procedure called?', choices: ['Cholecystitis', 'Cholecystotomy', 'Cholelithiasis', 'Cholecystectomy'], answer: 3, breakdown: [{ part: 'chole', meaning: 'bile' }, { part: 'cyst', meaning: 'sac, bladder' }, { part: 'ectomy', meaning: 'surgical removal' }], result: 'cholecystectomy: removal of the gallbladder' },
  { kind: 'apply', prompt: 'A patient is breathing 32 times a minute after climbing stairs. Which term fits?', choices: ['Tachypnea', 'Apnea', 'Bradypnea', 'Tachycardia'], answer: 0, breakdown: [{ part: 'tachy', meaning: 'fast' }, { part: 'pnea', meaning: 'breathing' }], result: 'tachypnea: rapid breathing' },
  { kind: 'apply', prompt: 'A scope is passed down the throat to look inside the stomach. What is this called?', choices: ['Gastrectomy', 'Gastroscopy', 'Gastritis', 'Gastrostomy'], answer: 1, breakdown: [{ part: 'gastr', meaning: 'stomach' }, { part: 'o', meaning: 'combining vowel' }, { part: 'scopy', meaning: 'visual examination' }], result: 'gastroscopy: looking inside the stomach' },
  { kind: 'apply', prompt: 'A patient’s blood pressure is consistently 160/100. Which term fits?', choices: ['Hypotension', 'Hyperglycemia', 'Hypertension', 'Tachycardia'], answer: 2, breakdown: [{ part: 'hyper', meaning: 'above normal' }, { part: 'tension', meaning: 'pressure' }], result: 'hypertension: high blood pressure' },
  { kind: 'apply', prompt: 'On exam, the patient’s liver is noticeably enlarged. Which term fits?', choices: ['Hepatomegaly', 'Hepatitis', 'Cardiomegaly', 'Splenomegaly'], answer: 0, breakdown: [{ part: 'hepat', meaning: 'liver' }, { part: 'o', meaning: 'combining vowel' }, { part: 'megaly', meaning: 'enlargement' }], result: 'hepatomegaly: an enlarged liver' },
  { kind: 'apply', prompt: 'A patient’s knee is swollen, red and painful to move. Which term fits?', choices: ['Osteoporosis', 'Myalgia', 'Neuritis', 'Arthritis'], answer: 3, breakdown: [{ part: 'arthr', meaning: 'joint' }, { part: 'itis', meaning: 'inflammation' }], result: 'arthritis: joint inflammation' },
  { kind: 'apply', prompt: 'A patient has a red, itchy rash after touching a new soap. Which term fits?', choices: ['Dermatology', 'Dermatitis', 'Dermatome', 'Hematoma'], answer: 1, breakdown: [{ part: 'dermat', meaning: 'skin' }, { part: 'itis', meaning: 'inflammation' }], result: 'dermatitis: skin inflammation' },
  { kind: 'apply', prompt: 'A patient describes sharp, shooting pain along a nerve in the face. Which term fits?', choices: ['Neuralgia', 'Neurology', 'Arthralgia', 'Neuroma'], answer: 0, breakdown: [{ part: 'neur', meaning: 'nerve' }, { part: 'algia', meaning: 'pain' }], result: 'neuralgia: nerve pain' },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Builds a round: recall first, then decode, then patient scenarios, so the
 * difficulty ramps the way the learning objective does (recall → decode → apply).
 * The last question is always an untimed review scenario.
 */
export function buildRound(total: number): Question[] {
  const timed = total - 1;
  const nRecall = Math.round(timed * 0.4);
  const nDecode = Math.round(timed * 0.35);
  const nApply = timed - nRecall - nDecode;
  const scenarios = shuffle(apply);
  const picked: Q[] = [
    ...shuffle(recall).slice(0, nRecall),
    ...shuffle(decode).slice(0, nDecode),
    ...scenarios.slice(0, nApply),
  ];
  const review = scenarios[nApply];
  return [...picked, review].map((q, i) => ({ ...q, id: `q${i + 1}` }));
}
