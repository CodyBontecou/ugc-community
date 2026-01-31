import { Inngest, EventSchemas } from "inngest";

// Define event types for type safety
type Events = {
  "portfolio/generate.requested": {
    data: {
      generationId: string;
      questionnaireId: string;
      userId: string;
      adminUserId: string;
    };
  };
};

export const inngest = new Inngest({
  id: "ugc-community",
  schemas: new EventSchemas().fromRecord<Events>(),
});
