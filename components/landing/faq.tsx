const questions = [
  { question: "Is the job board free?", answer: "Yes. Creators can browse for free, and brands can submit jobs for free during launch. Every submitted listing is reviewed before publication." },
  { question: "What is an external opportunity?", answer: "A hiring opportunity collected from a public source. The listing includes its source and sends you to the original application destination. It is not a job posted directly to ugc.community by that employer." },
  { question: "What does Posted directly mean?", answer: "The listing was submitted to ugc.community and manually reviewed. Direct submissions require compensation, deliverables, eligibility, usage rights, and a closing date." },
  { question: "Are all opportunities paid?", answer: "Compensation labels distinguish guaranteed cash, base plus variable pay, performance-only pay, affiliate work, and gifted or unpaid opportunities. Missing terms in external sources are marked as not stated." },
  { question: "How do you keep listings current?", answer: "Listings disappear after their closing date. External opportunities also expire from the feed seven days after the last manual freshness review unless checked again. A scrape date alone does not confirm that applications are still open." },
  { question: "How can I report an expired or incorrect job?", answer: "Email cody@isolated.tech with the listing or source link. We can correct or close the listing after review." },
];

export function FAQ() {
  return (
    <section id="faq" className="relative z-[1] py-16 sm:py-24 lg:py-32">
      <div className="container">
        <div className="text-center mb-10 sm:mb-16">
          <span className="inline-block py-1.5 px-4 bg-peach-100 text-rose rounded-full text-xs font-semibold uppercase tracking-wider mb-6">FAQ</span>
          <h2 className="text-[clamp(2.5rem,5vw,3.5rem)]">A few things to know</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {questions.map((item) => (
            <article key={item.question} className="bg-white rounded-[var(--radius-xl)] p-5 sm:p-8 border border-warm-gray-100">
              <h3 className="font-[family-name:var(--font-body)] font-semibold text-xl text-warm-gray-900 mb-3">{item.question}</h3>
              <p className="text-warm-gray-500 leading-relaxed">{item.answer}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
