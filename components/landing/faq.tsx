const questions = [
  { question: "Who is the database for?", answer: "Brands, agencies, and teams looking for UGC creators to research for upcoming campaigns." },
  { question: "Where does the data come from?", answer: "The planned database uses details shared in public posts and comments on r/UGCcreators. Records can include social links, portfolios, emails, and the original source context, depending on what was shared." },
  { question: "How will updates work?", answer: "New records will be added as Subscrape uploads are processed. There is no guaranteed refresh interval, and a capture date does not mean a contact detail has been reverified." },
  { question: "Can I subscribe today?", answer: "Subscriptions are not open yet. You can try the searchable sample preview and join early access. Pricing and access details will be announced before launch." },
  { question: "Are these creators verified or available?", answer: "A shared link or email does not confirm identity, availability, or permission to contact someone. Review the source context and confirm details directly before planning a collaboration." },
  { question: "Can I correct or remove my details?", answer: "Yes. Email cody@isolated.tech with the record or source link and the correction or removal you are requesting." },
];

export function FAQ() {
  return (
    <section id="faq" className="relative z-[1] py-32">
      <div className="container">
        <div className="text-center mb-16">
          <span className="inline-block py-1.5 px-4 bg-peach-100 text-rose rounded-full text-xs font-semibold uppercase tracking-wider mb-6">FAQ</span>
          <h2 className="text-[clamp(2.5rem,5vw,3.5rem)]">A few things to know</h2>
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
