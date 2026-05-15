export function getAllSettings() {
  return [
    {
      name: 'claimTtlMinutes',
      type: 'number' as const,
      label: 'Claim duration (minutes)',
      helpText: 'How long a "Claim for Review" holds before auto-expiring.',
      defaultValue: 5,
      onValidate: ({ value }: { value: unknown }) => {
        if (typeof value !== 'number' || value < 1 || value > 60) {
          return 'Must be between 1 and 60 minutes.';
        }
      },
    },
    {
      name: 'investigateTtlMinutes',
      type: 'number' as const,
      label: 'Investigating duration (minutes)',
      helpText: 'How long a "Mark: Investigating" hold lasts.',
      defaultValue: 30,
      onValidate: ({ value }: { value: unknown }) => {
        if (typeof value !== 'number' || value < 5 || value > 120) {
          return 'Must be between 5 and 120 minutes.';
        }
      },
    },
    {
      name: 'enableAutoRelease',
      type: 'boolean' as const,
      label: 'Auto-release claim on mod action',
      helpText: 'Automatically release a claim when the mod removes or approves an item.',
      defaultValue: true,
    },
    {
      name: 'enableDailySummary',
      type: 'boolean' as const,
      label: 'Send daily activity digest via modmail',
      helpText: 'Posts a daily summary of mod activity to subreddit modmail.',
      defaultValue: false,
    },
  ];
}
