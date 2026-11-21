// Official Sales Agency Online Evaluation Test Questions & Scoring Logic

export const ASSESSMENT_QUESTIONS = [
  {
    id: 'q1',
    category: 'Sales Acumen',
    question: 'A retail shopkeeper in your territory states that competitor products are slightly cheaper. What is the most effective sales response?',
    options: [
      { id: 'a', text: 'Agree with them and immediately offer an unauthorized secret discount.' },
      { id: 'b', text: 'Acknowledge the price difference, highlight Silent Strides\' superior product quality, reliability, fast restocking, and proven customer demand.' },
      { id: 'c', text: 'Argue with the shopkeeper and tell them competitor products are inferior.' },
      { id: 'd', text: 'Walk away immediately without trying to understand their business needs.' }
    ],
    correctAnswer: 'b',
    weight: 1
  },
  {
    id: 'q2',
    category: 'Financial Ethics & Integrity',
    question: 'A customer hands you cash or sends funds to your personal M-Pesa line for a Silent Strides order. According to company policy, what must you do?',
    options: [
      { id: 'a', text: 'Keep the funds temporarily until the end of the month and pay in bulk.' },
      { id: 'b', text: 'Deduct your commission upfront before sending the remainder to the company.' },
      { id: 'c', text: 'Immediately remit the full gross amount to the designated official company Paybill/Till and record the transaction in the system with the M-Pesa reference code.' },
      { id: 'd', text: 'Ask the customer to pay you half in cash and half to the company.' }
    ],
    correctAnswer: 'c',
    weight: 1
  },
  {
    id: 'q3',
    category: 'Territory Management',
    question: 'You are assigned a weekly sales target of KSh 150,000 in your territory. How should you structure your weekly schedule to hit this goal?',
    options: [
      { id: 'a', text: 'Wait until Friday and try to contact several bulk buyers at once.' },
      { id: 'b', text: 'Plan a structured route: visit key retail stockists Mon-Wed, open new accounts on Thursday, and follow up repeat replenishments on Friday/Saturday.' },
      { id: 'c', text: 'Only focus on friends and family members.' },
      { id: 'd', text: 'Rely solely on social media posts without in-person field prospecting.' }
    ],
    correctAnswer: 'b',
    weight: 1
  },
  {
    id: 'q4',
    category: 'Customer Relationship & Conflict',
    question: 'A valued customer contacts you upset because their stock delivery was delayed by 3 hours due to logistics. How do you handle the situation?',
    options: [
      { id: 'a', text: 'Ignore their phone calls until the delivery arrives.' },
      { id: 'b', text: 'Blame the transport company and advise the client to complain directly to headquarters.' },
      { id: 'c', text: 'Promptly listen, empathize, verify the exact shipment status with the operations team, provide clear updates, and ensure smooth receipt upon arrival.' },
      { id: 'd', text: 'Tell the customer that delays are normal in business and they should expect them.' }
    ],
    correctAnswer: 'c',
    weight: 1
  },
  {
    id: 'q5',
    category: 'Compliance & Brand Protection',
    question: 'Another sales agent proposes sharing sales leads and splitting commissions outside the official Silent Strides portal. What is your required action?',
    options: [
      { id: 'a', text: 'Accept the arrangement as long as headquarters does not find out.' },
      { id: 'b', text: 'Decline firmly and remind the agent that all sales and commissions must be legitimately recorded in the company portal to maintain accountability.' },
      { id: 'c', text: 'Help them forge customer receipts.' },
      { id: 'd', text: 'Quit working for the company.' }
    ],
    correctAnswer: 'b',
    weight: 1
  },
  {
    id: 'q6',
    category: 'Independent Contractor Role',
    question: 'As a commissioned sales agency partner of Silent Strides Network, how is your earning potential primarily determined?',
    options: [
      { id: 'a', text: 'By a fixed non-performance salary regardless of sales volume.' },
      { id: 'b', text: 'By the hours spent sitting in the office.' },
      { id: 'c', text: 'Directly proportional to the volume and value of verified sales generated in your territory through commission payouts.' },
      { id: 'd', text: 'By seniority and age.' }
    ],
    correctAnswer: 'c',
    weight: 1
  }
];

export const WRITTEN_PITCH_QUESTIONS = [
  {
    id: 'pitch_intro',
    label: 'Sales Elevator Pitch (Written)',
    prompt: 'Write your 60-second elevator pitch to a new retail shop owner or wholesaler in your territory explaining why they should stock Silent Strides Network products.',
    placeholder: 'e.g. Good morning Sir/Madam, I am [Your Name] representing Silent Strides Network. We supply high-demand quality goods with guaranteed restock turnarounds and profit margins for your shop...',
    minWords: 20
  },
  {
    id: 'pitch_network',
    label: 'Market & Network Access',
    prompt: 'Describe your existing network, contacts, or previous sales experience in your selected territory that will enable you to generate sales immediately.',
    placeholder: 'e.g. I have 2 years of field experience in Eldoret CBD and Huruma market, maintaining relationships with over 25 retail merchant outlets...',
    minWords: 15
  }
];

/**
 * Calculates percentage score from candidate answers
 */
export function evaluateAssessmentAnswers(answers = {}) {
  let totalScoreable = ASSESSMENT_QUESTIONS.length;
  let correctCount = 0;
  const questionResults = {};

  for (const q of ASSESSMENT_QUESTIONS) {
    const candidateAnswer = answers[q.id];
    const isCorrect = candidateAnswer === q.correctAnswer;
    if (isCorrect) correctCount += 1;

    questionResults[q.id] = {
      question: q.question,
      category: q.category,
      selected: candidateAnswer,
      correct: q.correctAnswer,
      isCorrect
    };
  }

  const scorePct = Math.round((correctCount / totalScoreable) * 100);

  return {
    scorePct,
    correctCount,
    totalScoreable,
    questionResults,
    writtenPitches: {
      intro: answers['pitch_intro'] || '',
      network: answers['pitch_network'] || ''
    }
  };
}
