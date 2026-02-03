import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/portfolio/ui/accordion";
import { getSelectedServices, type CreatorData } from "@/lib/portfolio/creator-data";

export function Services({ creator }: { creator: CreatorData }) {
  const { selectedServices } = creator;
  const services = getSelectedServices(selectedServices);

  if (services.length === 0) {
    return null;
  }

  return (
    <section id="services" className="border-t border-border px-6 py-16 md:py-24">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Work With Me
        </p>
        <h2 className="mt-4 text-2xl font-semibold text-foreground md:text-3xl">
          Services
        </h2>
        <p className="mt-4 max-w-xl text-muted-foreground">
          Flexible collaboration options to meet your brand goals. All partnerships include
          professional communication and timely delivery.
        </p>

        <Accordion type="single" collapsible className="mt-10">
          {services.map((service) => (
            <AccordionItem key={service.id} value={service.id} className="border-border">
              <AccordionTrigger className="text-left text-base font-medium hover:no-underline py-5">
                {service.title}
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <p className="text-muted-foreground leading-relaxed">{service.description}</p>
                <div className="mt-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Deliverables Include:
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {service.deliverables.map((item) => (
                      <li key={item} className="bg-secondary px-3 py-1 text-xs text-secondary-foreground">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
