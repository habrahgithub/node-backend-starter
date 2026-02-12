using DocSmith.Pulse.Core.Enums;

namespace DocSmith.Pulse.Core.Workflow;

public static class ContentWorkflow
{
    public static bool CanTransition(ContentIdeaStatus from, ContentIdeaStatus to)
    {
        if (from == to)
        {
            return true;
        }

        return (from, to) switch
        {
            (ContentIdeaStatus.Idea, ContentIdeaStatus.Drafted) => true,
            (ContentIdeaStatus.Drafted, ContentIdeaStatus.Approved) => true,
            (ContentIdeaStatus.Approved, ContentIdeaStatus.Scheduled) => true,
            (ContentIdeaStatus.Scheduled, ContentIdeaStatus.Posted) => true,
            (ContentIdeaStatus.Posted, ContentIdeaStatus.Archived) => true,
            (ContentIdeaStatus.Approved, ContentIdeaStatus.Drafted) => true, // regenerate drafts
            _ => false
        };
    }

    public static bool CanSchedule(ContentIdeaStatus currentStatus, DateTime? scheduledForUtc)
    {
        if (currentStatus != ContentIdeaStatus.Approved)
        {
            return false;
        }

        return scheduledForUtc.HasValue;
    }
}
