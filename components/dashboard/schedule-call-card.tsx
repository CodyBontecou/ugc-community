"use client";

import { Calendar, ArrowRight } from "lucide-react";

const CALENDLY_URL = "https://calendly.com/cody-isolated/30min";

export function ScheduleCallCard() {
  return (
    <div className="bg-gradient-to-br from-coral/10 via-rose/10 to-violet/10 rounded-[--radius-xl] border border-coral/20 p-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-coral to-rose flex items-center justify-center flex-shrink-0">
          <Calendar className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-warm-gray-900 mb-1">
            Let's set up your portfolio
          </h2>
          <p className="text-warm-gray-600 mb-4">
            Book a quick call and I'll walk you through everything — from claiming your subdomain to uploading your first videos.
          </p>
          <a
            href={CALENDLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-coral to-rose text-white font-medium rounded-full hover:opacity-90 transition-opacity"
          >
            Schedule your call
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
