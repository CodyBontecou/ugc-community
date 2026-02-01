import { Inngest, EventSchemas } from "inngest";

// Define event types for type safety
type Events = {
  "portfolio/generate.requested": {
    data: {
      generationId: string;
      questionnaireId: string;
      userId: string;
      // GitHub repo full name (e.g., "username/repo-name") - pre-created on questionnaire submit
      githubRepoFullName?: string;
      // Admin user ID - optional for backward compatibility (uses service token when not provided)
      adminUserId?: string;
    };
  };
  "media/video.uploaded": {
    data: {
      mediaId: string;
      userId: string;
      videoUrl: string;
    };
  };
};

export const inngest = new Inngest({
  id: "ugc-community",
  schemas: new EventSchemas().fromRecord<Events>(),
});
