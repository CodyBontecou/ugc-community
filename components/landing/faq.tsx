const questions = [
  {
    question: "What is ugc.community?",
    answer: "ugc.community is a portfolio and campaign platform for user-generated-content creators. It combines creator subdomains, a public directory, job hooks, milestone rewards, and performance analytics.",
  },
  {
    question: "Who is it for?",
    answer: "It is designed for UGC creators who publish short-form brand content and want a dedicated portfolio URL, campaign opportunities, and a way to track portfolio and post activity.",
  },
  {
    question: "How does the free Creator Partner plan work?",
    answer: "The current plan is free with content participation. Creators use campaign hooks and tag @ugc.community; qualifying activity unlocks hosting, edits, analytics, and milestone rewards described on this page.",
  },
  {
    question: "What happens after I connect TikTok?",
    answer: "The platform checks connected TikTok activity on a schedule and uses automated matching to associate posts with relevant campaign hooks. The dashboard shows matched activity and earned milestones.",
  },
  {
    question: "Do creators get their own website?",
    answer: "Creators can receive a subdomain such as yourname.ugc.community and a custom portfolio that presents their work, profile, and contact path.",
  },
  {
    question: "Where can I review data and service terms?",
    answer: "The website privacy page explains account, portfolio, analytics, and connected-platform data. The terms page explains participation, acceptable use, content rights, and service availability.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="relative z-[1] py-32">
      <div className="container">
        <div className="text-center mb-16">
          <span className="inline-block py-1.5 px-4 bg-peach-100 text-rose rounded-full text-xs font-semibold uppercase tracking-wider mb-6">FAQ</span>
          <h2 className="text-[clamp(2.5rem,5vw,3.5rem)]">Questions from creators</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {questions.map((item) => (
            <article key={item.question} className="bg-white rounded-[--radius-xl] p-8 border border-warm-gray-100">
              <h3 className="font-[family-name:var(--font-body)] font-semibold text-xl text-warm-gray-900 mb-3">{item.question}</h3>
              <p className="text-warm-gray-500 leading-relaxed">{item.answer}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
